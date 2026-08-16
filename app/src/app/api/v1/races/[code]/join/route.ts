import { envelope } from "../../../_lib/data";

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  const payload = await request.json().catch(() => ({})) as { team_name?: string };
  return envelope("race", {
    code: code.toUpperCase(),
    team_name: payload.team_name ?? "Team",
    joined: true,
    start_index: payload.team_name ? [...payload.team_name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 6 : 0,
    analytics_event: "race_joined",
    created_at: new Date().toISOString(),
  }, "runtime-overlay");
}
