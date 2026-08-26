import { createHuntGroup, envelope, error, getHunt, hydrateHuntGroup, loadCityData } from "../../../../_lib/data";

export async function POST(request: Request, context: { params: Promise<{ city: string; slug: string }> }) {
  const { city, slug } = await context.params;
  const data = await loadCityData(city);
  if (!data) return error(404, "City not found");
  const hunt = getHunt(data, slug);
  if (!hunt) return error(404, "Hunt not found");
  const payload = await request.json().catch(() => ({})) as {
    group_name?: string;
    team_names?: unknown;
    party_size?: number;
    email?: string;
    photos_consented?: boolean;
  };
  const { group } = await createHuntGroup(city, hunt, payload);
  return envelope(city, await hydrateHuntGroup(city, group), "runtime-overlay");
}
