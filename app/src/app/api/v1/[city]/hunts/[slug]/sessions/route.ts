import { envelope, error, getHunt, loadCityData } from "../../../../_lib/data";

export async function POST(request: Request, context: { params: Promise<{ city: string; slug: string }> }) {
  const { city, slug } = await context.params;
  const data = await loadCityData(city);
  if (!data) return error(404, "City not found");
  const hunt = getHunt(data, slug);
  if (!hunt) return error(404, "Hunt not found");
  const payload = await request.json().catch(() => ({})) as { team_name?: string; email?: string; mode?: string };
  const id = `session_${Date.now().toString(36)}`;
  const startIndex = payload.team_name ? [...payload.team_name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % Math.max(1, hunt.stop_ids.length) : 0;
  return envelope(city, {
    id,
    hunt_id: hunt.id,
    hunt_slug: hunt.slug,
    team_name: payload.team_name ?? "Anonymous team",
    email: payload.email ?? null,
    current_stop_index: 0,
    start_index: startIndex,
    stop_ids: hunt.stop_ids,
    paid: hunt.mode === "friendly",
    stripe_payment_id: null,
    photos_consented: false,
    postcard_url: `/api/v1/${city}/sessions/${id}/postcard`,
    created_at: new Date().toISOString(),
  }, "runtime-overlay");
}
