import { checkHuntAnswer, envelope, error, hydrateHuntSession, loadCityData } from "../../../../_lib/data";

export async function POST(request: Request, context: { params: Promise<{ city: string; id: string }> }) {
  const { city, id } = await context.params;
  const data = await loadCityData(city);
  if (!data) return error(404, "City not found");
  const payload = await request.json().catch(() => ({})) as { stop_id?: string; guess?: string };
  const guess = String(payload.guess ?? "").slice(0, 120);
  if (!guess.trim()) return error(400, "A guess is required");
  const result = await checkHuntAnswer(city, id, String(payload.stop_id ?? ""), guess, data);
  if (!result) return error(404, "Session or stop not found");
  /* A wrong guess is a normal answer, not an error: 200 with correct:false. */
  return envelope(city, { correct: result.correct, session: hydrateHuntSession(result.session, data) }, "runtime-overlay");
}
