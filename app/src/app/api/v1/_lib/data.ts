import fs from "node:fs/promises";
import path from "node:path";

export type Business = {
  id: string;
  name: string;
  category: string;
  mono: string;
  lon: number;
  lat: number;
  address: string;
  blurb: string;
  hours: string;
  highlights: [string, string][];
  photo: string;
  logo_url?: string;
  website?: string | null;
  phone?: string | null;
  domain: string | null;
  source: string;
  needsReview: boolean;
  claim_status?: "unclaimed" | "pending" | "claimed" | "rejected";
  plan_tier?: "free" | "stroll" | "stroll_plus";
};

export type StrollEvent = {
  id: string;
  name: string;
  venue: string;
  starts_at: string;
  ends_at?: string;
  source: string;
  lon: number;
  lat: number;
  emoji?: string;
  url?: string;
};

export type Attraction = {
  id: string;
  name: string;
  emoji: string;
  lon: number;
  lat: number;
  blurb: string;
  url?: string;
  photo_url?: string;
};

export type ClaimPayload = {
  business_id: string;
  claimant_name: string;
  claimant_email: string;
  claimant_phone?: string;
  business_role?: string;
  licence_id?: string;
  proof_notes?: string;
  plan_tier: "free" | "stroll" | "stroll_plus";
  logo_data_url?: string;
  logo_name?: string;
};

export type BusinessClaim = ClaimPayload & {
  id: string;
  status: "pending" | "approved" | "rejected";
  checkout_mode: "mock" | "stripe";
  checkout_url: string | null;
  created_at: string;
};

export type StrollData = {
  generatedAt: string;
  center: [number, number];
  stripBounds: [[number, number], [number, number]];
  businesses: Business[];
  businessBuildings: GeoJSON.FeatureCollection;
  trees: [number, number][];
  streets: GeoJSON.FeatureCollection;
  bike: GeoJSON.FeatureCollection;
  pathways: GeoJSON.FeatureCollection;
  neighbourhoods: Array<{ id: string; name: string; center: [number, number]; bounds: [[number, number], [number, number]]; bearing: number; enabled: boolean }>;
  events?: StrollEvent[];
  attractions?: Attraction[];
  stats?: Record<string, unknown>;
};

export type ApiEnvelope<T> = {
  ok: true;
  city: string;
  source: "static-json" | "runtime-overlay" | "supabase-ready";
  count?: number;
  data: T;
};

const dataRoot = path.join(process.cwd(), "public", "data");
const runtimeRoot = path.join(process.cwd(), ".stroll", "runtime");

