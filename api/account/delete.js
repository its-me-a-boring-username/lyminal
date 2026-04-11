import { requireUser } from "../_lib/requireUser.js";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const auth = await requireUser(req, res);
  if (!auth) return;

  try {
    const admin = getSupabaseAdmin();
    const uid = auth.user.id;

    await admin.from("active_goals").delete().eq("user_id", uid);
    await admin.from("charts").delete().eq("user_id", uid);
    await admin.from("profiles").delete().eq("id", uid);

    const { error } = await admin.auth.admin.deleteUser(uid);
    if (error) throw error;

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error("[account/delete]", error);
    res.status(500).json({ error: error.message || "Failed to delete account." });
  }
}
