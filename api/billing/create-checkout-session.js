import { requireUser } from "../_lib/requireUser.js";
import { createCheckoutSession } from "../_lib/stripe.js";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const auth = await requireUser(req, res);
  if (!auth) return;

  try {
    const session = await createCheckoutSession({ customerEmail: auth.user.email, userId: auth.user.id });
    try {
      const admin = getSupabaseAdmin();
      await admin.from("user_events").insert({
        user_id: auth.user.id,
        event_name: "upgrade_started",
        occurred_at: new Date().toISOString(),
        platform: "web",
        metadata: { source: "billing_checkout" },
      });
    } catch (eventError) {
      console.warn("[billing/create-checkout-session] Failed to track upgrade_started:", eventError?.message || eventError);
    }
    res.status(200).json({ id: session.id, url: session.url });
  } catch (error) {
    console.error("[billing/create-checkout-session]", error);
    res.status(500).json({ error: error.message || "Failed to create checkout session." });
  }
}
