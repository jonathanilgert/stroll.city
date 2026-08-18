import { envelope, error } from "../../_lib/data";

const products: Record<string, { label: string; price: number; teams: number; stripePriceEnv?: string }> = {
  friendly: { label: "Friendly Mode", price: 0, teams: 1 },
  full: { label: "Full Hunt", price: 20, teams: 1 },
  race: { label: "Loop Race", price: 20, teams: 2 },
  private: { label: "Private Event", price: 199, teams: 6 },
  corporate: { label: "Corporate", price: 499, teams: 10 },
  school: { label: "School / youth non-profit", price: 99, teams: 8 },
  charity: { label: "Charity fundraiser", price: 299, teams: 20 },
};

type BookingPayload = {
  product?: string;
  email?: string;
  date?: string;
  time?: string;
  groupSize?: number;
  audience?: "adult" | "family";
  finishPreference?: string;
};

export async function POST(request: Request, context: { params: Promise<{ city: string }> }) {
  const { city } = await context.params;
  const payload = await request.json().catch(() => ({})) as BookingPayload;
  const product = products[payload.product ?? ""];
  if (!product) return error(400, "Unknown booking product");
  if (!payload.email || !payload.email.includes("@")) return error(400, "Valid email required");
  if (!payload.date || !payload.time) return error(400, "Date and time required");

  const now = new Date().toISOString();
  const id = `booking_${Date.now().toString(36)}`;
  const stripeReady = Boolean(process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  const mockCheckoutUrl = `/events/confirm?booking=${encodeURIComponent(id)}&mode=${stripeReady ? "payment" : "request"}`;

  return envelope(city, {
    id,
    city,
    product: payload.product,
    label: product.label,
    amount_cad: product.price,
    team_limit: product.teams,
    audience: payload.audience ?? "family",
    group_size: Math.max(1, Number(payload.groupSize ?? 1)),
    starts_at_local: `${payload.date}T${payload.time}`,
    finish_preference: payload.finishPreference ?? "surprise me",
    paid: product.price === 0,
    checkout_mode: stripeReady ? "payment" : "request",
    checkout_url: mockCheckoutUrl,
    stripe_note: stripeReady ? "Payment details can be confirmed after route approval." : "No payment collected in this request.",
    waiver_required: product.price > 0 || payload.product !== "friendly",
    youth_policy_note: "Booking organisation keeps custody/supervision responsibility for minors.",
    cancellation_policy: "Free reschedule with 24 hours notice; full refund if stroll.city cancels; no refund for no-shows.",
    created_at: now,
  }, "runtime-overlay");
}
