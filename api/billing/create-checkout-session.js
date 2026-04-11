import { requireUser } from "../_lib/requireUser.js";
import { createCheckoutSession } from "../_lib/stripe.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const auth = await requireUser(req, res);
  if (!auth) return;

  try {
    const session = await createCheckoutSession({ customerEmail: auth.user.email, userId: auth.user.id });
    res.status(200).json({ id: session.id, url: session.url });
  } catch (error) {
    console.error("[billing/create-checkout-session]", error);
    res.status(500).json({ error: error.message || "Failed to create checkout session." });
  }
}
