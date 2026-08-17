import { envelope, error, getHunt, loadCityData } from "../../_lib/data";

export async function POST(request: Request, context: { params: Promise<{ city: string }> }) {
  const { city } = await context.params;
  const data = await loadCityData(city);
  if (!data) return error(404, "City not found");
  const payload = await request.json().catch(() => ({})) as { hunt_slug?: string; team_count?: number; starts_at?: string; host_email?: string };
  const hunt = getHunt(data, payload.hunt_slug ?? "loop-race");
  if (!hunt) return error(404, "Hunt not found");
  const code = Math.random().toString(36).slice(2, 6).toUpperCase();
  return envelope(city, {
    code,
    join_url: `/race/${code}`,
    hunt_id: hunt.id,
    team_count: Math.min(8, Math.max(2, Number(payload.team_count ?? 2))),
    starts_at: payload.starts_at ?? null,
    status: "open",
    paid: false,
    amount_cad: Math.min(8, Math.max(2, Number(payload.team_count ?? 2))) * 20,
    checkout_mode: process.env.STRIPE_SECRET_KEY ? "payment" : "request",
    rotation: hunt.stop_ids.slice(0, 6).map((stopId, index) => ({ team_slot: index + 1, start_index: index, stop_id: stopId })),
    analytics_event: "race_created",
    created_at: new Date().toISOString(),
  }, "runtime-overlay");
}
