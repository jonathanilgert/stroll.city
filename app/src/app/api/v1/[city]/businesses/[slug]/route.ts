import { requireScope } from "../../../_lib/auth";
import { envelope, error, getBusiness, loadCityData, patchBusiness, sanitizeBusinessPatch } from "../../../_lib/data";

type Context = { params: Promise<{ city: string; slug: string }> };

export async function GET(_request: Request, context: Context) {
  const { city, slug } = await context.params;
  const data = await loadCityData(city);
  if (!data) return error(404, "City not found");

  const business = await getBusiness(city, data, slug);
  if (!business) return error(404, "Business not found");
  return envelope(city, business, business.logo_url || business.claim_status === "pending" ? "runtime-overlay" : "static-json");
}

export async function PATCH(request: Request, context: Context) {
  const { city, slug } = await context.params;
  const auth = requireScope(request, "businesses:write", city);
  if (auth.ok !== true) return error(auth.status, auth.message);

  const data = await loadCityData(city);
  if (!data) return error(404, "City not found");

  const business = await getBusiness(city, data, slug);
  if (!business) return error(404, "Business not found");

  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") return error(400, "A JSON object body is required");

  const patch = sanitizeBusinessPatch(payload);
  if (!Object.keys(patch).length) return error(400, "No supported business fields were supplied");

  await patchBusiness(city, business.id, {
    ...patch,
    source: patch.source ?? `${business.source} · agent business enrichment`,
    needsReview: patch.needsReview ?? false,
  });

  const updatedData = await loadCityData(city);
  const updated = updatedData ? await getBusiness(city, updatedData, business.id) : null;
  return envelope(city, updated ?? { ...business, ...patch }, "runtime-overlay");
}
