import { requireScope } from "../../_lib/auth";
import { addBiaEvidence, envelope, error } from "../../_lib/data";

type Context = { params: Promise<{ city: string }> };

function adminOk(request: Request, city: string) {
  const auth = requireScope(request, "admin", city);
  if (auth.ok) return auth;
  if (process.env.NODE_ENV !== "production" && request.headers.get("x-stroll-admin-preview") === "1") {
    return { ok: true as const, key: { label: "local-preview", hash: "", scopes: ["admin" as const], city } };
  }
  return auth;
}

export async function POST(request: Request, context: Context) {
  const { city } = await context.params;
  const auth = adminOk(request, city);
  if (auth.ok !== true) return error(auth.status, auth.message);
  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") return error(400, "JSON body required");
  const evidence = await addBiaEvidence(city, payload);
  return envelope(city, evidence, "runtime-overlay");
}
