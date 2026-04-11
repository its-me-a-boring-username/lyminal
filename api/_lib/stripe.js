function toStripeBody(payload) {
  return new URLSearchParams(payload).toString();
}

async function stripeRequest(path, payload) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY is not configured.");

  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: toStripeBody(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || "Stripe request failed.");
  }
  return data;
}

export async function createCheckoutSession({ customerEmail, userId }) {
  const priceId = process.env.STRIPE_PRICE_ID;
  const successUrl = process.env.STRIPE_SUCCESS_URL || `${process.env.APP_URL || "http://localhost:5173"}/?billing=success`;
  const cancelUrl = process.env.STRIPE_CANCEL_URL || `${process.env.APP_URL || "http://localhost:5173"}/?billing=cancel`;

  if (!priceId) throw new Error("STRIPE_PRICE_ID is not configured.");

  return stripeRequest("checkout/sessions", {
    mode: "subscription",
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: customerEmail,
    "metadata[user_id]": userId,
  });
}

export async function createPortalSession({ customerId }) {
  const returnUrl = process.env.STRIPE_PORTAL_RETURN_URL || `${process.env.APP_URL || "http://localhost:5173"}/`;
  if (!customerId) throw new Error("Missing Stripe customer id.");

  return stripeRequest("billing_portal/sessions", {
    customer: customerId,
    return_url: returnUrl,
  });
}

export async function fetchSubscription(subscriptionId) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY is not configured.");

  const response = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || "Failed to fetch subscription.");
  }
  return data;
}
