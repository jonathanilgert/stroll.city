import { envelope, error, getHuntSession, hydrateHuntSession, loadCityData } from "../../../_lib/data";

/* Resuming a walk: the dashboard reads the session back on every load, so a
   refresh or a second phone picks up the same punch card. */
export async function GET(_request: Request, context: { params: Promise<{ city: string; id: string }> }) {
  const { city, id } = await context.params;
  const data = await loadCityData(city);
  if (!data) return error(404, "City not found");
  const session = await getHuntSession(city, id);
  if (!session) return error(404, "Session not found");
  return envelope(city, hydrateHuntSession(session, data), "runtime-overlay");
}
