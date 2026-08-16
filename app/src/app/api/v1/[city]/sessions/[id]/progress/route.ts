import { envelope } from "../../../../_lib/data";

export async function POST(request: Request, context: { params: Promise<{ city: string; id: string }> }) {
  const { city, id } = await context.params;
  const payload = await request.json().catch(() => ({})) as { stop_id?: string; action?: string; clues_used?: number; seconds?: number };
  return envelope(city, {
    session_id: id,
    stop_id: payload.stop_id ?? null,
    action: payload.action ?? "stop_solved",
    clues_used: Math.max(0, Number(payload.clues_used ?? 0)),
    seconds: Math.max(0, Number(payload.seconds ?? 0)),
    accepted: true,
    analytics_event: payload.action === "clue_revealed" ? "clue_revealed" : "stop_solved",
    created_at: new Date().toISOString(),
  }, "runtime-overlay");
}
