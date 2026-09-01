import { claimRaceTeam, envelope, error } from "../../../_lib/data";

/* Joining hands the phone its own punch card. An unknown code is an error, not a
   cheerful yes — telling someone they joined a race that does not exist sends
   them out to walk a hunt that will never load. */
export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  const payload = await request.json().catch(() => ({})) as { team_name?: string; city?: string };
  const city = payload.city ?? "calgary";
  const result = await claimRaceTeam(city, code, payload.team_name ?? "");
  if (!result) return error(404, "No race with that code");
  if (!result.session) return error(409, "Every team slot in this race has been claimed");
  return envelope(city, {
    code: result.group.code,
    group_id: result.group.id,
    session_id: result.session.id,
    hunt_url: `/${city}/hunt/${result.session.id}`,
    team_name: result.session.team_name,
    start_index: result.session.start_index,
    total_stops: result.session.stops.length,
    rejoined: result.rejoined,
    joined: true,
    analytics_event: "race_joined",
    created_at: new Date().toISOString(),
  }, "runtime-overlay");
}
