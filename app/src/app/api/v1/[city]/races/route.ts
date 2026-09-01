import { createHuntGroup, envelope, error, getHunt, loadCityData } from "../../_lib/data";

/* A race is a hunt group whose teams arrive separately. Creating one makes the
   real sessions up front — one per team slot, each with its own rotated start —
   so the join code has something to hand out rather than a promise. */
export async function POST(request: Request, context: { params: Promise<{ city: string }> }) {
  const { city } = await context.params;
  const data = await loadCityData(city);
  if (!data) return error(404, "City not found");
  const payload = await request.json().catch(() => ({})) as {
    hunt_slug?: string;
    team_count?: number;
    name?: string;
    theme?: string;
    starts_at?: string;
    host_email?: string;
  };
  const hunt = getHunt(data, payload.hunt_slug ?? "loop-race");
  if (!hunt) return error(404, "Hunt not found");

  const teamCount = Math.min(8, Math.max(2, Number(payload.team_count ?? 2) || 2));
  const { group, sessions } = await createHuntGroup(city, hunt, {
    group_name: payload.name ?? "Loop Race",
    /* Placeholder names are the open slots teams claim with the code. */
    team_names: Array.from({ length: teamCount }, (_, i) => `Team ${i + 1}`),
    party_size: teamCount * 2,
    email: payload.host_email,
    theme: payload.theme,
  }, data);

  return envelope(city, {
    code: group.code,
    group_id: group.id,
    join_url: `/race/${group.code}`,
    board_url: `/${city}/hunt/group/${group.id}`,
    hunt_id: hunt.id,
    hunt_name: hunt.name,
    team_count: teamCount,
    starts_at: payload.starts_at ?? null,
    status: "open",
    paid: false,
    amount_cad: teamCount * 20,
    checkout_mode: process.env.STRIPE_SECRET_KEY ? "payment" : "request",
    rotation: sessions.map((session, index) => ({
      team_slot: index + 1,
      start_index: session.start_index,
      session_id: session.id,
    })),
    analytics_event: "race_created",
    created_at: group.created_at,
  }, "runtime-overlay");
}
