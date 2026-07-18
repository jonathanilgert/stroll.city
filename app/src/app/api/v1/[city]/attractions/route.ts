import { requireScope } from "../../_lib/auth";
import { envelope, error, listAttractions, loadCityData, upsertAttraction } from "../../_lib/data";

type Context = { params: Promise<{ city: string }> };

export async function GET(_request: Request, context: Context) {
  const { city } = await context.params;
  const data = await loadCityData(city);
  if (!data) return error(404, "City not found");

  const result = await listAttractions(city, data);
  return envelope(city, result.attractions, result.source, result.attractions.length);
}

export async function POST(request: Request, context: Context) {
  const { city } = await context.params;
  const auth = requireScope(request, "attractions:write", city);
  if (!auth.ok) return error(auth.status, auth.message);

  const data = await loadCityData(city);
  if (!data) return error(404, "City not found");

  try {
    const attraction = await upsertAttraction(city, data, await request.json());
    return Response.json({ ok: true, city, data: attraction }, { status: 201 });
  } catch (caught) {
    return error(400, caught instanceof Error ? caught.message : "Invalid attraction payload");
  }
}
