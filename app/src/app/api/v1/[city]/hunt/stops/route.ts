import { requireScope } from "../../../_lib/auth";
import { envelope, error, loadCityData, type HuntStop } from "../../../_lib/data";

type Context = { params: Promise<{ city: string }> };

function previewOrAuth(request: Request, city: string) {
  const auth = requireScope(request, "hunt:write", city);
  if (auth.ok) return auth;
  if (process.env.NODE_ENV !== "production" && request.headers.get("x-stroll-admin-preview") === "1") {
    return { ok: true as const, key: { label: "local-preview", hash: "", scopes: ["hunt:write" as const], city } };
  }
  return auth;
}

function cleanStop(input: Partial<HuntStop>): HuntStop {
  const id = String(input.id ?? `stop_${Date.now().toString(36)}`).toLowerCase().replace(/[^a-z0-9_-]/g, "-");
  return {
    id,
    business_id: String(input.business_id ?? "").slice(0, 120),
    business_slug: String(input.business_slug ?? input.business_id ?? "").slice(0, 120),
    name: String(input.name ?? "Untitled stop").slice(0, 180),
    riddle: String(input.riddle ?? "").slice(0, 1200),
    clue_1: String(input.clue_1 ?? "").slice(0, 500),
    clue_2: String(input.clue_2 ?? "").slice(0, 500),
    clue_3: String(input.clue_3 ?? "").slice(0, 500),
    challenge: String(input.challenge ?? "Take a proof photo at the stop.").slice(0, 500),
    difficulty: String(input.difficulty ?? "medium").slice(0, 40),
    age_restricted: Boolean(input.age_restricted),
    variant: Number(input.variant ?? 1),
    status: input.status === "draft" || input.status === "retired" ? input.status : "live",
    authored_by: String(input.authored_by ?? "agent-api").slice(0, 120),
    updated_at: new Date().toISOString(),
  };
}

export async function POST(request: Request, context: Context) {
  const { city } = await context.params;
  const auth = previewOrAuth(request, city);
  if (auth.ok !== true) return error(auth.status, auth.message);
  const data = await loadCityData(city);
  if (!data) return error(404, "City not found");
  const payload = await request.json().catch(() => null) as Partial<HuntStop> | null;
  if (!payload) return error(400, "JSON body required");
  const stop = cleanStop(payload);
  return envelope(city, { ...stop, persisted: false, note: "Preview API validates hunt-stop payloads; connect Supabase to persist." }, "runtime-overlay");
}

export async function PATCH(request: Request, context: Context) {
  return POST(request, context);
}
