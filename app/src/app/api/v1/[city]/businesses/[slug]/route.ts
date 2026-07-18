import { envelope, error, getBusiness, loadCityData } from "../../../_lib/data";

type Context = { params: Promise<{ city: string; slug: string }> };

export async function GET(_request: Request, context: Context) {
  const { city, slug } = await context.params;
  const data = await loadCityData(city);
  if (!data) return error(404, "City not found");

  const business = await getBusiness(city, data, slug);
  if (!business) return error(404, "Business not found");
  return envelope(city, business, business.logo_url || business.claim_status === "pending" ? "runtime-overlay" : "static-json");
}
