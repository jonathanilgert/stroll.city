import Stripe from "stripe";
import type { BusinessClaim } from "./data";

const apiVersion = "2026-07-29.dahlia";

export const paidPlanPrices: Record<"stroll" | "stroll_plus", { name: string; cents: number }> = {
  stroll: { name: "Stroll business profile", cents: 2900 },
  stroll_plus: { name: "Stroll+ business profile", cents: 5900 },
};

export function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion });
}

export async function createClaimCheckoutSession(city: string, claim: BusinessClaim, businessName: string) {
  if (claim.plan_tier !== "stroll" && claim.plan_tier !== "stroll_plus") return null;
  const stripe = stripeClient();
  if (!stripe) return null;

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://stroll.city";
  const plan = paidPlanPrices[claim.plan_tier];
  return stripe.checkout.sessions.create({
    mode: "subscription",
    integration_identifier: "strollcity_jxmfqkpr",
    customer_email: claim.claimant_email,
    client_reference_id: claim.id,
    success_url: `${origin}/portal?claim=${encodeURIComponent(claim.id)}&checkout=success`,
    cancel_url: `${origin}/portal?claim=${encodeURIComponent(claim.id)}&checkout=cancelled`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "cad",
          recurring: { interval: "month" },
          unit_amount: plan.cents,
          product_data: {
            name: plan.name,
            description: `${businessName} on Stroll.city`,
            tax_code: "txcd_10000000",
            metadata: { city, claim_id: claim.id, business_id: claim.business_id, plan_tier: claim.plan_tier },
          },
        },
      },
    ],
    metadata: { city, claim_id: claim.id, business_id: claim.business_id, plan_tier: claim.plan_tier },
    subscription_data: { metadata: { city, claim_id: claim.id, business_id: claim.business_id, plan_tier: claim.plan_tier } },
    allow_promotion_codes: true,
  });
}
