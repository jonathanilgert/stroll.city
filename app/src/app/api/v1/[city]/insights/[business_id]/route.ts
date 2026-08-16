import { requireScope } from "../../../_lib/auth";
import { envelope, error, getBusiness, listBusinessEdits, loadCityData } from "../../../_lib/data";

type Context = { params: Promise<{ city: string; business_id: string }> };

function readOk(request: Request, city: string) {
  const auth = requireScope(request, "businesses:read", city);
  if (auth.ok) return auth;
  if (process.env.NODE_ENV !== "production" && request.headers.get("x-stroll-admin-preview") === "1") {
    return { ok: true as const, key: { label: "local-preview", hash: "", scopes: ["businesses:read" as const], city } };
  }
  return auth;
}

export async function GET(request: Request, context: Context) {
  const { city, business_id } = await context.params;
  const auth = readOk(request, city);
  if (auth.ok !== true) return error(auth.status, auth.message);
  const data = await loadCityData(city);
  if (!data) return error(404, "City not found");
  const business = await getBusiness(city, data, business_id);
  if (!business) return error(404, "Business not found");
  const edits = await listBusinessEdits(city, business.id);
  const synthetic = {
    business_id: business.id,
    business_name: business.name,
    tier: business.plan_tier ?? "free",
    sticker_scans_30d: 0,
    panel_opens_30d: 0,
    hunt_stops_solved_30d: 0,
    outbound_clicks_30d: business.plan_tier === "stroll" ? 0 : undefined,
    corrections_logged: edits.length,
    dashboard_note: "Analytics table is wired at API boundary; connect Supabase analytics_events for live metrics.",
  };
  return envelope(city, synthetic, "runtime-overlay");
}
