import fs from "node:fs/promises";
import path from "node:path";
import { getHuntTheme } from "../../../hunt-themes";

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
  sub_category?: string;
  walk_up?: boolean;
  age_restricted?: boolean;
  avg_dwell_min?: number;
  last_verified_at?: string;
  verified_by_staff?: boolean;
  confidence?: "owner_confirmed" | "website" | "licence";
  offers_finisher_item?: boolean;
  finisher_item?: string;
  finisher_cap_weekly?: number;
  finisher_days?: string[];
  donates_to_basket?: boolean;
  basket_item?: string;
  hosts_group_finish?: boolean;
  group_finish_biggest_group?: string;
  group_finish_windows?: string[];
  group_finish_notice?: string;
  group_finish_holds?: string;
  group_finish_monthly_cap?: number;
  notes?: string;
};

export type MemberSwitchPayload = {
  enabled?: boolean;
  type?: string;
  offer?: string;
  weekly_cap?: number;
  note?: string;
  item?: string;
  approximate_value?: string;
  months?: string;
  biggest_group?: string;
  windows?: string[];
  notice?: string;
  holds?: string;
  monthly_cap?: number;
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
  finisher_offer?: MemberSwitchPayload;
  basket?: MemberSwitchPayload;
  finish_venue?: MemberSwitchPayload;
};

export type BusinessClaim = ClaimPayload & {
  id: string;
  status: "pending" | "approved" | "rejected";
  payment_status?: "not_required" | "pending" | "paid" | "cancelled";
  checkout_mode: "mock" | "stripe";
  checkout_url: string | null;
  stripe_checkout_session_id?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  created_at: string;
};

export type BusinessEdit = {
  id: string;
  business_id: string;
  field: string;
  old_value?: string;
  new_value?: string;
  actor_type: "owner" | "staff" | "public" | "scraper";
  actor_id?: string;
  source?: string;
  source_url?: string;
  status: "applied" | "suggested" | "rejected" | "reverted";
  created_at: string;
  reviewed_at?: string;
  reverted_at?: string;
};

export type ClaimCode = {
  id: string;
  business_id: string;
  code: string;
  issued_by?: string;
  issued_at: string;
  expires_at: string;
  used_at?: string | null;
};

export type BiaEvidence = {
  id: string;
  city: string;
  bia: string;
  category: string;
  claim: string;
  metric_value?: number;
  metric_unit?: string;
  supporting_query?: string;
  source?: string;
  observed_on: string;
  auto_generated: boolean;
  created_at: string;
};

export type HuntStop = {
  id: string;
  business_id: string;
  business_slug: string;
  name: string;
  riddle: string;
  clue_1: string;
  clue_2: string;
  clue_3: string;
  challenge: string;
  difficulty: string;
  age_restricted: boolean;
  variant: number;
  status: "draft" | "live" | "retired";
  authored_by?: string;
  updated_at?: string;
};

