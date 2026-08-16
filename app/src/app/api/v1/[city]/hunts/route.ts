import { requireScope } from "../../_lib/auth";
import { envelope, error, getHunt, listHunts, loadCityData, type Hunt } from "../../_lib/data";

type Context = { params: Promise<{ city: string }> };

function previewOrAuth(request: Request, city: string) {
  const auth = requireScope(request, "hunt:write", city);
  if (auth.ok) return auth;
  if (process.env.NODE_ENV !== "production" && request.headers.get("x-stroll-admin-preview") === "1") {
    return { ok: true as const, key: { label: "local-preview", hash: "", scopes: ["hunt:write" as const], city } };
  }
  return auth;
}

export async function GET(request: Request, context: Context) {
  const { city } = await context.params;
  const data = await loadCityData(city);
  if (!data) return error(404, "City not found");
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");
  if (slug) {
    const hunt = getHunt(data, slug);
    if (!hunt) return error(404, "Hunt not found");
    return envelope(city, hunt, "static-json");
  }
  const hunts = listHunts(data);
  return envelope(city, hunts, "static-json", hunts.length);
}

function cleanHunt(city: string, payload: Partial<Hunt>): Hunt {
  const now = new Date().toISOString();
  const slug = String(payload.slug ?? payload.name ?? `hunt-${Date.now().toString(36)}`).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return {
    id: String(payload.id ?? slug),
    city,
    neighbourhood: String(payload.neighbourhood ?? "Inglewood").slice(0, 120),
    slug,
    name: String(payload.name ?? "Untitled hunt").slice(0, 160),
    blurb: String(payload.blurb ?? "").slice(0, 700),
    stop_ids: Array.isArray(payload.stop_ids) ? payload.stop_ids.map(String).slice(0, 30) : [],
    mode: payload.mode === "race" || payload.mode === "full" ? payload.mode : "friendly",
    audience: payload.audience === "adult" ? "adult" : "family",
    est_minutes: Math.max(10, Math.min(240, Number(payload.est_minutes ?? 45))),
    distance_m: Math.max(100, Math.min(20000, Number(payload.distance_m ?? 1200))),
    difficulty: String(payload.difficulty ?? "easy").slice(0, 40),
    status: payload.status === "draft" || payload.status === "retired" ? payload.status : "live",
    created_at: payload.created_at ?? now,
    updated_at: now,
  };
}

export async function POST(request: Request, context: Context) {
  const { city } = await context.params;
  const auth = previewOrAuth(request, city);
  if (auth.ok !== true) return error(auth.status, auth.message);
  const payload = await request.json().catch(() => null) as Partial<Hunt> | null;
  if (!payload) return error(400, "JSON body required");
  return envelope(city, { ...cleanHunt(city, payload), persisted: false, note: "Preview API validates hunts; connect Supabase to persist." }, "runtime-overlay");
}

export async function PATCH(request: Request, context: Context) {
  return POST(request, context);
}
