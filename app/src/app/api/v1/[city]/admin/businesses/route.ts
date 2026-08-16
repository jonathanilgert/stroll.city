import { requireScope } from "../../../_lib/auth";
import { addBiaEvidence, envelope, error, generateClaimCode, listBusinessEdits, listBusinesses, listClaimCodes, loadCityData, sanitizeBusinessPatch, staffPatchBusiness, verifyBusinessInPerson } from "../../../_lib/data";

type Context = { params: Promise<{ city: string }> };

function adminOk(request: Request, city: string) {
  const auth = requireScope(request, "admin", city);
  if (auth.ok) return auth;
  const preview = request.headers.get("x-stroll-admin-preview") === "1";
  if (process.env.NODE_ENV !== "production" && preview) return { ok: true as const, key: { label: "local-preview", hash: "", scopes: ["admin" as const], city } };
  return auth;
}

function actor(request: Request) {
  return request.headers.get("x-stroll-actor")?.trim() || "staff-admin";
}

export async function GET(request: Request, context: Context) {
  const { city } = await context.params;
  const auth = adminOk(request, city);
  if (auth.ok !== true) return error(auth.status, auth.message);
  const data = await loadCityData(city);
  if (!data) return error(404, "City not found");

  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  const result = await listBusinesses(city, data, url.searchParams.get("cat"), q);
  const edits = await listBusinessEdits(city, url.searchParams.get("business_id"));
  const claimCodes = await listClaimCodes(city, url.searchParams.get("business_id"));
  return envelope(city, { businesses: result.businesses, edits, claimCodes }, result.source, result.businesses.length);
}

export async function PATCH(request: Request, context: Context) {
  const { city } = await context.params;
  const auth = adminOk(request, city);
  if (auth.ok !== true) return error(auth.status, auth.message);
  const data = await loadCityData(city);
  if (!data) return error(404, "City not found");

  const payload = await request.json().catch(() => null) as { business_id?: string; patch?: Record<string, unknown> } | null;
  if (!payload?.business_id || !payload.patch || typeof payload.patch !== "object") return error(400, "business_id and patch are required");
  const patch = sanitizeBusinessPatch(payload.patch);
  if (!Object.keys(patch).length) return error(400, "No supported business fields were supplied");
  const updated = await staffPatchBusiness(city, data, payload.business_id, patch, actor(request));
  return envelope(city, updated, "runtime-overlay");
}

export async function POST(request: Request, context: Context) {
  const { city } = await context.params;
  const auth = adminOk(request, city);
  if (auth.ok !== true) return error(auth.status, auth.message);
  const data = await loadCityData(city);
  if (!data) return error(404, "City not found");

  const payload = await request.json().catch(() => null) as { action?: string; business_id?: string; note?: string; email?: string } | null;
  if (!payload?.action || !payload.business_id) return error(400, "action and business_id are required");

  if (payload.action === "verify_in_person") {
    const updated = await verifyBusinessInPerson(city, data, payload.business_id, actor(request));
    if (payload.note) await addBiaEvidence(city, { category: "staff-verification", claim: payload.note, source: `business:${payload.business_id}` });
    return envelope(city, updated, "runtime-overlay");
  }

  if (payload.action === "generate_claim_code") {
    const code = await generateClaimCode(city, payload.business_id, actor(request));
    if (payload.note) await addBiaEvidence(city, { category: "claim-code", claim: payload.note, source: `business:${payload.business_id}` });
    return envelope(city, code, "runtime-overlay");
  }

  if (payload.action === "log_note") {
    const evidence = await addBiaEvidence(city, { category: "staff-note", claim: payload.note ?? "", source: `business:${payload.business_id}` });
    return envelope(city, evidence, "runtime-overlay");
  }

  if (payload.action === "welcome_email") {
    const evidence = await addBiaEvidence(city, { category: "welcome-email", claim: `Welcome email queued for ${payload.email ?? "unknown email"}`, source: `business:${payload.business_id}` });
    return envelope(city, evidence, "runtime-overlay");
  }

  return error(400, "Unsupported admin action");
}
