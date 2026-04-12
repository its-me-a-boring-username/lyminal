import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js";
import { fetchSubscription } from "../_lib/stripe.js";

function getTierFromSubscription(status) {
  if (status === "active" || status === "trialing") return "paid_2";
  return "free";
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const event = req.body;
  if (!event?.type) return res.status(400).json({ error: "Invalid event payload." });

  try {
    const admin = getSupabaseAdmin();
    const obj = event?.data?.object || {};

    if (event.type === "checkout.session.completed") {
      const userId = obj?.metadata?.user_id;
      const customerId = obj?.customer || null;
      const subscriptionId = obj?.subscription || null;

      if (userId) {
        const tier = subscriptionId ? getTierFromSubscription((await fetchSubscription(subscriptionId)).status) : "paid_2";
        await admin.from("profiles").upsert({
          id: userId,
          tier,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          updated_at: new Date().toISOString(),
        }, { onConflict: "id" });

        try {
          await admin.from("user_events").insert({
            user_id: userId,
            event_name: "upgrade_completed",
            occurred_at: new Date().toISOString(),
            platform: "web",
            metadata: {
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              event_type: event.type,
            },
          });
        } catch (eventError) {
          console.warn("[billing/webhook] Failed to track upgrade_completed:", eventError?.message || eventError);
        }
      }
    }

    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const customerId = obj?.customer;
      if (customerId) {
        const tier = getTierFromSubscription(obj?.status);
        await admin.from("profiles").update({ tier, stripe_subscription_id: obj?.id || null, updated_at: new Date().toISOString() }).eq("stripe_customer_id", customerId);
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("[billing/webhook]", error);
    res.status(500).json({ error: error.message || "Webhook processing failed." });
  }
}
