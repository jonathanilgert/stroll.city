import { envelope, error } from "../../_lib/data";

const allowed = new Set([
  "listing_confirmed", "listing_edited", "panel_opened", "filter_applied",
  "hunt_started", "stop_solved", "clue_revealed", "stop_skipped", "photo_uploaded",
  "hunt_completed", "postcard_generated", "card_shared", "draw_entered",
  "deal_claimed", "deal_redeemed", "race_created", "race_joined", "race_finished", "finisher_treat_offered", "finisher_treat_redeemed", "draw_entered",
  "event_booked", "claim_started", "claim_completed", "claim_frozen", "sticker_scan",
]);

export async function POST(request: Request, context: { params: Promise<{ city: string }> }) {
  const { city } = await context.params;
  const payload = await request.json().catch(() => ({})) as { event?: string; properties?: Record<string, unknown>; session_id?: string };
  if (!payload.event || !allowed.has(payload.event)) return error(400, "Unknown analytics event");
  return envelope(city, {
    id: `evt_${Date.now().toString(36)}`,
    event: payload.event,
    properties: payload.properties ?? {},
    session_id: payload.session_id ?? null,
    accepted: true,
    storage: process.env.NEXT_PUBLIC_SUPABASE_URL ? "supabase-ready" : "local-preview",
    created_at: new Date().toISOString(),
  }, "runtime-overlay");
}
