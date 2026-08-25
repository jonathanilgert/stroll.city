import Stripe from "stripe";
import { markClaimCheckoutPaid, updateClaimBySubscription } from "../../_lib/data";
import { stripeClient } from "../../_lib/stripe";

export async function POST(request: Request) {
  const stripe = stripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) return Response.json({ error: "Stripe webhook is not configured" }, { status: 503 });

  const signature = request.headers.get("stripe-signature");
  if (!signature) return Response.json({ error: "Missing Stripe signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, webhookSecret);
  } catch {
    return Response.json({ error: "Invalid Stripe signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status === "unpaid") return Response.json({ received: true, deferred: true });
    const city = session.metadata?.city;
    const claimId = session.metadata?.claim_id ?? session.client_reference_id ?? undefined;
    if (city && claimId) {
      await markClaimCheckoutPaid(city, claimId, {
        stripe_customer_id: typeof session.customer === "string" ? session.customer : session.customer?.id,
        stripe_subscription_id: typeof session.subscription === "string" ? session.subscription : session.subscription?.id,
      });
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const city = subscription.metadata?.city;
    if (city) await updateClaimBySubscription(city, subscription.id, { payment_status: "cancelled" });
  }

  return Response.json({ received: true });
}
