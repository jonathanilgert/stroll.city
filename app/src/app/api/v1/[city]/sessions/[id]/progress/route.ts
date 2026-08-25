import { envelope, error, hydrateHuntSession, loadCityData, recordHuntProgress } from "../../../../_lib/data";

export async function POST(request: Request, context: { params: Promise<{ city: string; id: string }> }) {
  const { city, id } = await context.params;
  const data = await loadCityData(city);
  if (!data) return error(404, "City not found");
  const payload = await request.json().catch(() => ({})) as {
    stop_id?: string;
    action?: string;
    clues_used?: number;
    seconds?: number;
    elapsed_seconds?: number;
  };
  const session = await recordHuntProgress(city, id, payload);
  /* One 404 covers both an unknown session and a stop that isn't on this walk —
     the client can't tell them apart and shouldn't act differently either way. */
  if (!session) return error(404, "Session or stop not found");
  return envelope(city, hydrateHuntSession(session, data), "runtime-overlay");
}
