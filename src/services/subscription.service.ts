import { supabaseAdmin } from "@/lib/supabase";
import { stripe, PLANS } from "@/lib/stripe";

/**
 * Check if a user has an active Pro subscription.
 */
export async function isUserPro(userId: string): Promise<boolean> {
  // Check profile cache first
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("is_pro, pro_expires_at")
    .eq("id", userId)
    .single();

  if (profile?.is_pro && profile.pro_expires_at) {
    return new Date(profile.pro_expires_at) > new Date();
  }

  // Fallback: check subscriptions table
  const { data: sub } = await supabaseAdmin
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", userId)
    .in("status", ["active", "trialing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return !!sub && new Date(sub.current_period_end) > new Date();
}

/**
 * Get user's subscription details.
 */
export async function getUserSubscription(userId: string) {
  const { data } = await supabaseAdmin
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return data;
}

/**
 * Get or create Stripe customer for a user.
 */
export async function getOrCreateStripeCustomer(userId: string): Promise<string> {
  // Check existing
  const { data: existing } = await supabaseAdmin
    .from("stripe_customers")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .single();

  if (existing) return existing.stripe_customer_id;

  // Get user profile for email
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("username, id")
    .eq("id", userId)
    .single();

  // Create Stripe customer
  const customer = await stripe.customers.create({
    metadata: {
      userId,
      username: profile?.username || "",
    },
  });

  // Save mapping
  await supabaseAdmin.from("stripe_customers").insert({
    user_id: userId,
    stripe_customer_id: customer.id,
  });

  return customer.id;
}

/**
 * Create a checkout session for Pro subscription.
 */
export async function createProCheckout(
  userId: string,
  plan: "pro_monthly" | "pro_yearly",
  successUrl: string,
  cancelUrl: string,
) {
  const customerId = await getOrCreateStripeCustomer(userId);
  const priceId = plan === "pro_monthly"
    ? PLANS.PRO_MONTHLY.priceId
    : PLANS.PRO_YEARLY.priceId;

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      trial_period_days: 7,
      metadata: { userId, plan },
    },
    metadata: { userId, plan },
    allow_promotion_codes: true,
  });

  return session;
}

/**
 * Create a checkout session for VeloCoins purchase.
 */
export async function createCoinsCheckout(
  userId: string,
  coinPackId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
) {
  const customerId = await getOrCreateStripeCustomer(userId);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId, type: "coins_purchase", coinPackId },
  });

  return session;
}

/**
 * Create Stripe billing portal session.
 */
export async function createBillingPortal(userId: string, returnUrl: string) {
  const customerId = await getOrCreateStripeCustomer(userId);

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

/**
 * Sync subscription status from webhook event.
 */
export async function syncSubscription(
  stripeSubscriptionId: string,
  status: string,
  userId: string,
  priceId: string,
  currentPeriodStart: number,
  currentPeriodEnd: number,
  cancelAtPeriodEnd: boolean,
  trialEnd?: number | null,
) {
  const plan = priceId === PLANS.PRO_MONTHLY.priceId ? "pro_monthly" : "pro_yearly";

  await supabaseAdmin.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_subscription_id: stripeSubscriptionId,
      stripe_price_id: priceId,
      plan,
      status,
      current_period_start: new Date(currentPeriodStart * 1000).toISOString(),
      current_period_end: new Date(currentPeriodEnd * 1000).toISOString(),
      cancel_at_period_end: cancelAtPeriodEnd,
      trial_end: trialEnd ? new Date(trialEnd * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" },
  );

  // Update profile cache
  const isActive = ["active", "trialing"].includes(status);
  await supabaseAdmin.from("profiles").update({
    is_pro: isActive,
    pro_expires_at: new Date(currentPeriodEnd * 1000).toISOString(),
  }).eq("id", userId);
}
