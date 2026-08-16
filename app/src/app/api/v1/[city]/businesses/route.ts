import { envelope, error, listBusinesses, loadCityData, publicBusiness } from "../../_lib/data";

type Context = { params: Promise<{ city: string }> };

export async function GET(request: Request, context: Context) {
  const { city } = await context.params;
  const data = await loadCityData(city);
  if (!data) return error(404, "City not found");

  const url = new URL(request.url);
  const result = await listBusinesses(city, data, url.searchParams.get("cat"), url.searchParams.get("q"));
  return envelope(city, result.businesses.map(publicBusiness), result.source, result.businesses.length);
}
