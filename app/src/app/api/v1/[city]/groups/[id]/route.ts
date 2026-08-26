import { envelope, error, getHuntGroup, hydrateHuntGroup, loadCityData } from "../../../_lib/data";

/* The board polls this while teams walk, so it stays cheap: counts and names only,
   never the stops themselves. */
export async function GET(_request: Request, context: { params: Promise<{ city: string; id: string }> }) {
  const { city, id } = await context.params;
  const data = await loadCityData(city);
  if (!data) return error(404, "City not found");
  const group = await getHuntGroup(city, id);
  if (!group) return error(404, "Group not found");
  return envelope(city, await hydrateHuntGroup(city, group), "runtime-overlay");
}