export type Hunt = {
  id: string;
  city: string;
  neighbourhood: string;
  slug: string;
  name: string;
  blurb: string;
  stop_ids: string[];
  mode: "friendly" | "full" | "race";
  audience: "family" | "adult";
  est_minutes: number;
  distance_m: number;
  difficulty: string;
  status: "draft" | "live" | "retired";
  created_at: string;
  updated_at: string;
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
  huntStops?: HuntStop[];
  hunts?: Hunt[];
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

type OverlayKind =
  | "events"
  | "attractions"
  | "businesses"
  | "claims"
  | "business_edits"
  | "claim_codes"
  | "bia_evidence"
  | "hunt_sessions"
  | "hunt_groups";

async function readOverlay<T>(city: string, kind: OverlayKind): Promise<T[]> {
  try {
    const raw = await fs.readFile(path.join(runtimeRoot, city, `${kind}.json`), "utf8");
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeOverlay<T extends { id: string }>(city: string, kind: OverlayKind, rows: T[]) {
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

export function publicBusiness<T extends Business>(business: T): T {
  if (business.plan_tier === "stroll" || business.plan_tier === "stroll_plus") return business;
  const rest = { ...business } as Partial<T>;
  delete rest.website;
  delete rest.domain;
  delete rest.phone;
  return rest as T;
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
  if (payload.plan_tier !== undefined && ["free", "stroll", "stroll_plus"].includes(String(payload.plan_tier))) patch.plan_tier = payload.plan_tier;
  if (payload.claim_status !== undefined && ["unclaimed", "pending", "claimed", "rejected"].includes(String(payload.claim_status))) patch.claim_status = payload.claim_status;
  if (payload.sub_category !== undefined) patch.sub_category = sanitizeString(payload.sub_category, 120);
  if (payload.walk_up !== undefined) patch.walk_up = Boolean(payload.walk_up);
  if (payload.age_restricted !== undefined) patch.age_restricted = Boolean(payload.age_restricted);
  if (payload.avg_dwell_min !== undefined) patch.avg_dwell_min = Math.max(1, Math.min(180, Number(payload.avg_dwell_min) || 12));
  if (payload.last_verified_at !== undefined) patch.last_verified_at = sanitizeString(payload.last_verified_at, 80);
  if (payload.verified_by_staff !== undefined) patch.verified_by_staff = Boolean(payload.verified_by_staff);
  if (payload.confidence !== undefined && ["owner_confirmed", "website", "licence"].includes(String(payload.confidence))) patch.confidence = payload.confidence;
  if (payload.offers_finisher_item !== undefined) patch.offers_finisher_item = Boolean(payload.offers_finisher_item);
  if (payload.finisher_item !== undefined) patch.finisher_item = sanitizeString(payload.finisher_item, 160);
  if (payload.finisher_cap_weekly !== undefined) patch.finisher_cap_weekly = Math.max(0, Math.min(200, Number(payload.finisher_cap_weekly) || 10));
  if (payload.finisher_days !== undefined && Array.isArray(payload.finisher_days)) patch.finisher_days = payload.finisher_days.slice(0, 7).map((day) => sanitizeString(day, 16));
  if (payload.donates_to_basket !== undefined) patch.donates_to_basket = Boolean(payload.donates_to_basket);
  if (payload.basket_item !== undefined) patch.basket_item = sanitizeString(payload.basket_item, 180);
  if (payload.hosts_group_finish !== undefined) patch.hosts_group_finish = Boolean(payload.hosts_group_finish);
  if (payload.group_finish_biggest_group !== undefined) patch.group_finish_biggest_group = sanitizeString(payload.group_finish_biggest_group, 40);
  if (payload.group_finish_windows !== undefined && Array.isArray(payload.group_finish_windows)) patch.group_finish_windows = payload.group_finish_windows.slice(0, 12).map((window) => sanitizeString(window, 40));
  if (payload.group_finish_notice !== undefined) patch.group_finish_notice = sanitizeString(payload.group_finish_notice, 40);
  if (payload.group_finish_holds !== undefined) patch.group_finish_holds = sanitizeString(payload.group_finish_holds, 240);
  if (payload.group_finish_monthly_cap !== undefined) patch.group_finish_monthly_cap = Math.max(0, Math.min(40, Number(payload.group_finish_monthly_cap) || 2));
  if (payload.notes !== undefined) patch.notes = sanitizeString(payload.notes, 1000);
  if (payload.needsReview !== undefined) patch.needsReview = Boolean(payload.needsReview);
  if (payload.source !== undefined) patch.source = sanitizeString(payload.source, 180);
  if (payload.highlights !== undefined && Array.isArray(payload.highlights)) {
    patch.highlights = payload.highlights
      .slice(0, 6)
      .map((item) => [sanitizeString(item?.[0], 12), sanitizeString(item?.[1], 120)] as [string, string]);
  }
  return patch;
}

export async function recordBusinessEdits(city: string, business: Business, patch: Partial<Business>, actorId = "staff-admin") {
  const now = new Date().toISOString();
  const rows = await readOverlay<BusinessEdit>(city, "business_edits");
  const edits = Object.entries(patch)
    .filter(([field]) => field !== "source")
    .map(([field, value]) => ({
      id: `edit_${Date.now()}_${slugify(`${business.id}-${field}-${Math.random().toString(36).slice(2, 7)}`)}`,
      business_id: business.id,
      field,
      old_value: JSON.stringify((business as unknown as Record<string, unknown>)[field] ?? null),
      new_value: JSON.stringify(value ?? null),
      actor_type: "staff" as const,
      actor_id: actorId,
      source: "admin-app",
      status: "applied" as const,
      created_at: now,
    }));
  if (edits.length) await writeOverlay(city, "business_edits", [...edits, ...rows]);
  return edits;
}

export async function staffPatchBusiness(city: string, data: StrollData, businessId: string, patch: Partial<Business>, actorId = "staff-admin") {
  const business = await getBusiness(city, data, businessId);
  if (!business) throw new Error("Business not found");
  await recordBusinessEdits(city, business, patch, actorId);
  await patchBusiness(city, business.id, {
    ...patch,
    source: patch.source ?? `${business.source} · staff admin edit`,
    needsReview: patch.needsReview ?? false,
  });
  return getBusiness(city, data, business.id);
}

export async function verifyBusinessInPerson(city: string, data: StrollData, businessId: string, actorId = "staff-admin") {
  return staffPatchBusiness(city, data, businessId, {
    verified_by_staff: true,
    last_verified_at: new Date().toISOString(),
    confidence: "owner_confirmed",
    claim_status: "claimed",
  }, actorId);
}

export async function listBusinessEdits(city: string, businessId?: string | null) {
  const edits = await readOverlay<BusinessEdit>(city, "business_edits");
  return businessId ? edits.filter((edit) => edit.business_id === businessId) : edits;
}

export async function generateClaimCode(city: string, businessId: string, actorId = "staff-admin") {
  const codes = await readOverlay<ClaimCode>(city, "claim_codes");
  const issued = new Date();
  const expires = new Date(issued.getTime() + 14 * 24 * 60 * 60 * 1000);
  let code = "";
  do {
    code = Math.random().toString(36).replace(/[^a-z0-9]/g, "").slice(2, 8).toUpperCase().padEnd(6, "7");
  } while (codes.some((row) => row.code === code));
  const claimCode: ClaimCode = {
    id: `claim_code_${Date.now()}_${slugify(businessId).slice(0, 24)}`,
    business_id: sanitizeString(businessId, 120),
    code,
    issued_by: actorId,
    issued_at: issued.toISOString(),
    expires_at: expires.toISOString(),
    used_at: null,
  };
  await writeOverlay(city, "claim_codes", [claimCode, ...codes]);
  return claimCode;
}

export async function listClaimCodes(city: string, businessId?: string | null) {
  const codes = await readOverlay<ClaimCode>(city, "claim_codes");
  return businessId ? codes.filter((code) => code.business_id === businessId) : codes;
}

export async function addBiaEvidence(city: string, payload: Partial<BiaEvidence>) {
  const rows = await readOverlay<BiaEvidence>(city, "bia_evidence");
  const now = new Date().toISOString();
  const evidence: BiaEvidence = {
    id: `bia_${Date.now()}_${slugify(payload.category ?? "note").slice(0, 24)}`,
    city,
    bia: sanitizeString(payload.bia ?? "Inglewood BIA", 120),
    category: sanitizeString(payload.category ?? "staff-note", 120),
    claim: sanitizeString(payload.claim ?? "", 1000),
    metric_value: payload.metric_value === undefined ? undefined : Number(payload.metric_value),
    metric_unit: payload.metric_unit ? sanitizeString(payload.metric_unit, 40) : undefined,
    supporting_query: payload.supporting_query ? sanitizeString(payload.supporting_query, 240) : undefined,
    source: payload.source ? sanitizeString(payload.source, 180) : "admin-app",
    observed_on: sanitizeString(payload.observed_on ?? now.slice(0, 10), 20),
    auto_generated: Boolean(payload.auto_generated),
    created_at: now,
  };
  await writeOverlay(city, "bia_evidence", [evidence, ...rows]);
  return evidence;
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
    payment_status: tier === "free" ? "not_required" : "pending",
    checkout_mode: checkoutMode,
    checkout_url: checkoutUrl,
    created_at: new Date().toISOString(),
  };

  const businessPatch: Partial<Business> = {
    logo_url: logo,
    plan_tier: tier,
    claim_status: "pending",
    needsReview: false,
    source: `${business.source} · claim pending`,
  };

  if (tier === "stroll" || tier === "stroll_plus") {
    if (payload.finisher_offer) {
      businessPatch.offers_finisher_item = Boolean(payload.finisher_offer.enabled);
      businessPatch.finisher_item = [payload.finisher_offer.type, payload.finisher_offer.offer].filter(Boolean).join(": ");
      businessPatch.finisher_cap_weekly = payload.finisher_offer.weekly_cap;
    }
    if (payload.basket) {
      businessPatch.donates_to_basket = Boolean(payload.basket.enabled);
      businessPatch.basket_item = [payload.basket.item, payload.basket.approximate_value, payload.basket.months].filter(Boolean).join(" · ");
    }
    if (payload.finish_venue) {
      businessPatch.hosts_group_finish = Boolean(payload.finish_venue.enabled);
      businessPatch.group_finish_biggest_group = payload.finish_venue.biggest_group;
      businessPatch.group_finish_windows = Array.isArray(payload.finish_venue.windows) ? payload.finish_venue.windows : [];
      businessPatch.group_finish_notice = payload.finish_venue.notice;
      businessPatch.group_finish_holds = payload.finish_venue.holds;
      businessPatch.group_finish_monthly_cap = payload.finish_venue.monthly_cap;
    }
  }

  const claims = await readOverlay<BusinessClaim>(city, "claims");
  await writeOverlay(city, "claims", [claim, ...claims]);

  await patchBusiness(city, businessId, sanitizeBusinessPatch(businessPatch));

  return claim;
}

export async function updateBusinessClaim(city: string, claimId: string, patch: Partial<BusinessClaim>) {
  const claims = await readOverlay<BusinessClaim>(city, "claims");
  const current = claims.find((claim) => claim.id === claimId);
  if (!current) return null;
  const updated = { ...current, ...patch, id: claimId };
  await writeOverlay(city, "claims", claims.map((claim) => claim.id === claimId ? updated : claim));
  return updated;
}

export async function markClaimCheckoutPaid(city: string, claimId: string, patch: Pick<Partial<BusinessClaim>, "stripe_customer_id" | "stripe_subscription_id"> = {}) {
  const updated = await updateBusinessClaim(city, claimId, { ...patch, payment_status: "paid" });
  if (!updated) return null;
  await patchBusiness(city, updated.business_id, { plan_tier: updated.plan_tier, claim_status: "pending", needsReview: false });
  return updated;
}

export async function updateClaimBySubscription(city: string, subscriptionId: string, patch: Partial<BusinessClaim>) {
  const claims = await readOverlay<BusinessClaim>(city, "claims");
  const current = claims.find((claim) => claim.stripe_subscription_id === subscriptionId);
  if (!current) return null;
  return updateBusinessClaim(city, current.id, patch);
}

export function fallbackEvents(data: StrollData): StrollEvent[] {
  return data.events?.length ? data.events : [
    { id: "night-market-demo", name: "Inglewood Night Market", venue: "9 Ave SE between 12 & 13 St", starts_at: "2026-07-24T17:00:00-06:00", ends_at: "2026-07-24T22:00:00-06:00", source: "Stroll event", lon: data.center[0] - 0.0028, lat: data.center[1] + 0.0006, emoji: "🏮" },
    { id: "gallery-walk-demo", name: "Gallery walk + local shops", venue: "Atlantic Ave / 9 Ave SE", starts_at: "2026-07-27T12:00:00-06:00", source: "Stroll event", lon: data.center[0] + 0.0024, lat: data.center[1] + 0.0002, emoji: "🎨" },
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

export function listHunts(data: StrollData) {
  const stopsById = new Map((data.huntStops ?? []).map((stop) => [stop.id, stop]));
  return (data.hunts ?? []).filter((hunt) => hunt.status === "live").map((hunt) => ({
    ...hunt,
    stops: hunt.stop_ids.map((id) => stopsById.get(id)).filter(Boolean),
  }));
}

export function getHunt(data: StrollData, slug: string) {
  return listHunts(data).find((hunt) => hunt.slug === slug || hunt.id === slug) ?? null;
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

/* ---------------------------------------------------------------------------
   Hunt sessions

   A session is the record of one team walking one hunt: which stops, in which
   order, which are solved, how many clues they burned, and which proof photo
   belongs to each stop. Everything the punch card and the postcard render from
   lives here, so a refresh — or a phone handed to someone else — resumes the
   same walk instead of silently starting a new one.

   Persistence follows the same runtime-overlay pattern as claims and business
   edits: a JSON file under .stroll/runtime. supabase/schema.sql carries the
   matching tables for when the platform moves to Postgres.
--------------------------------------------------------------------------- */

export type HuntSessionStop = {
  stop_id: string;
  state: "pending" | "solved" | "skipped";
  clues_used: number;
  solved_at: string | null;
  seconds: number;
  photo_url: string | null;
  photo_id: string | null;
};

export type HuntSession = {
  id: string;
  city: string;
  hunt_id: string;
  hunt_slug: string;
  hunt_name: string;
  mode: "friendly" | "full" | "race";
  team_name: string;
  email: string | null;
  /* Solo walkers, teams and large groups get the same hunt; the split shapes copy,
     the postcard byline, and later the leaderboard. A group splits into teams that
     start at different stops, which is why it books the rotated-start format. */
  /* Which flavour of walk this is — see hunt-themes.ts. Null is the curated list. */
  theme: string | null;
  party_type: "solo" | "team" | "group";
  party_size: number;
  team_count: number;
  /* A team inside a large group: its own punch card, its own start, but it shares
     the group's name and shows up on the group's board. */
  group_id: string | null;
  group_name: string | null;
  team_index: number | null;
  avatar_url: string | null;
  /* The stop order this team walks — rotated for races so two teams starting
     together don't queue at the same doorway. */
  stop_ids: string[];
  stops: HuntSessionStop[];
  start_index: number;
  status: "active" | "finished";
  paid: boolean;
  stripe_payment_id: string | null;
  photos_consented: boolean;
  /* Race scoring: each revealed clue adds time. Friendly and full runs ignore it. */
  penalty_seconds: number;
  elapsed_seconds: number;
  started_at: string;
  finished_at: string | null;
  updated_at: string;
};

/* Clue 1 costs 2 minutes, clue 2 five, clue 3 ten. Index 0 is "no clues used". */
export const CLUE_PENALTY_SECONDS = [0, 120, 300, 600];
const SESSION_LIMIT = 500;
const STOPS_FOR_MODE: Record<HuntSession["mode"], number> = { friendly: 4, full: 8, race: 8 };

/* Build a stop list for a theme: the doors that match it, spread along the strip so
   the walk moves in one direction instead of doubling back. Falls back to the hunt's
   curated list when a theme cannot fill the card — a themed hunt that repeats the
   same four doors is worse than the classic one. */
export function stopsForTheme(data: StrollData, hunt: Hunt, themeId: string | null | undefined, count: number) {
  const theme = getHuntTheme(themeId);
  if (!theme || theme.categories.length === 0) return hunt.stop_ids.slice(0, count);

  const businesses = new Map(data.businesses.map((business) => [business.id, business]));
  const wanted = new Set<string>(theme.categories);
  const pool = (data.huntStops ?? [])
    .filter((stop) => stop.status !== "retired")
    .filter((stop) => theme.allowAgeRestricted || !stop.age_restricted)
    .map((stop) => ({ stop, business: businesses.get(stop.business_id) }))
    .filter((row) => row.business && wanted.has(row.business.category))
    .sort((a, b) => (a.business!.lon - b.business!.lon));

  if (pool.length < count) return hunt.stop_ids.slice(0, count);

  /* One pick per bucket, west to east, so the stops are spaced along the street. */
  const bucket = pool.length / count;
  const picks: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const from = pool.slice(Math.floor(i * bucket), Math.max(Math.floor((i + 1) * bucket), Math.floor(i * bucket) + 1));
    const choice = from[Math.floor(Math.random() * from.length)];
    if (choice && !picks.includes(choice.stop.id)) picks.push(choice.stop.id);
  }
  /* Top up if a bucket collided, then give up gracefully rather than short-change. */
  for (const row of pool) {
    if (picks.length >= count) break;
    if (!picks.includes(row.stop.id)) picks.push(row.stop.id);
  }
  return picks.length === count ? picks : hunt.stop_ids.slice(0, count);
}

function rotateStops<T>(rows: T[], offset: number) {
  if (!rows.length) return rows;
  const n = ((offset % rows.length) + rows.length) % rows.length;
  return [...rows.slice(n), ...rows.slice(0, n)];
}

/* Races rotate their start by team name so the order is stable if a team
   reconnects, but different between teams that started at the same minute. */
function startOffsetFor(teamName: string) {
  return [...teamName].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
}

/* Hyphen, not underscore: the photo route slugifies the id for use as a directory
   name, and an underscore there would no longer match the stored session. */
function newSessionId() {
  const random = Math.random().toString(36).slice(2, 8);
  return `sess-${Date.now().toString(36)}-${random}`;
}

async function readSessions(city: string) {
  return readOverlay<HuntSession>(city, "hunt_sessions");
}

async function saveSession(city: string, session: HuntSession) {
  const rows = await readSessions(city);
  const next = [session, ...rows.filter((row) => row.id !== session.id)].slice(0, SESSION_LIMIT);
  await writeOverlay(city, "hunt_sessions", next);
  return session;
}

export async function getHuntSession(city: string, id: string) {
  const rows = await readSessions(city);
  return rows.find((row) => row.id === id) ?? null;
}

export async function createHuntSession(
  city: string,
  hunt: Hunt,
  data: StrollData,
  payload: {
    team_name?: string;
    email?: string;
    photos_consented?: boolean;
    party_type?: string;
    party_size?: number;
    team_count?: number;
    theme?: string;
  },
) {
  const partyType = payload.party_type === "solo"
    ? "solo" as const
    : payload.party_type === "group" ? "group" as const : "team" as const;
  const fallbackName = partyType === "solo"
    ? "Solo walker"
    : partyType === "group" ? "Anonymous group" : "Anonymous team";
  const teamName = sanitizeString(payload.team_name, 80) || fallbackName;
  const count = STOPS_FOR_MODE[hunt.mode] ?? hunt.stop_ids.length;
  const themed = stopsForTheme(data, hunt, payload.theme, count);
  const startIndex = hunt.mode === "race" ? startOffsetFor(teamName) % Math.max(1, themed.length) : 0;
  const ordered = hunt.mode === "race" ? rotateStops(themed, startIndex) : themed;
  const now = new Date().toISOString();
  const session: HuntSession = {
    id: newSessionId(),
    city,
    hunt_id: hunt.id,
    hunt_slug: hunt.slug,
    hunt_name: hunt.name,
    mode: hunt.mode,
    team_name: teamName,
    email: payload.email ? sanitizeString(payload.email, 160) : null,
    theme: payload.theme ? sanitizeString(payload.theme, 40) : null,
    party_type: partyType,
    group_id: null,
    group_name: null,
    team_index: null,
    /* A solo walk is always one person; a team is clamped to what one punch card can
       plausibly belong to; a group is a booking-sized crowd. */
    party_size: partyType === "solo"
      ? 1
      : partyType === "group"
        ? Math.min(200, Math.max(6, Math.floor(Number(payload.party_size ?? 12)) || 12))
        : Math.min(24, Math.max(2, Math.floor(Number(payload.party_size ?? 2)) || 2)),
    /* Only a group splits into teams; everyone else is a single punch card. */
    team_count: partyType === "group"
      ? Math.min(12, Math.max(2, Math.floor(Number(payload.team_count ?? 2)) || 2))
      : 1,
    avatar_url: null,
    stop_ids: ordered,
    stops: ordered.map((stopId) => ({
      stop_id: stopId,
      state: "pending",
      clues_used: 0,
      solved_at: null,
      seconds: 0,
      photo_url: null,
      photo_id: null,
    })),
    start_index: startIndex,
    status: "active",
    /* Friendly Mode is free; the paid modes stay unpaid until Stripe says otherwise. */
    paid: hunt.mode === "friendly",
    stripe_payment_id: null,
    photos_consented: Boolean(payload.photos_consented),
    penalty_seconds: 0,
    elapsed_seconds: 0,
    started_at: now,
    finished_at: null,
    updated_at: now,
  };
  return saveSession(city, session);
}

function recomputeSession(session: HuntSession): HuntSession {
  const penalty = session.mode === "race"
    ? session.stops.reduce((total, stop) => total + (CLUE_PENALTY_SECONDS[Math.min(stop.clues_used, 3)] ?? 0), 0)
    : 0;
  /* A stop is only finished when it is both solved and photographed — the photo is
     the proof, so a session with a missing photo is not a finished walk. */
  const complete = session.stops.length > 0
    && session.stops.every((stop) => stop.state === "solved" && Boolean(stop.photo_url));
  const finishedAt = complete ? session.finished_at ?? new Date().toISOString() : null;
  return {
    ...session,
    penalty_seconds: penalty,
    status: complete ? "finished" : "active",
    finished_at: finishedAt,
    updated_at: new Date().toISOString(),
  };
}

export type HuntProgressAction = "stop_solved" | "clue_revealed" | "stop_skipped" | "stop_reset";

export async function recordHuntProgress(
  city: string,
  sessionId: string,
  payload: { stop_id?: string; action?: string; clues_used?: number; seconds?: number; elapsed_seconds?: number },
) {
  const session = await getHuntSession(city, sessionId);
  if (!session) return null;
  const stopId = sanitizeString(payload.stop_id, 120);
  const action = (payload.action ?? "stop_solved") as HuntProgressAction;
  const index = session.stops.findIndex((stop) => stop.stop_id === stopId);
  if (index === -1) return null;

  const stops = session.stops.map((stop, i) => {
    if (i !== index) return stop;
    const seconds = Math.max(0, Math.floor(Number(payload.seconds ?? stop.seconds) || 0));
    if (action === "clue_revealed") {
      const requested = Number(payload.clues_used ?? stop.clues_used + 1);
      /* Clues only ever go up: re-reading clue 1 must not refund a race penalty. */
      return { ...stop, clues_used: Math.min(3, Math.max(stop.clues_used, Math.floor(requested) || 0)), seconds };
    }
    if (action === "stop_skipped") return { ...stop, state: "skipped" as const, seconds };
    if (action === "stop_reset") return { ...stop, state: "pending" as const, solved_at: null, seconds };
    return { ...stop, state: "solved" as const, solved_at: stop.solved_at ?? new Date().toISOString(), seconds };
  });

  const elapsed = Math.max(0, Math.floor(Number(payload.elapsed_seconds ?? session.elapsed_seconds) || 0));
  return saveSession(city, recomputeSession({ ...session, stops, elapsed_seconds: elapsed }));
}

/* Called by the photo upload once the file is on disk, so the session — not the
   client — is the record of which photo belongs to which doorway. */
export async function attachHuntPhoto(
  city: string,
  sessionId: string,
  payload: { stop_id: string; photo_id: string; photo_url: string },
) {
  const session = await getHuntSession(city, sessionId);
  if (!session) return null;
  const index = session.stops.findIndex((stop) => stop.stop_id === payload.stop_id);
  if (index === -1) return null;
  const stops = session.stops.map((stop, i) => (
    i === index ? { ...stop, photo_url: payload.photo_url, photo_id: payload.photo_id } : stop
  ));
  return saveSession(city, recomputeSession({ ...session, stops }));
}

/* The session plus the stop content it points at — what the dashboard renders.

   Unsolved stops are masked: no name, no business, because that is the answer the
   riddle is withholding. Hiding it in the UI would not be enough — it would still
   sit in the API response and the server-rendered payload, a one-keystroke cheat.
   Pass { reveal: true } from server-side callers that legitimately need the lot. */
export function hydrateHuntSession(session: HuntSession, data: StrollData, options: { reveal?: boolean } = {}) {
  const stopsById = new Map((data.huntStops ?? []).map((stop) => [stop.id, stop]));
  const solved = session.stops.filter((stop) => stop.state === "solved").length;
  return {
    ...session,
    solved_count: solved,
    total_stops: session.stops.length,
    photo_count: session.stops.filter((stop) => Boolean(stop.photo_url)).length,
    stroll_seconds: session.elapsed_seconds + session.penalty_seconds,
    stops: session.stops.map((stop, index) => {
      const content = stopsById.get(stop.stop_id);
      const earned = options.reveal || stop.state === "solved";
      return {
        ...stop,
        index,
        name: earned ? content?.name ?? "Unknown stop" : "",
        business_id: earned ? content?.business_id ?? null : null,
        business_slug: earned ? content?.business_slug ?? null : null,
        riddle: content?.riddle ?? "",
        /* Clues are handed out one at a time; an unsolved stop never ships the
           clues the team has not yet paid the time for. */
        clues: [content?.clue_1, content?.clue_2, content?.clue_3]
          .filter(Boolean)
          .slice(0, stop.state === "solved" ? 3 : stop.clues_used) as string[],
        challenge: content?.challenge ?? "Take a proof photo at the stop.",
        difficulty: content?.difficulty ?? "medium",
        age_restricted: Boolean(content?.age_restricted),
      };
    }),
  };
}

/* The team photo, uploaded during onboarding once the session exists. */
export async function setHuntSessionAvatar(city: string, sessionId: string, avatarUrl: string) {
  const session = await getHuntSession(city, sessionId);
  if (!session) return null;
  return saveSession(city, { ...session, avatar_url: avatarUrl, updated_at: new Date().toISOString() });
}

/* ---------------------------------------------------------------------------
   Hunt groups

   A birthday or a staff day is not one walk with twelve people on it — it is
   several teams walking the same eight stops at once. So a group creates one
   session per team, each with its own punch card, its own proof photos and its
   own starting stop, tied together by a group id and shown on one board.
--------------------------------------------------------------------------- */

export type HuntGroup = {
  id: string;
  city: string;
  hunt_id: string;
  hunt_slug: string;
  hunt_name: string;
  group_name: string;
  party_size: number;
  team_count: number;
  session_ids: string[];
  email: string | null;
  created_at: string;
  updated_at: string;
};

const GROUP_LIMIT = 200;

function newGroupId() {
  return `grp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function getHuntGroup(city: string, id: string) {
  const rows = await readOverlay<HuntGroup>(city, "hunt_groups");
  return rows.find((row) => row.id === id) ?? null;
}

export async function createHuntGroup(
  city: string,
  hunt: Hunt,
  payload: {
    group_name?: string;
    team_names?: unknown;
    party_size?: number;
    email?: string;
    photos_consented?: boolean;
    theme?: string;
  },
  data: StrollData,
) {
  const groupName = sanitizeString(payload.group_name, 80) || "Anonymous group";
  const rawNames = Array.isArray(payload.team_names) ? payload.team_names : [];
  const names = rawNames
    .slice(0, 12)
    .map((value, index) => sanitizeString(value, 80) || `Team ${index + 1}`);
  const teamNames = names.length >= 2 ? names : ["Team 1", "Team 2"];
  const stops = STOPS_FOR_MODE[hunt.mode] ?? hunt.stop_ids.length;
  /* One themed list for the whole group: every team walks the same doors, just
     starting at different ones. */
  const themed = stopsForTheme(data, hunt, payload.theme, stops);
  const groupId = newGroupId();
  const now = new Date().toISOString();

  const sessions: HuntSession[] = teamNames.map((teamName, index) => {
    /* Even spacing rather than a name hash: with six teams you want them a stop
       or two apart on purpose, not wherever the letters happen to land. */
    const startIndex = Math.floor((index * stops) / teamNames.length) % Math.max(1, themed.length);
    const ordered = rotateStops(themed, startIndex);
    return {
      id: `${newSessionId()}-t${index + 1}`,
      city,
      hunt_id: hunt.id,
      hunt_slug: hunt.slug,
      hunt_name: hunt.name,
      mode: hunt.mode,
      team_name: teamName,
      email: payload.email ? sanitizeString(payload.email, 160) : null,
      theme: payload.theme ? sanitizeString(payload.theme, 40) : null,
      party_type: "group",
      party_size: Math.min(200, Math.max(6, Math.floor(Number(payload.party_size ?? 12)) || 12)),
      team_count: teamNames.length,
      group_id: groupId,
      group_name: groupName,
      team_index: index,
      stop_ids: ordered,
      stops: ordered.map((stopId) => ({
        stop_id: stopId,
        state: "pending" as const,
        clues_used: 0,
        solved_at: null,
        seconds: 0,
        photo_url: null,
        photo_id: null,
      })),
      start_index: startIndex,
      status: "active" as const,
      paid: hunt.mode === "friendly",
      stripe_payment_id: null,
      photos_consented: Boolean(payload.photos_consented),
      penalty_seconds: 0,
      elapsed_seconds: 0,
      started_at: now,
      finished_at: null,
      updated_at: now,
      avatar_url: null,
    };
  });

  const existing = await readSessions(city);
  await writeOverlay(city, "hunt_sessions", [...sessions, ...existing].slice(0, SESSION_LIMIT));

  const group: HuntGroup = {
    id: groupId,
    city,
    hunt_id: hunt.id,
    hunt_slug: hunt.slug,
    hunt_name: hunt.name,
    group_name: groupName,
    party_size: sessions[0]?.party_size ?? 12,
    team_count: teamNames.length,
    session_ids: sessions.map((session) => session.id),
    email: payload.email ? sanitizeString(payload.email, 160) : null,
    created_at: now,
    updated_at: now,
  };
  const groups = await readOverlay<HuntGroup>(city, "hunt_groups");
  await writeOverlay(city, "hunt_groups", [group, ...groups.filter((row) => row.id !== group.id)].slice(0, GROUP_LIMIT));
  return { group, sessions };
}

/* The group board: every team's punch card at a glance, ordered by who is ahead. */
export async function hydrateHuntGroup(city: string, group: HuntGroup) {
  const all = await readSessions(city);
  const byId = new Map(all.map((session) => [session.id, session]));
  const teams = group.session_ids
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((session) => {
      const row = session as HuntSession;
      const solved = row.stops.filter((stop) => stop.state === "solved").length;
      return {
        session_id: row.id,
        team_index: row.team_index ?? 0,
        team_name: row.team_name,
        solved_count: solved,
        photo_count: row.stops.filter((stop) => Boolean(stop.photo_url)).length,
        total_stops: row.stops.length,
        status: row.status,
        start_index: row.start_index,
        stroll_seconds: row.elapsed_seconds + row.penalty_seconds,
        finished_at: row.finished_at,
      };
    });
  const ranked = [...teams].sort((a, b) => (
    b.solved_count - a.solved_count || a.stroll_seconds - b.stroll_seconds || a.team_index - b.team_index
  ));
  return {
    ...group,
    teams: teams.sort((a, b) => a.team_index - b.team_index),
    leader: ranked[0] ?? null,
    solved_total: teams.reduce((sum, team) => sum + team.solved_count, 0),
    stops_total: teams.reduce((sum, team) => sum + team.total_stops, 0),
  };
}

/* ---------------------------------------------------------------------------
   Answer checking

   The client never holds the answer — it posts a guess and the server says yes or
   no. Matching is deliberately forgiving: people type what is on the awning, not
   what is on the licence, so "fairs fair" has to clear "Fair's Fair (For Book
   Lovers)" while "the bakery" still does not.
--------------------------------------------------------------------------- */

function normalizeGuess(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(the|a|an|and|of|inc|ltd|llc|co|company|calgary|inglewood)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* Levenshtein, capped: we only care whether it is within a couple of typos. */
function editDistance(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 4) return 99;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let last = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const temp = prev[j];
      prev[j] = Math.min(
        prev[j] + 1,
        prev[j - 1] + 1,
        last + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      last = temp;
    }
  }
  return prev[b.length];
}

export function guessMatchesName(guess: string, name: string) {
  const g = normalizeGuess(guess);
  /* The bit before any bracket is what a sign actually says. */
  const core = normalizeGuess(name.replace(/\(.*?\)/g, ""));
  const full = normalizeGuess(name);
  if (g.length < 3 || !core) return false;
  if (g === core || g === full) return true;
  /* A guess that is most of the name, or the name with a typo or two. */
  if (core.startsWith(g) && g.length >= Math.max(4, Math.floor(core.length * 0.6))) return true;
  if (editDistance(g, core) <= Math.max(1, Math.floor(core.length * 0.15))) return true;
  /* Distinctive words carry it: "blackfoot" for "The Blackfoot Room". */
  const words = core.split(" ").filter((word) => word.length >= 5);
  if (words.length > 0 && words.some((word) => g === word)) return true;
  /* Same tests without spaces, because people type "fairsfair" and "black foot". */
  const gs = g.replace(/\s/g, "");
  const cs = core.replace(/\s/g, "");
  if (!gs || !cs) return false;
  if (gs === cs) return true;
  if (cs.startsWith(gs) && gs.length >= Math.max(4, Math.floor(cs.length * 0.6))) return true;
  return editDistance(gs, cs) <= Math.max(1, Math.floor(cs.length * 0.15));
}

export async function checkHuntAnswer(city: string, sessionId: string, stopId: string, guess: string, data: StrollData) {
  const session = await getHuntSession(city, sessionId);
  if (!session) return null;
  const entry = session.stops.find((stop) => stop.stop_id === stopId);
  if (!entry) return null;
  const content = (data.huntStops ?? []).find((stop) => stop.id === stopId);
  const correct = Boolean(content && guessMatchesName(guess, content.name));
  if (!correct) return { correct: false, session };
  const stops = session.stops.map((stop) => (
    stop.stop_id === stopId
      ? { ...stop, state: "solved" as const, solved_at: stop.solved_at ?? new Date().toISOString() }
      : stop
  ));
  const saved = await saveSession(city, recomputeSession({ ...session, stops }));
  return { correct: true, session: saved };
}
