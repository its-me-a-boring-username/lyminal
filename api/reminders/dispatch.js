import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js";

function isDue(schedule) {
  if (!schedule?.scheduledFor || schedule?.status !== "scheduled") return false;
  const dueMs = Date.parse(schedule.scheduledFor);
  if (Number.isNaN(dueMs)) return false;
  return dueMs <= Date.now();
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const secret = process.env.REMINDER_DISPATCH_SECRET;
  if (secret && req.headers["x-reminder-secret"] !== secret) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const admin = getSupabaseAdmin();
    const { data: rows, error } = await admin.from("active_goals").select("user_id, goal_id, action_items");
    if (error) throw error;

    let delivered = 0;

    for (const row of rows || []) {
      const originalItems = Array.isArray(row.action_items) ? row.action_items : [];
      let changed = false;

      const updatedItems = originalItems.map((item) => {
        const schedule = item?.schedule || null;
        if (!isDue(schedule)) return item;

        changed = true;
        delivered += 1;
        return {
          ...item,
          schedule: {
            ...schedule,
            status: "delivered",
            deliveredAt: new Date().toISOString(),
          },
        };
      });

      if (changed) {
        await admin.from("active_goals").update({ action_items: updatedItems, updated_at: new Date().toISOString() }).eq("user_id", row.user_id).eq("goal_id", row.goal_id);
      }
    }

    res.status(200).json({ ok: true, delivered });
  } catch (error) {
    console.error("[reminders/dispatch]", error);
    res.status(500).json({ error: error.message || "Dispatch failed." });
  }
}