export function slugify(input: string): string {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function sanitizeString(value: unknown, limit = 500): string {
  return String(value ?? "").replace(/[<>]/g, "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, limit);
}

export async function loadCityData(city: string): Promise<StrollData | null> {
  if (city !== "calgary") return null;
  const raw = await fs.readFile(path.join(dataRoot, "stroll-data.json"), "utf8");
  return JSON.parse(raw) as StrollData;
}

async function readOverlay<T>(city: string, kind: "events" | "attractions" | "businesses" | "claims"): Promise<T[]> {
  try {
    const raw = await fs.readFile(path.join(runtimeRoot, city, `${kind}.json`), "utf8");
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeOverlay<T extends { id: string }>(city: string, kind: "events" | "attractions" | "businesses" | "claims", rows: T[]) {
  const dir = path.join(runtimeRoot, city);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, `${kind}.json`), `${JSON.stringify(rows, null, 2)}\n`);
}

export async function listBusinesses(city: string, data: StrollData, category?: string | null, query?: string | null) {
  const overlay = await readOverlay<Partial<Business> & { id: string }>(city, "businesses");
  const byId = new Map(data.businesses.map((business) => [business.id, { claim_status: "unclaimed" as const, plan_tier: "free" as const, ...business }]));
  overlay.forEach((patch) => {
    const current = byId.get(patch.id);
    if (current) byId.set(patch.id, { ...current, ...patch });
  });
  let businesses = [...byId.values()];
  if (category) businesses = businesses.filter((business) => business.category === category);
  if (query) {
    const needle = query.toLowerCase().trim();
    businesses = businesses.filter((business) => `${business.name} ${business.address} ${business.category}`.toLowerCase().includes(needle));
  }
  return { businesses, source: overlay.length ? "runtime-overlay" as const : "static-json" as const };
}

export async function getBusiness(city: string, data: StrollData, slug: string) {
  const result = await listBusinesses(city, data);
  return result.businesses.find((business) => business.id === slug || slugify(business.name) === slug) ?? null;
}

export async function patchBusiness(city: string, businessId: string, patch: Partial<Business>) {
  const existing = await readOverlay<Partial<Business> & { id: string }>(city, "businesses");
  const next = new Map(existing.map((row) => [row.id, row]));
  next.set(businessId, { ...(next.get(businessId) ?? { id: businessId }), ...patch, id: businessId });
  await writeOverlay(city, "businesses", [...next.values()]);
}

export function sanitizeBusinessPatch(payload: Partial<Business>): Partial<Business> {
  const patch: Partial<Business> = {};
  if (payload.category !== undefined) patch.category = sanitizeString(payload.category, 80);
  if (payload.blurb !== undefined) patch.blurb = sanitizeString(payload.blurb, 700);
  if (payload.hours !== undefined) patch.hours = sanitizeString(payload.hours, 160);
  if (payload.website !== undefined) patch.website = payload.website ? sanitizeString(payload.website, 240) : null;
  if (payload.phone !== undefined) patch.phone = payload.phone ? sanitizeString(payload.phone, 80) : null;
  if (payload.domain !== undefined) patch.domain = payload.domain ? sanitizeString(payload.domain, 120) : null;
  if (payload.photo !== undefined) patch.photo = sanitizeString(payload.photo, 300);
  if (payload.logo_url !== undefined) patch.logo_url = sanitizeString(payload.logo_url, 300);
  if (payload.needsReview !== undefined) patch.needsReview = Boolean(payload.needsReview);
  if (payload.source !== undefined) patch.source = sanitizeString(payload.source, 180);
  if (payload.highlights !== undefined && Array.isArray(payload.highlights)) {
    patch.highlights = payload.highlights
      .slice(0, 6)
      .map((item) => [sanitizeString(item?.[0], 12), sanitizeString(item?.[1], 120)] as [string, string]);
  }
  return patch;
}

export async function createBusinessClaim(city: string, data: StrollData, payload: Partial<ClaimPayload>): Promise<BusinessClaim> {
  const businessId = sanitizeString(payload.business_id, 120);
  const business = data.businesses.find((row) => row.id === businessId);
  if (!business) throw new Error("A valid business_id from the Calgary licence data is required");

  const claimantEmail = sanitizeString(payload.claimant_email, 180).toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(claimantEmail)) throw new Error("A valid claimant_email is required");

  const tier = payload.plan_tier === "stroll_plus" || payload.plan_tier === "stroll" ? payload.plan_tier : "free";
  const logo = typeof payload.logo_data_url === "string" && payload.logo_data_url.startsWith("data:image/") ? payload.logo_data_url.slice(0, 350_000) : undefined;
  const id = `claim_${Date.now()}_${slugify(`${businessId}-${claimantEmail}`).slice(0, 50)}`;
  const checkoutMode = process.env.STRIPE_SECRET_KEY ? "stripe" : "mock";
  const checkoutUrl = tier === "free"
    ? null
    : checkoutMode === "stripe"
      ? `/portal/checkout-pending?claim=${encodeURIComponent(id)}`
      : `/portal?claim=${encodeURIComponent(id)}&mock_checkout=1`;

  const claim: BusinessClaim = {
    id,
    business_id: businessId,
    claimant_name: sanitizeString(payload.claimant_name, 120),
    claimant_email: claimantEmail,
    claimant_phone: sanitizeString(payload.claimant_phone, 40),
    business_role: sanitizeString(payload.business_role, 80),
    licence_id: sanitizeString(payload.licence_id, 120),
    proof_notes: sanitizeString(payload.proof_notes, 1000),
    plan_tier: tier,
    logo_data_url: logo,
    logo_name: sanitizeString(payload.logo_name, 160),
    status: "pending",
    checkout_mode: checkoutMode,
    checkout_url: checkoutUrl,
    created_at: new Date().toISOString(),
  };

  const claims = await readOverlay<BusinessClaim>(city, "claims");
  await writeOverlay(city, "claims", [claim, ...claims]);

  await patchBusiness(city, businessId, {
    logo_url: logo,
    plan_tier: tier,
    claim_status: "pending",
    needsReview: false,
    source: `${business.source} · Phase 4 portal claim pending`,
  });

  return claim;
}

export function fallbackEvents(data: StrollData): StrollEvent[] {
  return data.events?.length ? data.events : [
    { id: "night-market-demo", name: "Inglewood Night Market", venue: "9 Ave SE between 12 & 13 St", starts_at: "2026-07-24T17:00:00-06:00", ends_at: "2026-07-24T22:00:00-06:00", source: "Phase 3 sample", lon: data.center[0] - 0.0028, lat: data.center[1] + 0.0006, emoji: "🏮" },
    { id: "gallery-walk-demo", name: "Gallery walk + local shops", venue: "Atlantic Ave / 9 Ave SE", starts_at: "2026-07-27T12:00:00-06:00", source: "Phase 3 sample", lon: data.center[0] + 0.0024, lat: data.center[1] + 0.0002, emoji: "🎨" },
  ];
}

export function fallbackAttractions(data: StrollData): Attraction[] {
  return data.attractions?.length ? data.attractions : [
    { id: "zoo", name: "Calgary Zoo", emoji: "🦁", lon: -114.0307, lat: 51.0457, blurb: "A citywide discovery pin near the Bow River and Inglewood." },
    { id: "fort-calgary", name: "The Confluence", emoji: "🏛️", lon: -114.0446, lat: 51.0476, blurb: "Historic gathering place and cultural destination." },
    { id: "riverwalk", name: "RiverWalk", emoji: "🚶", lon: data.center[0] - 0.006, lat: data.center[1] + 0.005, blurb: "A friendly route for strolling into the neighbourhood." },
  ];
}

export async function listEvents(city: string, data: StrollData, from?: string | null, to?: string | null) {
  const overlay = await readOverlay<StrollEvent>(city, "events");
  const byId = new Map(fallbackEvents(data).map((event) => [event.id, event]));
  overlay.forEach((event) => byId.set(event.id, event));
  let events = [...byId.values()].sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  if (from) events = events.filter((event) => event.starts_at >= from);
  if (to) events = events.filter((event) => event.starts_at <= to);
  return { events, source: overlay.length ? "runtime-overlay" as const : "static-json" as const };
}

export async function upsertEvent(city: string, data: StrollData, payload: Partial<StrollEvent>) {
  if (!payload.name || !payload.venue || !payload.starts_at) throw new Error("name, venue, and starts_at are required");
  const existing = await listEvents(city, data);
  const id = payload.id ?? slugify(`${payload.name}-${payload.starts_at}-${payload.venue}`);
  const event: StrollEvent = {
    id,
    name: sanitizeString(payload.name, 180),
    venue: sanitizeString(payload.venue, 180),
    starts_at: sanitizeString(payload.starts_at, 80),
    ends_at: payload.ends_at ? sanitizeString(payload.ends_at, 80) : undefined,
    source: sanitizeString(payload.source ?? "agent-api", 80),
    lon: Number(payload.lon ?? data.center[0]),
    lat: Number(payload.lat ?? data.center[1]),
    emoji: sanitizeString(payload.emoji ?? "📍", 8),
    url: payload.url ? sanitizeString(payload.url, 240) : undefined,
  };
  const next = new Map(existing.events.map((row) => [row.id, row]));
  next.set(id, event);
  await writeOverlay(city, "events", [...next.values()]);
  return event;
}

export async function patchEvent(city: string, data: StrollData, id: string, payload: Partial<StrollEvent>) {
  const existing = await listEvents(city, data);
  const current = existing.events.find((event) => event.id === id);
  if (!current) return null;
  const updated = { ...current, ...payload, id };
  await writeOverlay(city, "events", existing.events.map((event) => event.id === id ? updated : event));
  return updated;
}

export async function deleteEvent(city: string, data: StrollData, id: string) {
  const existing = await listEvents(city, data);
  const next = existing.events.filter((event) => event.id !== id);
  await writeOverlay(city, "events", next);
  return existing.events.length !== next.length;
}

export async function listAttractions(city: string, data: StrollData) {
  const overlay = await readOverlay<Attraction>(city, "attractions");
  const byId = new Map(fallbackAttractions(data).map((attraction) => [attraction.id, attraction]));
  overlay.forEach((attraction) => byId.set(attraction.id, attraction));
  return { attractions: [...byId.values()], source: overlay.length ? "runtime-overlay" as const : "static-json" as const };
}

export async function upsertAttraction(city: string, data: StrollData, payload: Partial<Attraction>) {
  if (!payload.name || !payload.blurb) throw new Error("name and blurb are required");
  const existing = await listAttractions(city, data);
  const id = payload.id ?? slugify(payload.name);
  const attraction: Attraction = {
    id,
    name: sanitizeString(payload.name, 180),
    emoji: sanitizeString(payload.emoji ?? "📍", 8),
    lon: Number(payload.lon ?? data.center[0]),
    lat: Number(payload.lat ?? data.center[1]),
    blurb: sanitizeString(payload.blurb, 700),
    url: payload.url ? sanitizeString(payload.url, 240) : undefined,
    photo_url: payload.photo_url ? sanitizeString(payload.photo_url, 240) : undefined,
  };
  const next = new Map(existing.attractions.map((row) => [row.id, row]));
  next.set(id, attraction);
  await writeOverlay(city, "attractions", [...next.values()]);
  return attraction;
}

export async function patchAttraction(city: string, data: StrollData, id: string, payload: Partial<Attraction>) {
  const existing = await listAttractions(city, data);
  const current = existing.attractions.find((attraction) => attraction.id === id);
  if (!current) return null;
  const updated = { ...current, ...payload, id };
  await writeOverlay(city, "attractions", existing.attractions.map((attraction) => attraction.id === id ? updated : attraction));
  return updated;
}

export function envelope<T>(city: string, data: T, source: ApiEnvelope<T>["source"] = "static-json", count?: number): Response {
  return Response.json({ ok: true, city, source, count, data }, { headers: { "cache-control": "public, max-age=60, stale-while-revalidate=300" } });
}

export function error(status: number, message: string): Response {
  return Response.json({ ok: false, error: message }, { status });
}
