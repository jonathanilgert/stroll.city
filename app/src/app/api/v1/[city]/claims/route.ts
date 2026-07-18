import { createBusinessClaim, error, loadCityData } from "../../_lib/data";

type Context = { params: Promise<{ city: string }> };

export async function POST(request: Request, context: Context) {
  const { city } = await context.params;
  const data = await loadCityData(city);
  if (!data) return error(404, "City not found");

  try {
    const claim = await createBusinessClaim(city, data, await request.json());
    return Response.json({ ok: true, city, data: claim }, { status: 201 });
  } catch (caught) {
    return error(400, caught instanceof Error ? caught.message : "Invalid claim payload");
  }
}
