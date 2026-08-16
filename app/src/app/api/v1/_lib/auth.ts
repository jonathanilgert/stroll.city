import crypto from "node:crypto";

export type ApiScope =
  | "events:write"
  | "events:read"
  | "attractions:write"
  | "businesses:write"
  | "businesses:read"
  | "hunt:write"
  | "layers:write"
  | "admin";

type ApiKeyRecord = {
  label: string;
  hash: string;
  scopes: ApiScope[];
  city?: string | null;
  revoked?: boolean;
};

export type AuthResult = {
  ok: true;
  key: ApiKeyRecord;
} | {
  ok: false;
  status: number;
  message: string;
};

const pepper = process.env.STROLL_API_KEY_PEPPER ?? "";

function parseKeys(): ApiKeyRecord[] {
  const raw = process.env.STROLL_API_KEYS_JSON;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ApiKeyRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function bearer(request: Request): string | null {
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? null;
}

function hashKey(key: string): string {
  return crypto.createHash("sha256").update(`${pepper}:${key}`).digest("hex");
}

function constantTimeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

export function requireScope(request: Request, scope: ApiScope, city: string): AuthResult {
  const token = bearer(request);
  if (!token) return { ok: false, status: 401, message: "Missing Bearer token" };

  const keys = parseKeys();
  if (!keys.length || !pepper) {
    return { ok: false, status: 503, message: "API key auth is not configured on this preview" };
  }

  const hash = hashKey(token);
  const key = keys.find((candidate) => !candidate.revoked && constantTimeEqual(candidate.hash, hash));
  if (!key) return { ok: false, status: 401, message: "Invalid API key" };
  if (key.city && key.city !== city) return { ok: false, status: 403, message: "API key is not scoped to this city" };
  if (!key.scopes.includes("admin") && !key.scopes.includes(scope)) {
    return { ok: false, status: 403, message: `API key requires ${scope}` };
  }
  return { ok: true, key };
}

export function hashForCli(key: string, cliPepper: string): string {
  return crypto.createHash("sha256").update(`${cliPepper}:${key}`).digest("hex");
}
