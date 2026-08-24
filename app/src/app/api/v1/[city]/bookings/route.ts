import { envelope, error } from "../../_lib/data";

type BookingProduct = {
  label: string;
  teamLimit: number | null;
  amountCad: (groupSize: number) => number;
};

const products: Record<string, BookingProduct> = {
  friendly: { label: "Friendly Mode", teamLimit: 1, amountCad: () => 0 },
  full: { label: "Full Hunt", teamLimit: 1, amountCad: () => 20 },
  race: { label: "Loop Race", teamLimit: 8, amountCad: (groupSize) => Math.max(2, groupSize) * 15 },
  group: { label: "Group booking", teamLimit: null, amountCad: (groupSize) => Math.max(199, Math.max(1, groupSize) * 9) },
  school: { label: "School or youth group", teamLimit: null, amountCad: (groupSize) => Math.max(99, Math.max(1, groupSize) * 4) },
  charity: { label: "Charity fundraiser", teamLimit: null, amountCad: () => 299 },
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
  const groupSize = Math.max(1, Number(payload.groupSize ?? 1));
  const amountCad = product.amountCad(groupSize);
  const stripeReady = Boolean(process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  const mockCheckoutUrl = `/events/confirm?booking=${encodeURIComponent(id)}&mode=${stripeReady ? "payment" : "request"}`;

  return envelope(city, {
    id,
    city,
    product: payload.product,
    label: product.label,
    amount_cad: amountCad,
    team_limit: product.teamLimit,
    audience: payload.audience ?? "family",
    group_size: groupSize,
    starts_at_local: `${payload.date}T${payload.time}`,
    finish_preference: payload.finishPreference ?? "surprise me",
    paid: amountCad === 0,
    checkout_mode: stripeReady ? "payment" : "request",
    checkout_url: mockCheckoutUrl,
    stripe_note: stripeReady ? "Payment details can be confirmed after route approval." : "No payment collected in this request.",
    waiver_required: amountCad > 0 || payload.product !== "friendly",
    youth_policy_note: "Booking organisation keeps custody/supervision responsibility for minors.",
    cancellation_policy: "Free reschedule with 24 hours notice; full refund if stroll.city cancels; no refund for no-shows.",
    created_at: now,
  }, "runtime-overlay");
}
