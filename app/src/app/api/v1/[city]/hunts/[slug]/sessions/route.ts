import { createHuntSession, envelope, error, getHunt, hydrateHuntSession, loadCityData } from "../../../../_lib/data";

export async function POST(request: Request, context: { params: Promise<{ city: string; slug: string }> }) {
  const { city, slug } = await context.params;
  const data = await loadCityData(city);
  if (!data) return error(404, "City not found");
  const hunt = getHunt(data, slug);
  if (!hunt) return error(404, "Hunt not found");
  const payload = await request.json().catch(() => ({})) as {
    team_name?: string;
    email?: string;
    photos_consented?: boolean;
    theme?: string;
    party_type?: string;
    party_size?: number;
    team_count?: number;
  };
  const session = await createHuntSession(city, hunt, data, payload);
  return envelope(city, hydrateHuntSession(session, data), "runtime-overlay");
}
