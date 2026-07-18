import { requireScope } from "../../../_lib/auth";
import { error, loadCityData, patchAttraction } from "../../../_lib/data";

type Context = { params: Promise<{ city: string; id: string }> };

export async function PATCH(request: Request, context: Context) {
  const { city, id } = await context.params;
  const auth = requireScope(request, "attractions:write", city);
  if (!auth.ok) return error(auth.status, auth.message);

  const data = await loadCityData(city);
  if (!data) return error(404, "City not found");

  const attraction = await patchAttraction(city, data, id, await request.json());
  if (!attraction) return error(404, "Attraction not found");
  return Response.json({ ok: true, city, data: attraction });
}
