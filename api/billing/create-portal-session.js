import { requireUser } from "../_lib/requireUser.js";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js";
import { createPortalSession } from "../_lib/stripe.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const auth = await requireUser(req, res);
  if (!auth) return;

  try {
    const admin = getSupabaseAdmin();
    const { data: profile, error } = await admin.from("profiles").select("stripe_customer_id").eq("id", auth.user.id).maybeSingle();
    if (error) throw error;
    if (!profile?.stripe_customer_id) return res.status(400).json({ error: "No Stripe customer found for this account yet." });

    const session = await createPortalSession({ customerId: profile.stripe_customer_id });
    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("[billing/create-portal-session]", error);
    res.status(500).json({ error: error.message || "Failed to create billing portal session." });
  }
}
