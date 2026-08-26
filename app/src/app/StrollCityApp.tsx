"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl, { LngLatBounds, Map as MapLibreMap, Marker, type StyleSpecification } from "maplibre-gl";
import {
  Bike,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Compass,
  Globe,
  Landmark,
  Layers,
  Minus,
  Navigation,
  Plus,
  Route,
  Search,
  ShieldCheck,
  Waves,
  X,
} from "lucide-react";
import { inkOn, type CityConfig } from "./cities";
import styles from "./page.module.css";

export type Category = "restaurant" | "cafe" | "bar" | "shop" | "services" | "gallery";
type SidebarTab = "explore" | "events" | "saved";

type Business = {
  id: string;
  name: string;
  category: Category;
  mono: string;
  lon: number;
  lat: number;
  address: string;
  blurb: string;
  hours: string;
  highlights: [string, string][];
  photo: string;
  logo_url?: string;
  plan_tier?: "free" | "stroll" | "stroll_plus";
  claim_status?: "unclaimed" | "pending" | "claimed" | "rejected";
  domain?: string | null;
  website?: string | null;
  phone?: string | null;
  licence_category?: string;
  category_note?: string | null;
  sensory_tags?: string[];
  source: string;
  needsReview: boolean;
};

type Neighbourhood = {
  id: string;
  name: string;
  center: [number, number];
  bounds: [[number, number], [number, number]];
  bearing: number;
  enabled: boolean;
};

type EventItem = {
  id: string;
  name: string;
  venue: string;
  starts_at: string;
  ends_at?: string;
  source: string;
  lon: number;
  lat: number;
  url?: string;
};

type Attraction = {
  id: string;
  name: string;
  lon: number;
  lat: number;
  blurb: string;
  photo_url?: string;
};

type StrollData = {
  generatedAt: string;
  center: [number, number];
  stripBounds: [[number, number], [number, number]];
  businesses: Business[];
  businessBuildings: GeoJSON.FeatureCollection;
  trees: [number, number][];
  streets: GeoJSON.FeatureCollection;
  bike: GeoJSON.FeatureCollection;
  pathways: GeoJSON.FeatureCollection;
  neighbourhoods: Neighbourhood[];
  events?: EventItem[];
  attractions?: Attraction[];
  hunts?: HuntSummary[];
  stats: { businesses: number; businessBuildings: number; trees: number; categories: Record<string, number> };
};

type HuntSummary = {
  id: string;
  slug: string;
  name: string;
  blurb: string;
  mode: "friendly" | "full" | "race";
  stop_ids: string[];
  est_minutes: number;
  distance_m: number;
  status: string;
};

type UserLocation = { lon: number; lat: number; accuracy?: number };
type WalkingRoute = { target: Business; coords: [number, number][]; distanceM: number; network: boolean };

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const MIN_STRIP_ZOOM = 15.5;

export const CAT_ICON: Record<Category, string> = {
  restaurant: "M7 3v8a3 3 0 0 0 6 0V3M10 11v10M17 3c-1.2 2-1.6 3.4-1.6 5.2 0 1.3.7 2 1.6 2s1.6-.7 1.6-2C18.6 6.4 18.2 5 17 3Zm0 7.2V21",
  cafe: "M4 8h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Zm12 1h2.5a2.5 2.5 0 0 1 0 5H16M3 21h14",
  bar: "M5 4h14l-7 8v7M9 21h6M5 4l7 8",
  shop: "M4 8h16l-1 12H5L4 8Zm4 0V6a4 4 0 0 1 8 0v2",
  services: "M12 3v3M12 18v3M4.5 12h3M16.5 12h3M6.7 6.7l2.1 2.1M15.2 15.2l2.1 2.1M17.3 6.7l-2.1 2.1M8.8 15.2l-2.1 2.1",
  gallery: "M12 3a9 9 0 1 0 0 18c1.4 0 2-.9 2-2 0-2 2-1.6 3.4-2.2A5 5 0 0 0 21 12a9 9 0 0 0-9-9Zm-3.5 6h0M12 7h0m3.5 2h0",
};
export const CAT_LABEL: Record<Category, string> = {
  restaurant: "Restaurants",
  cafe: "Cafés & sweets",
  bar: "Bars & music",
  shop: "Shops",
  services: "Studios & services",
  gallery: "Arts & galleries",
};
const MOBILE_CAT_LABEL: Record<Category, string> = {
  restaurant: "Food",
  cafe: "Cafés",
  bar: "Bars",
  shop: "Shops",
  services: "Services",
  gallery: "Arts",
};
export const CAT_BLURB: Record<Category, string> = {
  restaurant: "Dining rooms, patios, counters",
  cafe: "Coffee, bakeries, ice cream",
  bar: "Taprooms, cocktails, live sets",
  shop: "Records, books, wine, homeware",
  services: "Barbers, makers, bookable rooms",
  gallery: "Galleries, studios, openings",
};
export const allCategories = Object.keys(CAT_LABEL) as Category[];

function categoriesFromUrl() {
  if (typeof window === "undefined") return new Set(allCategories);
  const raw = new URLSearchParams(window.location.search).get("cat");
  if (!raw) return new Set(allCategories);
  const requested = raw.split(",").filter((value): value is Category => allCategories.includes(value as Category));
  return new Set(requested);
}
function replaceCategoryUrl(categories: Set<Category>) {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  if (categories.size === allCategories.length) params.delete("cat");
  else params.set("cat", allCategories.filter((cat) => categories.has(cat)).join(","));
  const qs = params.toString();
  window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
}

/** Fill tone — pin borders, tiles, legend dots. */
export function categoryColor(city: CityConfig, category: Category) {
  return city.theme.categories[category] ?? city.theme.primary;
}

/** Text/stroke tone — the same hue dark enough to read on a light surface. */
export function categoryInk(city: CityConfig, category: Category) {
  return city.theme.categoryInks[category] ?? categoryColor(city, category);
}

/** Ink to place on top of the category fill. */
export function onCategory(city: CityConfig, category: Category) {
  return inkOn(categoryColor(city, category));
}

export function wash(hex: string, a = 26, b = 10) {
  const av = a.toString(16).padStart(2, "0");
  const bv = b.toString(16).padStart(2, "0");
  return `linear-gradient(145deg, ${hex}${av}, ${hex}${bv})`;
}

export function CatIcon({ d, size = 16, color = "currentColor", strokeWidth = 1.7 }: { d: string; size?: number; color?: string; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

/* ---------------- rail icons (ported verbatim from the design file) ---------------- */
export function IconExplore() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 11 12 4l8.5 7" /><path d="M5.5 10v9.5h13V10" /><path d="M10 19.5V14h4v5.5" /></svg>; }
export function IconAdd() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>; }
function IconEvents() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="5" width="17" height="15.5" rx="3" /><path d="M8 3.5v3M16 3.5v3M3.5 10h17" /></svg>; }
function IconSaved() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 4h11v16.5l-5.5-3.9-5.5 3.9V4Z" /></svg>; }
function IconOpenData() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="6" rx="7.5" ry="3" /><path d="M4.5 6v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3V6" /><path d="M4.5 12v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-6" /></svg>; }
function IconHeart({ filled = false }: { filled?: boolean }) { return <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7"><path d="M12 20s-7.5-4.6-7.5-9.6A4.4 4.4 0 0 1 12 7.4a4.4 4.4 0 0 1 7.5 3c0 5-7.5 9.6-7.5 9.6Z" /></svg>; }

/* ---------------- hours: best-effort real parse (no fabricated status) ---------------- */
function parseHourToken(token: string): number | null {
  const m = token.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!m) return null;
  let hour = parseInt(m[1], 10);
  const minute = m[2] ? parseInt(m[2], 10) : 0;
  let meridiem = m[3]?.toLowerCase();
  if (!meridiem) {
    if (hour === 12) meridiem = "pm";
    else return null;
  }
  hour = meridiem === "am" ? hour % 12 : (hour % 12) + 12;
  return hour * 60 + minute;
}
function isOpenNow(hours: string, nowMinutes: number): boolean | null {
  const clean = hours.split(",")[0].trim();
  const parts = clean.split(/[–-]/).map((s) => s.trim());
  if (parts.length !== 2) return null;
  const start = parseHourToken(parts[0]);
  let end = parseHourToken(parts[1]);
  if (start === null || end === null) return null;
  if (end <= start) end += 24 * 60;
  if (nowMinutes >= start && nowMinutes <= end) return true;
  if (nowMinutes + 24 * 60 >= start && nowMinutes + 24 * 60 <= end) return true;
  return false;
}
function edmontonMinutesNow() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Edmonton", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
  const hh = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
  const mm = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);
  return hh * 60 + mm;
}

/* raw markup for vanilla-DOM markers */
type PinMode = "dot" | "logo" | "label";
function pinMarkup(styles_: typeof styles, biz: Business, color: string, mode: PinMode, active: boolean) {
  const hasLogo = Boolean(biz.logo_url);
  const compact = mode !== "label";
  const glyphInner = mode === "dot" ? "" : hasLogo ? `<img src="${biz.logo_url}" alt="" />` : biz.mono;
  const fill = mode === "dot" ? color : hasLogo ? "#fff" : "#E7E9EC";
  const classes = [styles_.pin, compact ? styles_.compact : "", mode === "dot" ? styles_.dotPin : "", active ? styles_.pinActive : ""].filter(Boolean).join(" ");
  const glyph = `<span class="${styles_.glyph}" style="background:${fill};color:#14161A;border-color:${color}">${glyphInner}</span>`;
  if (mode !== "label") return `<div class="${classes}">${glyph}</div>`;
  return `<div class="${classes}">${glyph}<span class="${styles_.label}">${biz.name}</span></div>`;
}
function fallbackEvents(data: StrollData): EventItem[] {
  return [
    { id: "night-market-demo", name: "Inglewood Night Market", venue: "9 Ave SE between 12 & 13 St", starts_at: "2026-07-24T17:00:00-06:00", ends_at: "2026-07-24T22:00:00-06:00", source: "Stroll event", lon: data.center[0] - 0.0028, lat: data.center[1] + 0.0006 },
    { id: "gallery-walk-demo", name: "Gallery walk + local shops", venue: "Atlantic Ave / 9 Ave SE", starts_at: "2026-07-27T12:00:00-06:00", source: "Stroll event", lon: data.center[0] + 0.0024, lat: data.center[1] + 0.0002 },
  ];
}
function fallbackAttractions(data: StrollData): Attraction[] {
  return [
    { id: "zoo", name: "Calgary Zoo", lon: -114.0307, lat: 51.0457, blurb: "A citywide discovery pin near the Bow River and Inglewood." },
    { id: "fort-calgary", name: "The Confluence", lon: -114.0446, lat: 51.0476, blurb: "Historic gathering place and cultural destination." },
    { id: "riverwalk", name: "RiverWalk", lon: data.center[0] - 0.006, lat: data.center[1] + 0.005, blurb: "A friendly route for strolling into the neighbourhood." },
  ];
}
function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-CA", { month: "short", day: "numeric", timeZone: "America/Edmonton" });
}
function normalize(value: string) {
  return value.toLowerCase().trim();
}
/* Search folds accents so "cafe" finds "Café" — typing é on a phone keyboard is a long-press most people won't do. */
function foldForSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
/* Every term has to appear somewhere, in any order, so "cafe 124" finds "Café on 124 Street". */
function searchTerms(query: string) {
  return foldForSearch(query).split(/\s+/).filter(Boolean);
}

const SEARCH_SYNONYMS: Record<string, string[]> = {
  bookstore: ["book", "books", "shop", "store"],
  books: ["book", "bookstore", "shop", "store"],
  book: ["books", "bookstore"],
  store: ["shop", "shops", "retail", "boutique", "bookstore"],
  stores: ["shop", "shops", "retail", "boutique"],
  shop: ["store", "shops", "retail", "boutique"],
  shops: ["shop", "store", "retail", "boutique"],
  coffee: ["cafe", "cafes", "espresso"],
  cafe: ["coffee", "cafes", "bakery", "bakeries"],
  cafes: ["cafe", "coffee", "bakery", "bakeries"],
  pub: ["bar", "bars", "taproom", "beer"],
  bar: ["pub", "bars", "cocktail", "beer"],
  restaurant: ["food", "dining", "kitchen", "eat", "eats"],
  food: ["restaurant", "dining", "kitchen", "eat", "eats"],
  art: ["arts", "gallery", "galleries", "studio"],
  arts: ["art", "gallery", "galleries", "studio"],
};
function expandedSearchTerms(term: string) {
  return [term, ...(SEARCH_SYNONYMS[term] ?? [])];
}
function editDistance(a: string, b: string) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > 2) return 3;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  const curr = new Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    for (let j = 0; j <= b.length; j += 1) prev[j] = curr[j];
  }
  return prev[b.length];
}
function tokenMatchesCandidate(token: string, candidate: string, allowTypo: boolean) {
  return token.includes(candidate) || (allowTypo && token.length >= 3 && candidate.includes(token)) || (allowTypo && ((candidate.length >= 5 && candidate[0] === token[0] && editDistance(candidate, token) <= (candidate.length >= 7 ? 2 : 1)) || (candidate.length >= 3 && token.length >= 4 && candidate[0] === token[0] && editDistance(candidate, token) <= 1)));
}
function searchFieldTokens(value: string) {
  return foldForSearch(value).split(/\s+/).filter(Boolean);
}
function businessSearchFields(b: Business) {
  return {
    name: searchFieldTokens(b.name),
    primary: searchFieldTokens(`${b.name} ${b.category} ${CAT_LABEL[b.category]} ${b.blurb} ${b.category_note ?? ""} ${(b.sensory_tags ?? []).join(" ")}`),
    all: searchFieldTokens(`${b.name} ${b.address} ${b.category} ${CAT_LABEL[b.category]} ${b.licence_category ?? ""} ${b.category_note ?? ""} ${b.blurb} ${b.highlights.map(([, text]) => text).join(" ")} ${(b.sensory_tags ?? []).join(" ")}`),
  };
}
function businessSearchScore(b: Business, terms: string[]) {
  if (!terms.length) return 1;
  const fields = businessSearchFields(b);
  const compactName = fields.name.join("");
  const compactPrimary = fields.primary.join("");
  const compactAll = fields.all.join("");
  const compactQuery = terms.join("");
  let score = 0;
  if (compactName.includes(compactQuery)) score += 80;
  else if (compactPrimary.includes(compactQuery)) score += 55;
  else if (compactAll.includes(compactQuery)) score += 30;

  for (const term of terms) {
    const synonymTerms = expandedSearchTerms(term);
    const directName = fields.name.some((token) => tokenMatchesCandidate(token, term, true));
    const directPrimary = fields.primary.some((token) => tokenMatchesCandidate(token, term, true));
    const synonymPrimary = synonymTerms.slice(1).some((candidate) => fields.primary.some((token) => tokenMatchesCandidate(token, candidate, false)));
    const directAll = fields.all.some((token) => tokenMatchesCandidate(token, term, true));
    const synonymAll = synonymTerms.slice(1).some((candidate) => fields.all.some((token) => tokenMatchesCandidate(token, candidate, false)));
    if (!directName && !directPrimary && !synonymPrimary && !directAll && !synonymAll) return 0;
    score += directName ? 18 : directPrimary ? 12 : synonymPrimary ? 8 : directAll ? 5 : synonymAll ? 3 : 0;
  }
  return score;
}
function streetOnly(name: string) {
  const parts = name.split("/");
  return parts[parts.length - 1].trim();
}
function areaOnly(name: string) {
  return name.split("/")[0].trim();
}

function emptyRouteFeature(): GeoJSON.FeatureCollection<GeoJSON.LineString> {
  return { type: "FeatureCollection", features: [] };
}

function routeFeature(coords: [number, number][]): GeoJSON.FeatureCollection<GeoJSON.LineString> {
  return coords.length >= 2
    ? { type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } }] }
    : emptyRouteFeature();
}

type MutableStyle = Omit<StyleSpecification, "sources" | "layers"> & {
  sources: Record<string, unknown>;
  layers: Array<Record<string, unknown>>;
};

const OPENFREEMAP_POSITRON_STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

function strollMapSources(data: StrollData): Record<string, unknown> {
  return {
    streets: { type: "geojson", data: data.streets },
    biz: { type: "geojson", data: data.businessBuildings },
    bike: { type: "geojson", data: data.bike },
    pathways: { type: "geojson", data: data.pathways },
    walkingRoute: { type: "geojson", data: emptyRouteFeature() },
    stripband: { type: "geojson", data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [[51.03755, -114.03430], [51.03720, -114.01560]] } } },
  };
}

function strollMainStreetWatercolourLayers(): Array<Record<string, unknown>> {
  return [
    {
      id: "main-street-watercolour-wash",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      minzoom: 11,
      filter: ["all", ["match", ["geometry-type"], ["LineString", "MultiLineString"], true, false], ["match", ["get", "class"], ["primary", "secondary", "tertiary", "trunk"], true, false]],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#D94848",
        "line-opacity": ["interpolate", ["linear"], ["zoom"], 11, 0.06, 14, 0.095, 17, 0.15, 20, 0.18],
        "line-width": ["interpolate", ["exponential", 1.25], ["zoom"], 11, 11, 14, 23, 17, 48, 20, 92],
        "line-blur": ["interpolate", ["linear"], ["zoom"], 11, 4, 16, 9, 20, 14],
      },
    },
    {
      id: "main-street-watercolour-core",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      minzoom: 12,
      filter: ["all", ["match", ["geometry-type"], ["LineString", "MultiLineString"], true, false], ["match", ["get", "class"], ["primary", "secondary", "tertiary", "trunk"], true, false]],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#E45252",
        "line-opacity": ["interpolate", ["linear"], ["zoom"], 12, 0.045, 15, 0.08, 18, 0.12, 20, 0.135],
        "line-width": ["interpolate", ["exponential", 1.22], ["zoom"], 12, 6, 15, 16, 18, 35, 20, 60],
        "line-blur": 5,
      },
    },
  ];
}

function strollOverlayLayers(): Array<Record<string, unknown>> {
  return [
    { id: "stripband", type: "line", source: "stripband", layout: { "line-cap": "round" }, paint: { "line-color": "#14161A", "line-width": 26, "line-opacity": 0.08 } },
    { id: "pathways", type: "line", source: "pathways", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#8A8E96", "line-width": ["interpolate", ["linear"], ["zoom"], 11, 1.2, 15, 3, 18, 5], "line-opacity": 0.55 } },
    { id: "bike-line", type: "line", source: "bike", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#57C07A", "line-width": ["interpolate", ["linear"], ["zoom"], 11, 1, 15, 2.4, 18, 4], "line-dasharray": [2, 1.6], "line-opacity": 0.6 } },
    { id: "walking-route-halo", type: "line", source: "walkingRoute", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#ffffff", "line-width": ["interpolate", ["linear"], ["zoom"], 13, 5, 18, 10], "line-opacity": 0.95 } },
    { id: "walking-route", type: "line", source: "walkingRoute", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#E3342F", "line-width": ["interpolate", ["linear"], ["zoom"], 13, 3, 18, 6], "line-opacity": 0.96 } },
    { id: "street-ink", type: "line", source: "streets", paint: { "line-color": "#E2E4E8", "line-width": ["interpolate", ["linear"], ["zoom"], 13, 0.4, 16, 1.2, 18, 2.8], "line-opacity": 0.6 } },
    { id: "biz-shadow", type: "fill", source: "biz", minzoom: 15, paint: { "fill-color": "#14161A", "fill-opacity": 0.05, "fill-translate": [2, 3] } },
    { id: "biz-roof", type: "fill", source: "biz", minzoom: 15, paint: { "fill-color": "#FAFAFB", "fill-opacity": 0.6 } },
    { id: "biz-edge", type: "line", source: "biz", minzoom: 15, paint: { "line-color": "#E7E9EC", "line-width": 1, "line-opacity": 0.85 } },
  ];
}

async function buildCrispNoLabelMapStyle(data: StrollData): Promise<StyleSpecification> {
  const response = await fetch(OPENFREEMAP_POSITRON_STYLE_URL, { cache: "force-cache" });
  if (!response.ok) throw new Error(`OpenFreeMap style failed: ${response.status}`);
  const base = await response.json() as MutableStyle;
  const layers = base.layers ?? [];
  const baseMapLayers = layers.filter((layer) => layer.type !== "symbol");
  const streetNameLayers = layers.filter((layer) => typeof layer.id === "string" && ["highway-name-major", "highway-name-minor", "highway-name-path"].includes(layer.id));
  return {
    ...base,
    sources: { ...base.sources, ...strollMapSources(data) },
    layers: [...baseMapLayers, ...strollMainStreetWatercolourLayers(), ...strollOverlayLayers(), ...streetNameLayers],
  } as StyleSpecification;
}

function metersBetween(a: [number, number], b: [number, number]) {
  const toRad = Math.PI / 180;
  const lat1 = a[1] * toRad, lat2 = b[1] * toRad;
  const dLat = (b[1] - a[1]) * toRad, dLon = (b[0] - a[0]) * toRad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 12742000 * Math.asin(Math.sqrt(h));
}

function geometryLines(feature: GeoJSON.Feature): [number, number][][] {
  const geom = feature.geometry;
  if (!geom) return [];
  if (geom.type === "LineString") return [geom.coordinates as [number, number][]];
  if (geom.type === "MultiLineString") return geom.coordinates as [number, number][][];
  return [];
}

function buildWalkingRoute(data: StrollData, start: [number, number], finish: [number, number]): [number, number][] | null {
  const nodeIds = new Map<string, number>();
  const nodes: [number, number][] = [];
  const graph: Array<Array<[number, number]>> = [];
  const keyFor = (coord: [number, number]) => `${coord[0].toFixed(5)},${coord[1].toFixed(5)}`;
  const addNode = (coord: [number, number]) => {
    const key = keyFor(coord);
    const existing = nodeIds.get(key);
    if (existing !== undefined) return existing;
    const id = nodes.length;
    nodeIds.set(key, id);
    nodes.push(coord);
    graph.push([]);
    return id;
  };
  const addEdge = (a: [number, number], b: [number, number]) => {
    const ai = addNode(a), bi = addNode(b);
    const d = metersBetween(a, b);
    graph[ai].push([bi, d]);
    graph[bi].push([ai, d]);
  };

  [data.streets, data.pathways, data.bike].forEach((collection) => {
    collection.features.forEach((feature) => {
      geometryLines(feature).forEach((line) => {
        for (let i = 1; i < line.length; i += 1) addEdge(line[i - 1], line[i]);
      });
    });
  });
  if (!nodes.length) return null;
  const nearest = (point: [number, number]) => {
    let best = 0, bestD = Infinity;
    nodes.forEach((node, index) => {
      const d = metersBetween(point, node);
      if (d < bestD) { best = index; bestD = d; }
    });
    return { index: best, distance: bestD };
  };
  const startNode = nearest(start), finishNode = nearest(finish);
  if (startNode.distance > 220 || finishNode.distance > 220) return null;

  const dist = new Array(nodes.length).fill(Infinity);
  const prev = new Array<number>(nodes.length).fill(-1);
  const seen = new Set<number>();
  dist[startNode.index] = 0;
  while (seen.size < nodes.length) {
    let u = -1, best = Infinity;
    for (let i = 0; i < dist.length; i += 1) {
      if (!seen.has(i) && dist[i] < best) { best = dist[i]; u = i; }
    }
    if (u === -1 || u === finishNode.index) break;
    seen.add(u);
    graph[u].forEach(([v, weight]) => {
      const next = dist[u] + weight;
      if (next < dist[v]) { dist[v] = next; prev[v] = u; }
    });
  }
  if (!Number.isFinite(dist[finishNode.index])) return null;
  const path: [number, number][] = [];
  for (let at = finishNode.index; at !== -1; at = prev[at]) path.push(nodes[at]);
  path.reverse();
  return [start, ...path, finish];
}

export default function StrollCityApp({ city }: { city: CityConfig }) {
  const mapNode = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const mapWrapRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const pinMarkersRef = useRef<Marker[]>([]);
  const eventMarkersRef = useRef<Marker[]>([]);
  const featMarkersRef = useRef<{ marker: Marker; attraction: Attraction }[]>([]);
  const userMarkerRef = useRef<Marker | null>(null);
  const geoWatchRef = useRef<number | null>(null);
  const rowElsRef = useRef<Map<string, HTMLElement>>(new Map());
  const pinElsRef = useRef<Map<string, HTMLElement>>(new Map());
  const lastFitKeyRef = useRef("");

  const [data, setData] = useState<StrollData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<SidebarTab>("explore");
  const [browseCategory, setBrowseCategory] = useState<Category | null>(null);
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<"az" | "claimed">("az");
  const [selected, setSelected] = useState<Business | null>(null);
  const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [showNames, setShowNames] = useState(true);
  const [showStrip, setShowStrip] = useState(true);
  const [showBike, setShowBike] = useState(true);
  const [showPathways, setShowPathways] = useState(true);
  const [showBeyond, setShowBeyond] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const [showOpenNow, setShowOpenNow] = useState(true);
  const [showTrees, setShowTrees] = useState(true);
  const [neighbourhoodSaved, setNeighbourhoodSaved] = useState(true);
  const [welcome, setWelcome] = useState(false);
  const [hint, setHint] = useState<string | null>("Hover a chip to preview it; click to open the profile without leaving the map.");
  const [extent, setExtent] = useState<"strip" | "city">("strip");
  const [layersOpen, setLayersOpen] = useState(false);
  const [stageTight, setStageTight] = useState(false);
  const [stageSnug, setStageSnug] = useState(false);
  const [stageShort, setStageShort] = useState(false);
  const [pinLayoutTick, setPinLayoutTick] = useState(0);
  const [mobileLayout, setMobileLayout] = useState(false);
  const [activeCategories, setActiveCategories] = useState<Set<Category>>(() => categoriesFromUrl());
  const [sheetStop, setSheetStop] = useState<"peek" | "half" | "full">("peek");
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const tabsRef = useRef<HTMLDivElement | null>(null);
  const mobileTopRef = useRef<HTMLDivElement | null>(null);
  const locateRef = useRef<HTMLButtonElement | null>(null);
  const sheetStopsRef = useRef({ peek: 132, half: 340, full: 560 });
  const sheetHeightRef = useRef(132);
  const suppressStripRefitCountRef = useRef(0);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [walkingRoute, setWalkingRoute] = useState<WalkingRoute | null>(null);

  /* ---------------- mobile/desktop layout switch (live, not a one-time check) ---------------- */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 860px)");
    const update = () => setMobileLayout(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (city.status !== "live" || !city.dataPath) return;
    const welcomeTimer = window.setTimeout(() => {
      try {
        const isSmallScreen = window.matchMedia("(max-width: 860px)").matches;
        const seen = window.localStorage.getItem(`stroll-welcome-${city.slug}`);
        setWelcome(!seen && !isSmallScreen);
        if (isSmallScreen) setPanelCollapsed(true);
      } catch {
        setWelcome(false);
      }
    }, 0);
    fetch(`${BASE_PATH}${city.dataPath}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Data fetch failed: ${r.status}`);
        return r.json();
      })
      .then((json: StrollData) => {
        const apiBase = `/api/v1/${city.slug}`;
        return Promise.allSettled([
          fetch(`${apiBase}/businesses`).then((r) => r.ok ? r.json() : null),
          fetch(`${apiBase}/events`).then((r) => r.ok ? r.json() : null),
          fetch(`${apiBase}/attractions`).then((r) => r.ok ? r.json() : null),
        ]).then(([businesses, apiEvents, apiAttractions]) => {
          const next = { ...json };
          if (businesses.status === "fulfilled" && Array.isArray(businesses.value?.data)) next.businesses = businesses.value.data;
          if (apiEvents.status === "fulfilled" && Array.isArray(apiEvents.value?.data)) next.events = apiEvents.value.data;
          if (apiAttractions.status === "fulfilled" && Array.isArray(apiAttractions.value?.data)) next.attractions = apiAttractions.value.data;
          return next;
        });
      })
      .then((json: StrollData) => setData(json))
      .catch((fetchError) => setError(fetchError instanceof Error ? fetchError.message : "Could not load map data"));
    return () => window.clearTimeout(welcomeTimer);
  }, [city]);

  const events = useMemo(() => (data ? data.events?.length ? data.events : fallbackEvents(data) : []), [data]);
  const attractions = useMemo(() => (data ? data.attractions?.length ? data.attractions : fallbackAttractions(data) : []), [data]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    data?.businesses.forEach((b) => (c[b.category] = (c[b.category] || 0) + 1));
    return c;
  }, [data]);

  const isResultsView = query.trim() !== "" || browseCategory !== null;

  const queryMatches = useMemo(() => {
    if (!data) return [];
    const terms = searchTerms(query);
    if (!terms.length) return data.businesses;
    const scored = data.businesses
      .map((business) => ({ business, score: businessSearchScore(business, terms) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || a.business.name.localeCompare(b.business.name));
    const topScore = scored[0]?.score ?? 0;
    const relevanceFloor = Math.max(1, topScore * 0.45);
    return scored.filter(({ score }) => score >= relevanceFloor).map(({ business }) => business);
  }, [data, query]);

  const nowMinutes = useMemo(() => edmontonMinutesNow(), []);
  const openNowCount = useMemo(() => {
    if (!data) return 0;
    return data.businesses.filter((b) => isOpenNow(b.hours, nowMinutes)).length;
  }, [data, nowMinutes]);

  const visibleBusinesses = useMemo(() => {
    const terms = searchTerms(query);
    /* mobile browses via multi-select chips; desktop drills into one category at a time */
    const list = queryMatches.filter((b) => activeCategories.has(b.category) && (browseCategory ? b.category === browseCategory : true) && (showOpenNow || !isOpenNow(b.hours, nowMinutes)));
    /* While searching, keep the best semantic matches first; otherwise use the requested browse sort. */
    const rank = (b: Business) => (terms.length ? -businessSearchScore(b, terms) : 0);
    return [...list].sort((a, b) => {
      const ra = rank(a), rb = rank(b);
      if (ra !== rb) return ra - rb;
      if (sortMode === "claimed") {
        const ca = a.claim_status === "claimed" ? 0 : 1;
        const cb = b.claim_status === "claimed" ? 0 : 1;
        if (ca !== cb) return ca - cb;
      }
      return a.name.localeCompare(b.name);
    });
  }, [queryMatches, browseCategory, query, sortMode, activeCategories, showOpenNow, nowMinutes]);

  /* Distinguishes "nothing matches your text" from "your chips are hiding the matches", which need different fixes. */
  const hiddenByCategories = queryMatches.length - visibleBusinesses.length;

  const closeWelcome = () => {
    setWelcome(false);
    try {
      window.localStorage.setItem(`stroll-welcome-${city.slug}`, "1");
    } catch {
      // Private/in-app browsers can block localStorage; the button should still close the overlay.
    }
  };

  const openCategory = (key: Category) => { setBrowseCategory(key); setQuery(""); };
  const backToBrowse = () => { setBrowseCategory(null); setQuery(""); setSelected(null); };
  const setCategories = (next: Set<Category>) => {
    setActiveCategories(next);
    replaceCategoryUrl(next);
    if (selected && !next.has(selected.category)) setSelected(null);
  };
  const toggleActiveCategory = (key: Category) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      replaceCategoryUrl(next);
      if (selected && !next.has(selected.category)) setSelected(null);
      return next;
    });
  };
  const restoreCameraAfterLayout = (camera: { center: [number, number]; zoom: number; bearing: number; pitch: number } | null) => {
    const map = mapRef.current;
    if (!camera || !map) return;
    const restoreCamera = () => {
      map.jumpTo(camera);
      setPinLayoutTick((t) => t + 1);
    };
    window.requestAnimationFrame(() => window.requestAnimationFrame(restoreCamera));
    window.setTimeout(restoreCamera, 350);
    window.setTimeout(restoreCamera, 900);
  };

  const snapshotCamera = () => {
    const map = mapRef.current;
    if (!map) return null;
    const center = map.getCenter();
    return { center: [center.lng, center.lat] as [number, number], zoom: map.getZoom(), bearing: map.getBearing(), pitch: map.getPitch() };
  };

  const closeSelected = () => {
    const camera = snapshotCamera();
    suppressStripRefitCountRef.current = 3;
    setSelected(null);
    setSelectedAttraction(null);
    clearWalkingRoute();
    if (mobileLayout && sheetStop !== "peek") snapSheet("peek");
    restoreCameraAfterLayout(camera);
  };

  /* ---------------- padding-aware fit, matching the design's fitPad()/fitStrip() ---------------- */
  const computePadding = () => {
    const wrap = mapWrapRef.current;
    const w = wrap?.clientWidth ?? 800, h = wrap?.clientHeight ?? 600;
    if (mobileLayout) {
      const topbarH = tab === "explore" ? (mobileTopRef.current?.offsetHeight ?? 108) : 0;
      const top = Math.min(topbarH + 16, Math.round(h * 0.32));
      const bottom = Math.min(h - 120, sheetHeightRef.current + 18);
      return { top, bottom, left: 18, right: 18 };
    }
    const right = Math.min(selected ? 430 : 215, Math.round(w * (selected ? 0.44 : 0.26)));
    const left = Math.min(44, Math.round(w * 0.06));
    const toolbarH = toolbarRef.current?.offsetHeight ?? 42;
    const chromeTop = toolbarH + 24;
    const top = Math.min(chromeTop, Math.round(h * 0.3));
    const bottom = Math.min(96, Math.round(h * 0.17));
    return { top, bottom, left, right };
  };

  const fitStrip = (animate: boolean) => {
    const map = mapRef.current;
    if (!map || !data) return;
    const bounds = new LngLatBounds(data.stripBounds[0], data.stripBounds[1]);
    const cam = map.cameraForBounds(bounds, { padding: computePadding() });
    if (!cam || cam.center === undefined) return;
    const zoom = Math.max(cam.zoom ?? MIN_STRIP_ZOOM, MIN_STRIP_ZOOM);
    if (animate) map.easeTo({ center: cam.center, zoom, duration: 700 });
    else map.jumpTo({ center: cam.center, zoom });
  };
  const flyCity = () => mapRef.current?.flyTo({ center: city.center, zoom: 11.2, duration: 900 });

  const setRouteSource = (coords: [number, number][]) => {
    const map = mapRef.current;
    const source = map?.getSource("walkingRoute") as maplibregl.GeoJSONSource | undefined;
    source?.setData(routeFeature(coords));
  };
  const fitRoute = (coords: [number, number][]) => {
    const map = mapRef.current;
    if (!map || coords.length < 2) return;
    const bounds = new LngLatBounds(coords[0], coords[0]);
    coords.forEach((coord) => bounds.extend(coord));
    map.fitBounds(bounds, { padding: computePadding(), duration: 850, maxZoom: 18.8 });
  };
  const clearWalkingRoute = () => {
    setWalkingRoute(null);
    setRouteSource([]);
  };
  const drawWalkingRoute = (location: UserLocation, target: Business, options: { fitMap?: boolean } = {}) => {
    if (!data) return;
    const start: [number, number] = [location.lon, location.lat];
    const finish: [number, number] = [target.lon, target.lat];
    const networkCoords = buildWalkingRoute(data, start, finish);
    const coords = networkCoords ?? [start, finish];
    const distanceM = coords.reduce((total, coord, index) => index === 0 ? total : total + metersBetween(coords[index - 1], coord), 0);
    setWalkingRoute({ target, coords, distanceM, network: Boolean(networkCoords) });
    setRouteSource(coords);
    if (options.fitMap !== false) fitRoute(coords);
    setHint(`${target.name} route is highlighted. Only your blue location dot and the destination logo stay on the map.`);
  };
  const showFullRoute = () => {
    if (walkingRoute?.coords.length) fitRoute(walkingRoute.coords);
  };
  const startLocationWatch = (onLocated?: (location: UserLocation) => void) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoError("Location is not available in this browser.");
      setHint("Your browser does not support live location. You can still open directions in Google Maps.");
      return;
    }
    setLocating(true);
    setGeoError(null);
    if (geoWatchRef.current !== null) navigator.geolocation.clearWatch(geoWatchRef.current);
    let handledInitialLocation = false;
    geoWatchRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const next = { lon: position.coords.longitude, lat: position.coords.latitude, accuracy: position.coords.accuracy };
        setUserLocation(next);
        setLocating(false);
        if (onLocated && !handledInitialLocation) {
          handledInitialLocation = true;
          onLocated(next);
        }
      },
      () => {
        setLocating(false);
        setGeoError("Location permission was denied or unavailable.");
        setHint("Location permission is needed to show the blue ‘you are here’ dot and in-map route.");
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 12000 }
    );
  };
  const showMeHowToGetHere = (business: Business) => {
    searchRef.current?.blur();
    setSelectedAttraction(null);
    setSelected(business);
    if (mobileLayout && sheetStop !== "peek") snapSheet("peek");
    if (userLocation) drawWalkingRoute(userLocation, business);
    else startLocationWatch((location) => drawWalkingRoute(location, business));
  };
  const locateMe = () => {
    const map = mapRef.current;
    if (userLocation && map) {
      map.flyTo({ center: [userLocation.lon, userLocation.lat], zoom: Math.max(map.getZoom(), 17.4), duration: 650 });
      return;
    }
    startLocationWatch((location) => mapRef.current?.flyTo({ center: [location.lon, location.lat], zoom: 17.4, duration: 650 }));
  };

  /* ---------------- mobile bottom sheet: peek/half/full stops, dragged imperatively ---------------- */
  const computeSheetStops = () => {
    const vh = window.innerHeight;
    const tabH = tabsRef.current?.offsetHeight || 60;
    const avail = Math.max(240, vh - tabH);
    return {
      peek: Math.min(150, Math.round(avail * 0.26)),
      half: Math.round(avail * 0.56),
      full: Math.round(avail - 56),
    };
  };
  const applySheetHeight = (px: number, animate: boolean) => {
    const el = sheetRef.current;
    if (!el) return;
    el.style.transition = animate ? "" : "none";
    el.style.height = `${px}px`;
    sheetHeightRef.current = px;
    if (locateRef.current) locateRef.current.style.bottom = `${px + 14}px`;
    window.setTimeout(() => {
      if (suppressStripRefitCountRef.current > 0) {
        suppressStripRefitCountRef.current -= 1;
        setPinLayoutTick((t) => t + 1);
        return;
      }
      fitStrip(true);
      setPinLayoutTick((t) => t + 1);
    }, animate ? 340 : 0);
  };
  const snapSheet = (stop: "peek" | "half" | "full") => {
    setSheetStop(stop);
    applySheetHeight(sheetStopsRef.current[stop], true);
  };
  const sheetDragRef = useRef<{ startY: number; startH: number; moved: number; pointerId: number } | null>(null);
  const onSheetGrabPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    /* Reaching for the sheet means you are done typing — get the keyboard out of the way. */
    searchRef.current?.blur();
    sheetDragRef.current = { startY: event.clientY, startH: sheetHeightRef.current, moved: 0, pointerId: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
    if (sheetRef.current) sheetRef.current.style.transition = "none";
  };
  const onSheetGrabPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = sheetDragRef.current;
    if (!drag) return;
    const dy = drag.startY - event.clientY;
    drag.moved = Math.max(drag.moved, Math.abs(dy));
    const stops = sheetStopsRef.current;
    const h = Math.max(stops.peek - 50, Math.min(stops.full + 30, drag.startH + dy));
    if (sheetRef.current) sheetRef.current.style.height = `${h}px`;
    if (locateRef.current) locateRef.current.style.bottom = `${h + 14}px`;
    sheetHeightRef.current = h;
  };
  const onSheetGrabPointerUp = () => {
    const drag = sheetDragRef.current;
    if (!drag) return;
    const stops = sheetStopsRef.current;
    const order: Array<"peek" | "half" | "full"> = ["peek", "half", "full"];
    if (drag.moved < 6) {
      const i = order.indexOf(sheetStop);
      snapSheet(order[(i + 1) % order.length]);
    } else {
      const nearest = order.reduce((a, b) => Math.abs(stops[b] - sheetHeightRef.current) < Math.abs(stops[a] - sheetHeightRef.current) ? b : a);
      snapSheet(nearest);
    }
    sheetDragRef.current = null;
  };

  /* The hunt opens as its own page rather than a dialog: onboarding is five steps
     and a photo, which a popover over the map cannot hold. */
  const huntHref = `/${city.slug}/hunt/start`;

  const flyToBusiness = (business: Business, options: { moveMap?: boolean } = {}) => {
    searchRef.current?.blur();
    const preserveCamera = options.moveMap === false;
    const map = mapRef.current;
    const camera = preserveCamera && map ? (() => {
      const center = map.getCenter();
      return { center: [center.lng, center.lat] as [number, number], zoom: map.getZoom(), bearing: map.getBearing(), pitch: map.getPitch() };
    })() : null;
    if (preserveCamera) suppressStripRefitCountRef.current = 3;
    setSelectedAttraction(null);
    clearWalkingRoute();
    setSelected(business);
    const slug = normalize(business.name).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    window.history.replaceState(null, "", `?biz=${slug}`);
    if (options.moveMap !== false) mapRef.current?.panTo([business.lon, business.lat], { duration: 500 });
    if (mobileLayout && sheetStop === "peek") snapSheet("half");
    if (camera && map) restoreCameraAfterLayout(camera);
  };
  const goFeatured = (attraction: Attraction) => {
    setSelected(null);
    setSelectedAttraction(attraction);
    setHint(null);
    mapRef.current?.flyTo({ center: [attraction.lon, attraction.lat], zoom: 15.5, duration: 700 });
  };
  const chooseNeighbourhood = (id: string) => {
    const n = data?.neighbourhoods.find((item) => item.id === id);
    if (!n || !mapRef.current) return;
    if (n.enabled) {
      mapRef.current.fitBounds(new LngLatBounds(n.bounds[0], n.bounds[1]), { padding: 80, duration: 900 });
      setHint(`${n.name} is ready to stroll.`);
    } else {
      mapRef.current.flyTo({ center: n.center, zoom: 13, duration: 900 });
      setHint(`${n.name} will be added to stroll.city after Inglewood.`);
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setSelected(null); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  /* ----------------
     On-screen keyboard: without this the keyboard covers the sheet, so you type a query and cannot see a single result.
     visualViewport shrinks when the keyboard opens; we lift the sheet by that much and drop the tab bar out of the way.
     ---------------- */
  useEffect(() => {
    if (!mobileLayout || typeof window === "undefined") return;
    const vv = window.visualViewport;
    if (!vv) return;
    const sync = () => {
      const covered = window.innerHeight - vv.height - vv.offsetTop;
      /* Small deltas are just the URL bar collapsing, not a keyboard. */
      setKeyboardInset(covered > 120 ? Math.round(covered) : 0);
      setViewportHeight(Math.round(vv.height));
    };
    sync();
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    return () => { vv.removeEventListener("resize", sync); vv.removeEventListener("scroll", sync); };
  }, [mobileLayout]);

  /* Derived, not stored, so a stale inset can never survive a switch back to the desktop layout. */
  const keyboardLift = mobileLayout ? keyboardInset : 0;

  /* Typing should reveal what you matched without making you drag the sheet up first. */
  useEffect(() => {
    if (!mobileLayout || !query.trim()) return;
    if (sheetStop === "peek") snapSheet("half");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, mobileLayout]);

  /* ---------------- mobile sheet: (re)compute stops on layout changes, keep the sheet's real height in sync ---------------- */
  useEffect(() => {
    if (!mobileLayout) return;
    const sync = () => {
      sheetStopsRef.current = computeSheetStops();
      applySheetHeight(sheetStopsRef.current[sheetStop], false);
    };
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobileLayout, data]);

  /* ---------------- responsive stage sync (ResizeObserver, mirrors syncStage()) ---------------- */
  useEffect(() => {
    const stageEl = stageRef.current, wrapEl = mapWrapRef.current;
    if (!stageEl || !wrapEl) return;
    const sync = () => {
      const w = stageEl.clientWidth;
      const mapH = wrapEl.clientHeight;
      setStageTight(w < 720);
      setStageSnug(w < 520);
      setStageShort(mapH < 420);
      if (mapH >= 420) setLayersOpen(false);
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(stageEl);
    ro.observe(wrapEl);
    return () => ro.disconnect();
  }, [data]);

  /* ---------------- map init ---------------- */
  useEffect(() => {
    if (!data || !mapNode.current || mapRef.current) return;

    let cancelled = false;
    let cleanup = () => {};

    const initMap = async () => {
      const style = await buildCrispNoLabelMapStyle(data);
      if (cancelled || !mapNode.current || mapRef.current) return;

      const map = new maplibregl.Map({
        container: mapNode.current,
        style,
        center: data.center,
        zoom: 16.25,
        pitch: 0,
        minZoom: 10,
        maxZoom: 21,
        attributionControl: false,
      });
      mapRef.current = map;
      map.addControl(new maplibregl.AttributionControl({ customAttribution: "Businesses, trees, bikeways & pathways © City of Calgary Open Data" }), "bottom-left");

      map.on("load", () => {
        map.addSource("trees", { type: "geojson", data: { type: "FeatureCollection", features: data.trees.map((c, i) => ({ type: "Feature", properties: { i }, geometry: { type: "Point", coordinates: c } })) } });
        map.addLayer({ id: "trees", type: "circle", source: "trees", minzoom: 14.5, paint: { "circle-color": "#57C07A", "circle-radius": ["interpolate", ["linear"], ["zoom"], 12, 0.6, 16, 2.2, 18, 4], "circle-opacity": 0.4, "circle-blur": 0.35 } });
        fitStrip(false);
      });

      map.on("moveend", () => setPinLayoutTick((t) => t + 1));
      map.on("zoomend", () => setPinLayoutTick((t) => t + 1));
      const onResize = () => { map.resize(); setPinLayoutTick((t) => t + 1); };
      window.addEventListener("resize", onResize);

      cleanup = () => {
        window.removeEventListener("resize", onResize);
        pinMarkersRef.current.forEach((m) => m.remove());
        eventMarkersRef.current.forEach((m) => m.remove());
        featMarkersRef.current.forEach(({ marker }) => marker.remove());
        userMarkerRef.current?.remove();
        if (geoWatchRef.current !== null && typeof navigator !== "undefined" && navigator.geolocation) navigator.geolocation.clearWatch(geoWatchRef.current);
        pinMarkersRef.current = [];
        eventMarkersRef.current = [];
        featMarkersRef.current = [];
        userMarkerRef.current = null;
        geoWatchRef.current = null;
        map.remove();
        mapRef.current = null;
      };
    };

    initMap().catch((error: unknown) => {
      console.error("Failed to initialise Stroll map", error);
    });

    return () => {
      cancelled = true;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  /* re-fit when the map-wrap resizes (panel collapse, drawer open) while still on "strip" extent */
  useEffect(() => {
    const wrap = mapWrapRef.current;
    if (!wrap) return;
    const onResize = () => {
      const key = `${wrap.clientWidth}x${wrap.clientHeight}`;
      if (key === lastFitKeyRef.current) return;
      lastFitKeyRef.current = key;
      if (extent === "strip" && !selected) {
        if (suppressStripRefitCountRef.current > 0) {
          suppressStripRefitCountRef.current -= 1;
        } else {
          fitStrip(false);
        }
      }
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(wrap);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extent, selected, data]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const setVisibility = (layer: string, visible: boolean) => {
      if (map.getLayer(layer)) map.setLayoutProperty(layer, "visibility", visible ? "visible" : "none");
    };
    setVisibility("bike-line", showBike);
    setVisibility("pathways", showPathways);
    setVisibility("stripband", showStrip);
    setVisibility("trees", showTrees);
  }, [showBike, showPathways, showStrip, showTrees, data]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userLocation) return;
    if (!userMarkerRef.current) {
      const el = document.createElement("div");
      el.className = styles.youAreHere;
      el.innerHTML = `<span></span>`;
      userMarkerRef.current = new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat([userLocation.lon, userLocation.lat]).addTo(map);
    } else {
      userMarkerRef.current.setLngLat([userLocation.lon, userLocation.lat]);
    }
  }, [userLocation]);

  useEffect(() => {
    if (!userLocation || !walkingRoute?.target || !data) return;
    const start: [number, number] = [userLocation.lon, userLocation.lat];
    const finish: [number, number] = [walkingRoute.target.lon, walkingRoute.target.lat];
    setRouteSource(buildWalkingRoute(data, start, finish) ?? [start, finish]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation?.lon, userLocation?.lat]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    eventMarkersRef.current.forEach((m) => m.remove());
    eventMarkersRef.current = [];
    if (tab !== "events" || !showEvents || walkingRoute) return;
    eventMarkersRef.current = events.map((event) => {
      const el = document.createElement("button");
      el.className = styles.pin;
      el.innerHTML = `<span class="${styles.glyph}" style="background:${city.theme.primary}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M8 3.5v3M16 3.5v3M3.5 10h17"/></svg></span><span class="${styles.label}">${event.name}</span>`;
      el.title = event.name;
      el.addEventListener("click", () => { mapRef.current?.flyTo({ center: [event.lon, event.lat], zoom: 16.4, duration: 650 }); setHint(`${event.name} · ${event.venue}`); });
      return new maplibregl.Marker({ element: el, anchor: "bottom" }).setLngLat([event.lon, event.lat]).addTo(map);
    });
  }, [events, tab, showEvents, city.theme.primary, walkingRoute]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    featMarkersRef.current.forEach(({ marker }) => marker.remove());
    featMarkersRef.current = [];
    if (walkingRoute) return;
    featMarkersRef.current = attractions.map((attraction) => {
      const el = document.createElement("button");
      el.className = styles.pin;
      el.innerHTML = `<span class="${styles.glyph}" style="background:${city.theme.green}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 21 8 3 8"/></svg></span><span class="${styles.label}">${attraction.name}</span>`;
      el.title = attraction.name;
      el.addEventListener("click", () => goFeatured(attraction));
      return { marker: new maplibregl.Marker({ element: el, anchor: "bottom" }).setLngLat([attraction.lon, attraction.lat]).addTo(map), attraction };
    });
  }, [attractions, city.theme.green, walkingRoute]);

  useEffect(() => {
    featMarkersRef.current.forEach(({ marker }) => { marker.getElement().style.display = showBeyond ? "" : "none"; });
  }, [showBeyond]);

  /* ---------------- business pins: collision-avoided placement, seeded with floating-chrome rects ---------------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !data) return;
    pinMarkersRef.current.forEach((m) => m.remove());
    pinMarkersRef.current = [];
    pinElsRef.current.clear();

    const wrap = mapWrapRef.current;
    const pane = wrap?.getBoundingClientRect();
    type Slot = { x1: number; x2: number; y1: number; y2: number; cx: number; cy: number; members: Business[]; mode: PinMode; pinned: boolean; chrome?: boolean; offset?: [number, number] };
    const slots: Slot[] = [];
    if (pane) {
      const chromeEls = wrap!.querySelectorAll(`.${styles.cardUi}, .${styles.glass}, .${styles.stat}, .${styles.drawerOpen}, .${styles.edgeTab}, .${styles.btnPrimary}, .${styles.navigationHud}, .${styles.mTop}, .${styles.mSheet}, .${styles.mLocate}`);
      chromeEls.forEach((n) => {
        const el = n as HTMLElement;
        if (!el.offsetWidth || getComputedStyle(el).display === "none") return;
        const r = el.getBoundingClientRect();
        slots.push({ x1: r.left - pane.left, x2: r.right - pane.left, y1: r.top - pane.top, y2: r.bottom - pane.top, cx: 0, cy: 0, members: [], mode: "label", pinned: true, chrome: true });
      });
    }

    const items = walkingRoute ? [walkingRoute.target] : visibleBusinesses;
    const zoom = map.getZoom();
    const dotZoomMax = 16.2;
    const logoZoomMin = 15.95;
    const labelZoomMin = mobileLayout ? 17.15 : 16.65;
    const labelDensityLimit = mobileLayout ? 18 : 28;
    // Keep the pin presentation stable while panning. Using the current map bounds here made
    // labels appear/disappear at the same zoom as businesses crossed the viewport edge, which
    // shuffled nearby logos even though the user had only dragged the map.
    const filteredBusinessCount = items.length;
    const forceLabels = showNames && Boolean(walkingRoute || filteredBusinessCount <= labelDensityLimit || zoom >= labelZoomMin);
    const forceLogos = forceLabels || zoom >= logoZoomMin || filteredBusinessCount <= 64;
    const birdseyeDotsOnly = !forceLogos || (zoom < dotZoomMax && filteredBusinessCount > 64 && !walkingRoute && !selected);
    const order = [...items].sort((a, b) => (b.id === selected?.id ? 1 : 0) - (a.id === selected?.id ? 1 : 0));
    const overlap = (a: { x1: number; x2: number; y1: number; y2: number }, b: { x1: number; x2: number; y1: number; y2: number }) => {
      const w = Math.max(0, Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1));
      const h = Math.max(0, Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1));
      return { w, h, area: w * h };
    };
    // Keep markers geographically honest, but don't let visible buttons stack over each other.
    // Logos may touch/overlap slightly; name labels need more breathing room so every place stays readable.
    const remainsReadable = (r: { x1: number; x2: number; y1: number; y2: number }, mode: PinMode) => !slots.some((s) => {
      if (s.chrome) return false;
      const hit = overlap(r, s);
      if (!hit.area) return false;
      if (mode === "label" || s.mode === "label") return hit.h > 4 && hit.w > 4;
      const rArea = Math.max(1, (r.x2 - r.x1) * (r.y2 - r.y1));
      const sArea = Math.max(1, (s.x2 - s.x1) * (s.y2 - s.y1));
      const coveredShare = hit.area / Math.min(rArea, sArea);
      const sharedHeight = hit.h / Math.max(1, Math.min(r.y2 - r.y1, s.y2 - s.y1));
      const sharedWidth = hit.w / Math.max(1, Math.min(r.x2 - r.x1, s.x2 - s.x1));
      return coveredShare >= 0.18 || (sharedHeight >= 0.45 && sharedWidth >= 0.25);
    });
    const rectFor = (cp: { x: number; y: number }, w: number, h: number, offset: [number, number] = [0, 0]) => {
      const x = cp.x + offset[0];
      const y = cp.y + offset[1];
      return { x1: x - w / 2, x2: x + w / 2, y1: y - h / 2, y2: y + h / 2, cx: cp.x, cy: cp.y };
    };
    const offsetCandidates = (max: number): [number, number][] => {
      if (max <= 0) return [[0, 0]];
      const offsets: [number, number][] = [[0, 0]];
      const seen = new Set(["0,0"]);
      const add = (x: number, y: number) => {
        const key = `${x},${y}`;
        if (!seen.has(key)) { seen.add(key); offsets.push([x, y]); }
      };
      for (let r = 8; r <= max; r += 8) {
        const diagonals = Math.round(r * 0.7);
        add(r, 0); add(-r, 0); add(0, r); add(0, -r);
        add(diagonals, diagonals); add(-diagonals, diagonals); add(diagonals, -diagonals); add(-diagonals, -diagonals);
        add(r, Math.round(r / 2)); add(-r, Math.round(r / 2)); add(r, -Math.round(r / 2)); add(-r, -Math.round(r / 2));
        add(Math.round(r / 2), r); add(-Math.round(r / 2), r); add(Math.round(r / 2), -r); add(-Math.round(r / 2), -r);
      }
      return offsets;
    };
    const measureCanvas = document.createElement("canvas").getContext("2d");
    const chipWidth = (name: string, mode: PinMode) => {
      if (mode === "dot") return 9;
      if (mode === "logo") return 32;
      if (measureCanvas) measureCanvas.font = "400 12.5px Outfit, sans-serif";
      const w = measureCanvas ? measureCanvas.measureText(name).width : name.length * 7;
      return 66 + Math.min(140, w);
    };
    const chipHeight = (mode: PinMode) => mode === "dot" ? 9 : mode === "logo" ? 32 : 38;
    const maxSkewFor = (mode: PinMode) => {
      if (walkingRoute) return 0;
      if (mode === "dot") return 16;
      if (mode === "logo") return 44;
      return 96;
    };

    order.forEach((biz) => {
      const cp = map.project([biz.lon, biz.lat]);
      const isSel = biz.id === selected?.id;
      const desiredMode: PinMode = isSel || forceLabels ? "label" : birdseyeDotsOnly ? "dot" : "logo";
      const fallbackModes: PinMode[] = [desiredMode];
      let placed: { mode: PinMode; offset: [number, number]; rect: ReturnType<typeof rectFor> } | null = null;
      for (const mode of fallbackModes) {
        const w = chipWidth(biz.name, mode);
        const h = chipHeight(mode);
        const candidates = offsetCandidates(maxSkewFor(mode));
        const offset = candidates.find((candidate) => remainsReadable(rectFor(cp, w, h, candidate), mode));
        if (offset) {
          placed = { mode, offset, rect: rectFor(cp, w, h, offset) };
          break;
        }
      }
      if (!placed) {
        const mode = desiredMode;
        const offset: [number, number] = [0, 0];
        placed = { mode, offset, rect: rectFor(cp, chipWidth(biz.name, mode), chipHeight(mode), offset) };
      }
      slots.push({ ...placed.rect, members: [biz], mode: placed.mode, pinned: isSel, offset: placed.offset });
    });

    slots.forEach((s) => {
      if (s.chrome || !s.members.length) return;
      if (s.pinned || s.members.length === 1) {
        const biz = s.members[0];
        const el = document.createElement("button");
        el.className = styles.markerHit;
        el.dataset.pinMode = s.mode;
        el.innerHTML = pinMarkup(styles, biz, categoryColor(city, biz.category), s.mode, biz.id === selected?.id);
        el.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          flyToBusiness(biz, { moveMap: false });
        });
        el.addEventListener("mouseenter", () => {
          if (mobileLayout || s.mode === "dot") return;
          const pinEl = el.querySelector(`.${styles.pin}`);
          if (pinEl?.classList.contains(styles.compact)) { pinEl.classList.remove(styles.compact); (el as HTMLElement).dataset.wasCompact = "true"; }
          rowElsRef.current.get(biz.id)?.classList.add(styles.rowActive);
        });
        el.addEventListener("mouseleave", () => {
          const pinEl = el.querySelector(`.${styles.pin}`);
          if (el.dataset.wasCompact === "true") pinEl?.classList.add(styles.compact);
          if (biz.id !== selected?.id) rowElsRef.current.get(biz.id)?.classList.remove(styles.rowActive);
        });
        const marker = new maplibregl.Marker({ element: el, anchor: "center", offset: s.offset ?? [0, 0] }).setLngLat([biz.lon, biz.lat]).addTo(map);
        pinMarkersRef.current.push(marker);
        pinElsRef.current.set(biz.id, el);
      }
    });
    // Re-place marker offsets only on deliberate layout inputs and MapLibre moveend/zoomend.
    // Keeping this off generic renders prevents mobile pan/URL-bar changes from making logos bounce mid-drag.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, data, mobileLayout, pinLayoutTick, selected, showNames, visibleBusinesses, walkingRoute]);

  useEffect(() => {
    if (!data || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const hood = params.get("hood");
    const biz = params.get("biz");
    const timer = window.setTimeout(() => {
      if (hood) chooseNeighbourhood(hood);
      if (biz) {
        const match = data.businesses.find((business) => business.id === biz || normalize(business.name).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") === biz);
        if (match) flyToBusiness(match);
      }
    }, 650);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const enabledNeighbourhood = data?.neighbourhoods.find((n) => n.enabled);

  /* shared between the desktop drawer and the mobile bottom sheet's detail state */
  const renderDetail = (biz: Business) => (
    <>
      <button className={styles.heroClose} onClick={closeSelected}>Back to the street</button>
      <div className={styles.hero}>
        <img src={biz.photo} alt="" />
        <div className={styles.glyphLg} style={{ background: categoryColor(city, biz.category), color: onCategory(city, biz.category) }}>
          {biz.logo_url ? <img src={biz.logo_url} alt="" /> : biz.mono}
        </div>
      </div>
      <div className={styles.dBody}>
        <div className={styles.dActions}>
          {walkingRoute?.target.id !== biz.id && (
            <button className={`${styles.btn} ${styles.btnPrimary}`} style={{ width: "100%", justifyContent: "center" }} onClick={() => showMeHowToGetHere(biz)}>
              <Navigation size={15} /> {locating ? "Finding you…" : "Show me how to get here"}
            </button>
          )}
          {biz.website && (
            <button className={`${styles.btn} ${styles.btnGhost}`} title="Website" onClick={() => window.open(biz.website!, "_blank", "noopener,noreferrer")}>
              <Globe size={16} />
            </button>
          )}
        </div>
        {geoError && <div className={styles.routeNote}>{geoError}</div>}
        <p className={styles.blurb}>{biz.blurb}</p>
        <div className={styles.kv}>
          <div className={styles.kvRow}><span className={styles.k}>Address</span><span className={styles.v}>{biz.address}, Calgary AB</span></div>
          <div className={styles.kvRow}><span className={styles.k}>Hours</span><span className={styles.v}>{biz.hours}</span></div>
        </div>
      </div>
    </>
  );

  const renderAttractionDetail = (attraction: Attraction) => (
    <>
      <div className={styles.hero}>
        {attraction.photo_url ? <img src={attraction.photo_url} alt="" /> : null}
        <button className={styles.heroClose} onClick={closeSelected}>Back to the street</button>
        <div className={styles.glyphLg} style={{ background: city.theme.green }}><Landmark size={24} /></div>
      </div>
      <div className={styles.dBody}>
        <div>
          <div className={styles.dTitle}>{attraction.name}</div>
          <div className={styles.dSub}><span className={styles.pill}>Featured</span><span>Landmark</span></div>
        </div>
        <p className={styles.blurb}>{attraction.blurb}</p>
        <div className={styles.kv}>
          <div className={styles.kvRow}><span className={styles.k}>Place</span><span className={styles.v}>{attraction.name}</span></div>
          <div className={styles.kvRow}><span className={styles.k}>Area</span><span className={styles.v}>Calgary AB</span></div>
        </div>
      </div>
    </>
  );

  /* shared between the desktop results list and the mobile sheet's list state */
  const renderBusinessRow = (biz: Business) => {
    const open = isOpenNow(biz.hours, nowMinutes);
    return (
      <button
        key={biz.id}
        ref={(el) => { if (el) rowElsRef.current.set(biz.id, el); else rowElsRef.current.delete(biz.id); }}
        className={`${styles.row} ${selected?.id === biz.id ? styles.rowActive : ""}`}
        onClick={() => flyToBusiness(biz)}
        onMouseEnter={() => pinElsRef.current.get(biz.id)?.querySelector(`.${styles.pin}`)?.classList.add(styles.pinActive)}
        onMouseLeave={() => { if (biz.id !== selected?.id) pinElsRef.current.get(biz.id)?.querySelector(`.${styles.pin}`)?.classList.remove(styles.pinActive); }}
      >
        <div className={styles.thumb}><img src={biz.photo} alt="" /></div>
        <div className={styles.rowBody}>
          <div className={styles.rowName}>{biz.name}</div>
          <div className={styles.rowMeta}>
            <span className={styles.catLabel} style={{ color: categoryInk(city, biz.category) }}><span className={styles.dot} style={{ background: categoryColor(city, biz.category) }} />{CAT_LABEL[biz.category]}</span>
            {biz.claim_status === "claimed" && <><span className={styles.dotsep} /><span className={styles.claimedBadge}>Claimed</span></>}
          </div>
          <div className={styles.rowMeta}>
            {open === true && <span className={styles.openBadge}>Open now</span>}
            {open === false && <span className={styles.closedBadge}>Closed</span>}
            <span className={styles.dotsep} /><span style={{ color: "var(--ink-3)" }}>{biz.address}</span>
          </div>
          <div className={styles.rowTags}>{biz.highlights.slice(0, 3).map(([, text]) => <span key={text} className={styles.tag}>{text}</span>)}</div>
        </div>
      </button>
    );
  };

  if (city.status !== "live") {
    return (
      <main className={styles.comingSoon}>
        <img src="/brand/stroll-logo.png" alt="Stroll City" />
        <h1>{city.name} is not open yet.</h1>
        <p>Choose Calgary to use the live stroll.city map.</p>
        <Link href="/">Back to city picker</Link>
      </main>
    );
  }

  return (
    <main className={styles.shell}>
      {!mobileLayout && (
      <nav className={styles.rail}>
        <img className={styles.railLogo} src="/brand/stroll-mark.png" alt="Stroll City" />
        <button className={`${styles.railBtn} ${tab === "explore" ? styles.railOn : ""}`} title="Explore" onClick={() => { setTab("explore"); backToBrowse(); }}><IconExplore /></button>
        <Link className={styles.railBtn} title="Start a scavenger hunt" href={huntHref}><Route size={18} /></Link>
        <Link className={`${styles.railBtn} ${styles.railGhost}`} title="Add a place" href="/portal"><IconAdd /></Link>
        <button className={`${styles.railBtn} ${tab === "events" ? styles.railOn : ""}`} title="Events" onClick={() => setTab("events")}><IconEvents /></button>
        <button className={styles.railBtn} title="Saved" onClick={() => setHint("Save places to a walking list from the profile panel.")}><IconSaved /></button>
        <button className={`${styles.railBtn} ${styles.railSpacer}`} title="Open data note" onClick={() => setHint("Geometry and licences come from City of Calgary open data.")}><IconOpenData /></button>
      </nav>
      )}

      {!mobileLayout && (
      <aside className={`${styles.panel} ${panelCollapsed ? styles.panelCollapsed : ""} ${isResultsView ? styles.results : ""}`}>
        <div className={styles.panelInner}>
          <div className={styles.panelHead}>
            <div className={styles.brand}>
              <span>
                <div className={styles.brandName}>STROLL <span>CITY</span></div>
                <div className={styles.brandSub}>{city.theme.brandTag}</div>
              </span>
            </div>
            <div className={styles.tabs} role="tablist">
              <button role="tab" aria-selected={tab === "explore"} className={tab === "explore" ? styles.tabActive : ""} onClick={() => setTab("explore")}>Explore <span className={styles.count}>{data?.businesses.length ?? 0}</span></button>
              <button role="tab" aria-selected={tab === "events"} className={tab === "events" ? styles.tabActive : ""} onClick={() => setTab("events")}>Events <span className={styles.count}>{events.length}</span></button>
              <button role="tab" aria-selected={false} disabled title="Saved places" style={{ opacity: .55, cursor: "default" }}>Saved</button>
            </div>
          </div>

          {tab === "explore" && !isResultsView && (
            <div className={styles.browse}>
              <div className={styles.insights}>
                <div className={styles.icard}>
                  <div className={styles.icardHead}>
                    <div>
                      <h3>{enabledNeighbourhood ? areaOnly(enabledNeighbourhood.name) : "Inglewood"}</h3>
                      <div className={styles.icardAddr}>9 Ave SE · Calgary AB · Est. 1875</div>
                    </div>
                    <button className={styles.fav} aria-pressed={neighbourhoodSaved} title="Saved neighbourhood" onClick={() => setNeighbourhoodSaved((v) => !v)}>
                      <IconHeart filled={neighbourhoodSaved} />
                    </button>
                  </div>
                  <div className={styles.metrics}>
                    <div className={styles.metric}>
                      <span className={styles.mi}><CatIcon d="M4 8h16l-1 12H5L4 8Z M8 8V6a4 4 0 0 1 8 0v2" size={14} /></span>
                      <span><span className={styles.mk}>Businesses</span><span className={`${styles.mv} ${styles.num}`}>{data?.businesses.length ?? 0}</span></span>
                    </div>
                    <div className={styles.metric}>
                      <span className={styles.mi}><CatIcon d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0 M12 7.5V12l3 2" size={14} /></span>
                      <span><span className={styles.mk}>Open now</span><span className={`${styles.mv} ${styles.num}`}>{openNowCount}</span></span>
                    </div>
                    <div className={styles.metric}>
                      <span className={styles.mi}><CatIcon d="M12 2c-4 4-4 10 0 20 4-10 4-16 0-20Z" size={14} /></span>
                      <span><span className={styles.mk}>Trees</span><span className={`${styles.mv} ${styles.num}`}>{data?.trees.length ?? 0}</span></span>
                    </div>
                  </div>
                </div>

                {/* The hunt is the headline feature, so it sits under the area card
                    rather than waiting behind a button nobody scrolls to. */}
                <Link className={styles.huntBanner} href={huntHref}>
                  <span className={styles.huntBannerIc}><Route size={19} /></span>
                  <span className={styles.huntBannerBody}>
                    <span className={styles.huntBannerTitle}>
                      Scavenger hunt
                      <span className={styles.huntBannerTag}>Free</span>
                    </span>
                    <span className={styles.huntBannerMeta}>Four clues, four doors, one walk down the strip.</span>
                  </span>
                  <ChevronRight size={16} color="var(--ink-3)" />
                </Link>
              </div>

              <div className={styles.catControls}>
                <button className={styles.catControl} onClick={() => setCategories(new Set(allCategories))}>All</button>
                <button className={styles.catControl} onClick={() => setCategories(new Set())}>None</button>
              </div>
              <div className={styles.catlist}>
                {allCategories.map((key) => {
                  const on = activeCategories.has(key);
                  return (
                  <button key={key} className={`${styles.catcard} ${on ? styles.catcardOn : styles.catcardOff}`} onClick={() => toggleActiveCategory(key)} aria-pressed={on}>
                    <span className={styles.catCheck} style={on ? { background: categoryColor(city, key) } : undefined}>{on ? "✓" : ""}</span>
                    <span className={styles.ccTile} style={{ background: wash(categoryColor(city, key), 38, 16), color: categoryInk(city, key) }}>
                      <CatIcon d={CAT_ICON[key]} size={20} color={categoryInk(city, key)} />
                    </span>
                    <span className={styles.ccBody}>
                      <span className={styles.ccName}>{CAT_LABEL[key]}</span>
                      <span className={styles.ccMeta}>{CAT_BLURB[key]}</span>
                    </span>
                    <span className={`${styles.ccN} ${styles.num}`}>{counts[key] || 0}</span>
                  </button>
                );})}
                <div className={styles.catSep}><span className={styles.lbl}>Map layers</span><span className={styles.catSepRule} /></div>
                <button className={`${styles.catcard} ${showEvents ? styles.catcardOn : styles.catcardOff}`} onClick={() => setShowEvents((v) => !v)} aria-pressed={showEvents}>
                  <span className={styles.catCheck} style={showEvents ? { background: city.theme.primary } : undefined}>{showEvents ? "✓" : ""}</span>
                  <span className={styles.ccTile}><CalendarDays size={20} /></span>
                  <span className={styles.ccBody}><span className={styles.ccName}>Events</span><span className={styles.ccMeta}>Show event markers on the map</span></span>
                  <span className={`${styles.ccN} ${styles.num}`}>{events.length}</span>
                </button>
                <button className={`${styles.catcard} ${showOpenNow ? styles.catcardOn : styles.catcardOff}`} onClick={() => setShowOpenNow((v) => !v)} aria-pressed={showOpenNow}>
                  <span className={styles.catCheck} style={showOpenNow ? { background: city.theme.green } : undefined}>{showOpenNow ? "✓" : ""}</span>
                  <span className={styles.ccTile}><CatIcon d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0 M12 7.5V12l3 2" size={20} /></span>
                  <span className={styles.ccBody}><span className={styles.ccName}>Open now</span><span className={styles.ccMeta}>Include places currently marked open</span></span>
                  <span className={`${styles.ccN} ${styles.num}`}>{openNowCount}</span>
                </button>
                <button className={`${styles.catcard} ${showTrees ? styles.catcardOn : styles.catcardOff}`} onClick={() => setShowTrees((v) => !v)} aria-pressed={showTrees}>
                  <span className={styles.catCheck} style={showTrees ? { background: "#2E7D50" } : undefined}>{showTrees ? "✓" : ""}</span>
                  <span className={styles.ccTile}><CatIcon d="M12 2c-4 4-4 10 0 20 4-10 4-16 0-20Z" size={20} /></span>
                  <span className={styles.ccBody}><span className={styles.ccName}>Trees</span><span className={styles.ccMeta}>Show the street canopy layer</span></span>
                  <span className={`${styles.ccN} ${styles.num}`}>{data?.trees.length ?? 0}</span>
                </button>
                <div className={styles.catSep}><span className={styles.lbl}>Featured places</span><span className={styles.catSepRule} /></div>
                {attractions.map((attraction) => (
                  <button key={attraction.id} className={styles.feat} onClick={() => goFeatured(attraction)}>
                    <span className={styles.featTile}><Landmark size={19} /></span>
                    <span className={styles.featBody}>
                      <span className={styles.featName}>{attraction.name}</span>
                      <span className={styles.featDesc}>{attraction.blurb}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === "explore" && isResultsView && (
            <>
              <div className={styles.resultsHead}>
                <button className={styles.back} onClick={backToBrowse} title="All categories"><ChevronLeft size={16} /></button>
                {browseCategory ? (
                  <>
                    <span className={styles.rhTile} style={{ background: wash(categoryColor(city, browseCategory), 38, 16) }}><CatIcon d={CAT_ICON[browseCategory]} size={16} color={categoryInk(city, browseCategory)} /></span>
                    <span className={styles.rhText}><b>{CAT_LABEL[browseCategory]}</b><span>{visibleBusinesses.length} places</span></span>
                  </>
                ) : (
                  <>
                    <span className={styles.rhTile}><Search size={15} color="var(--ink-2)" /></span>
                    <span className={styles.rhText}><b>Search results</b><span>{visibleBusinesses.length} places</span></span>
                  </>
                )}
                <button className={styles.linkBtn} onClick={() => setSortMode((m) => (m === "az" ? "claimed" : "az"))}>{sortMode === "az" ? "A–Z" : "Claimed first"} <ChevronDown size={12} /></button>
              </div>
              <div className={styles.list}>
                {visibleBusinesses.length === 0 && <div className={styles.empty}><b>Nothing here yet</b>Go back to the categories, or clear the search.</div>}
                {visibleBusinesses.map((biz) => renderBusinessRow(biz))}
              </div>
            </>
          )}

          {tab === "events" && (
            <div className={styles.list} style={{ padding: "12px 16px" }}>
              {events.map((event) => (
                <button key={event.id} className={styles.row} onClick={() => mapRef.current?.flyTo({ center: [event.lon, event.lat], zoom: 16.4, duration: 650 })}>
                  <div className={styles.thumb} style={{ display: "grid", placeItems: "center", color: "var(--ink-3)" }}><CalendarDays size={22} /></div>
                  <div className={styles.rowBody}>
                    <div className={styles.rowName}>{event.name}</div>
                    <div className={styles.rowMeta}>{formatDate(event.starts_at)} · {event.venue}</div>
                    <div className={styles.rowMeta} style={{ color: "var(--ink-3)" }}>{event.source}</div>
                  </div>
                </button>
              ))}
            </div>
          )}


        </div>
      </aside>
      )}

      <div ref={stageRef} className={`${styles.stage} ${stageTight ? styles.tight : ""} ${stageSnug ? styles.snug : ""} ${stageShort ? styles.short : ""} ${mobileLayout ? styles.mStage : ""}`}>
        <div ref={mapWrapRef} className={styles.mapWrap}>
          <div ref={mapNode} className={styles.map} />

          {walkingRoute && (
            <div className={styles.navigationHud}>
              <div className={styles.navigationStatus} aria-label="Navigation mode is active">
                <span className={styles.navigationStatusDot} />
                <span>Navigation mode</span>
              </div>
              <div className={styles.navigationHudActions}>
                <button onClick={showFullRoute}>Show full route</button>
                <button onClick={clearWalkingRoute}>Exit navigation mode</button>
              </div>
            </div>
          )}

          {!mobileLayout && (
          <>
          <div ref={toolbarRef} className={styles.toolbar}>
            <label className={`${styles.field} ${styles.search} ${styles.glass}`}>
              <Search size={15} color="var(--ink-3)" />
              <input aria-label="Search businesses" placeholder="Search cafés, shops, galleries…" value={query} onChange={(e) => { setQuery(e.target.value); setBrowseCategory(null); }} />
            </label>
            <label className={`${styles.field} ${styles.picker} ${styles.glass}`}>
              <Navigation size={15} />
              {enabledNeighbourhood ? streetOnly(enabledNeighbourhood.name) : "9 Ave SE"}
              <ChevronDown size={13} color="var(--ink-3)" />
              <select className={styles.pickerSelect} aria-label="Neighbourhood selector" onChange={(e) => chooseNeighbourhood(e.target.value)} defaultValue={city.defaultHood}>
                {data?.neighbourhoods.map((n) => <option key={n.id} value={n.id}>{n.name}{n.enabled ? "" : " · soon"}</option>)}
              </select>
            </label>
            <div className={`${styles.seg} ${styles.glass}`}>
              <button className={extent === "strip" ? styles.segActive : ""} onClick={() => { setExtent("strip"); fitStrip(true); }}>Fit to strip</button>
              <button className={extent === "city" ? styles.segActive : ""} onClick={() => { setExtent("city"); flyCity(); }}>Whole city</button>
            </div>
            <span className={styles.spacer} />
            <Link className={`${styles.btn} ${styles.huntCta}`} href={huntHref}>
              <Route size={15} />
              <span className={styles.ctaFull}>Start a scavenger hunt</span><span className={styles.ctaShort}>Hunt</span>
            </Link>
            <Link className={`${styles.btn} ${styles.btnClaim}`} href="/portal">
              <span className={styles.ctaFull}>Claim your business</span><span className={styles.ctaShort}>Claim</span>
              <ChevronRight size={15} />
            </Link>
          </div>

          <div className={`${styles.mapUi} ${styles.mapUiTr} ${layersOpen ? styles.mapUiOpen : ""}`}>
            <button className={`${styles.cardUi} ${styles.iconBtn} ${styles.layersToggle}`} title="Map layers" onClick={() => setLayersOpen((v) => !v)}><Layers size={17} /></button>
            <div className={`${styles.cardUi} ${styles.layers}`}>
              <div className={styles.lbl}>Map layers</div>
              <button className={`${styles.switchRow} ${showNames ? styles.switchOn : ""}`} onClick={() => setShowNames((v) => !v)}><span className={styles.switchLbl}>Names on map</span><span className={styles.switch} /></button>
              <button className={`${styles.switchRow} ${showStrip ? styles.switchOn : ""}`} onClick={() => setShowStrip((v) => !v)}><span className={styles.switchLbl}>Highlight the strip</span><span className={styles.switch} /></button>
              <button className={`${styles.switchRow} ${showBike ? styles.switchOn : ""}`} onClick={() => setShowBike((v) => !v)}><Bike size={14} /><span className={styles.switchLbl}>Bikeways</span><span className={styles.switch} /></button>
              <button className={`${styles.switchRow} ${showPathways ? styles.switchOn : ""}`} onClick={() => setShowPathways((v) => !v)}><Waves size={14} /><span className={styles.switchLbl}>River pathways</span><span className={styles.switch} /></button>
              <button className={`${styles.switchRow} ${showBeyond ? styles.switchOn : ""}`} onClick={() => setShowBeyond((v) => !v)}><span className={styles.switchLbl}>Beyond the strip</span><span className={styles.switch} /></button>
            </div>
          </div>

          <div className={`${styles.mapUi} ${styles.mapUiBr}`}>
            <div className={`${styles.cardUi} ${styles.zoomer}`}>
              <button onClick={() => mapRef.current?.zoomIn()} title="Zoom in"><Plus size={16} /></button>
              <div className={styles.zoomerSep} />
              <button onClick={() => mapRef.current?.zoomOut()} title="Zoom out"><Minus size={16} /></button>
            </div>
            <button className={`${styles.cardUi} ${styles.iconBtn}`} onClick={locateMe} title={userLocation ? "Centre on me" : "Show my location"}><Navigation size={17} /></button>
            <button className={`${styles.cardUi} ${styles.iconBtn}`} onClick={() => fitStrip(true)} title="Re-centre"><Compass size={17} /></button>
            <button className={`${styles.cardUi} ${styles.infoButton}`} onClick={() => setShowInfo((v) => !v)} title="Open data attribution">ⓘ</button>
            {showInfo && <div className={`${styles.cardUi} ${styles.infoNote}`}>Building footprints and business licences: City of Calgary open data. Basemap © OpenStreetMap contributors, © CARTO.</div>}
          </div>

          {hint && (
            <div className={`${styles.cardUi} ${styles.hint}`}>
              <span><b>Stroll hint</b>&nbsp;{hint}</span>
              <button onClick={() => setHint(null)}>Got it</button>
            </div>
          )}

          <button className={`${styles.edgeTab} ${styles.edgeTabLeft}`} onClick={() => setPanelCollapsed((c) => !c)} title={panelCollapsed ? "Show list" : "Hide list"}>
            {panelCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
          </>
          )}

          {mobileLayout && tab === "explore" && !walkingRoute && (
            <div ref={mobileTopRef} className={styles.mTop}>
              <label className={`${styles.mSearch} ${styles.glass}`}>
                <Search size={16} color="var(--ink-3)" />
                <input
                  ref={searchRef}
                  aria-label="Search businesses"
                  placeholder="Search…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  /* type=search gives the phone keyboard a Search key; the rest stops iOS autocapitalising business names. */
                  type="search"
                  enterKeyHint="search"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); searchRef.current?.blur(); } }}
                />
                {query && (
                  <button
                    className={styles.mSearchClear}
                    aria-label="Clear search"
                    onClick={(e) => { e.preventDefault(); setQuery(""); searchRef.current?.focus(); }}
                  >
                    <X size={15} />
                  </button>
                )}
              </label>
              {/* The chip row is noise once you are typing, and it costs the results list a row of height. */}
              {!query.trim() && (
                <div className={styles.mChipRow}>
                  {allCategories.map((key) => (
                    <button key={key} className={styles.mChip} aria-pressed={activeCategories.has(key)} onClick={() => toggleActiveCategory(key)}>
                      <i style={{ background: categoryColor(city, key) }} />{MOBILE_CAT_LABEL[key]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {mobileLayout && (
            <button
              ref={locateRef}
              className={styles.mLocate}
              onClick={locateMe}
              title={userLocation ? "Centre on me" : "Show my location"}
            >
              {locating ? <Navigation size={19} /> : userLocation ? <Navigation size={19} /> : <Compass size={19} />}
            </button>
          )}

          {!data && !error && <div className={styles.hint}>Painting rooftops…</div>}
          {error && <div className={styles.hint}>Could not load Stroll data: {error}</div>}
        </div>

        {!mobileLayout && (
          <div className={`${styles.drawer} ${selected || selectedAttraction ? styles.drawerOpen : ""}`}>
            <button className={`${styles.edgeTab} ${styles.edgeTabRight}`} onClick={closeSelected} title="Close"><ChevronRight size={15} /></button>
            {selected && <div className={styles.drawerScroll}>{renderDetail(selected)}</div>}
            {selectedAttraction && <div className={styles.drawerScroll}>{renderAttractionDetail(selectedAttraction)}</div>}
          </div>
        )}
      </div>

      {mobileLayout && (
        <div
          ref={sheetRef}
          className={styles.mSheet}
          /* Lifted clear of the keyboard, and capped so the raised sheet cannot run off the top of what is still visible. */
          style={keyboardLift > 0 ? { bottom: keyboardLift, maxHeight: Math.max(180, viewportHeight - 92) } : undefined}
        >
          <button
            className={styles.mGrab}
            onPointerDown={onSheetGrabPointerDown}
            onPointerMove={onSheetGrabPointerMove}
            onPointerUp={onSheetGrabPointerUp}
            onPointerCancel={onSheetGrabPointerUp}
            title="Drag to resize"
          >
            <i />
          </button>

          {!selected && (
            <div className={styles.mSheetHead}>
              {tab === "events" ? (
                <span className={styles.mSheetTitle}>{events.length} event{events.length === 1 ? "" : "s"}</span>
              ) : (
                <>
                  <span className={styles.mSheetTitle}>{visibleBusinesses.length} place{visibleBusinesses.length === 1 ? "" : "s"}</span>
                  <button className={styles.mSort} onClick={() => setSortMode((m) => (m === "az" ? "claimed" : "az"))}>
                    {sortMode === "az" ? "A–Z" : "Claimed first"} <ChevronDown size={11} />
                  </button>
                </>
              )}
            </div>
          )}

          <div className={styles.mSheetBody}>
            {selected ? (
              renderDetail(selected)
            ) : selectedAttraction ? (
              renderAttractionDetail(selectedAttraction)
            ) : tab === "events" ? (
              events.map((event) => (
                <button key={event.id} className={styles.row} onClick={() => { mapRef.current?.flyTo({ center: [event.lon, event.lat], zoom: 16.4, duration: 650 }); if (sheetStop !== "peek") snapSheet("peek"); }}>
                  <div className={styles.thumb} style={{ display: "grid", placeItems: "center", color: "var(--ink-3)" }}><CalendarDays size={22} /></div>
                  <div className={styles.rowBody}>
                    <div className={styles.rowName}>{event.name}</div>
                    <div className={styles.rowMeta}>{formatDate(event.starts_at)} · {event.venue}</div>
                    <div className={styles.rowMeta} style={{ color: "var(--ink-3)" }}>{event.source}</div>
                  </div>
                </button>
              ))
            ) : (
              <>
                {visibleBusinesses.length === 0 && (
                  hiddenByCategories > 0 ? (
                    <div className={styles.empty}>
                      <b>{hiddenByCategories} match{hiddenByCategories === 1 ? "" : "es"} hidden</b>
                      Your category filters are hiding every result for “{query.trim()}”.
                      <button className={styles.emptyAction} onClick={() => setCategories(new Set(allCategories))}>Show all categories</button>
                    </div>
                  ) : query.trim() ? (
                    <div className={styles.empty}>
                      <b>No matches for “{query.trim()}”</b>
                      Try a shorter word, or search by street instead.
                      <button className={styles.emptyAction} onClick={() => { setQuery(""); searchRef.current?.focus(); }}>Clear search</button>
                    </div>
                  ) : (
                    <div className={styles.empty}><b>Nothing here yet</b>Turn a category back on to see places.</div>
                  )
                )}
                {visibleBusinesses.map((biz) => renderBusinessRow(biz))}
              </>
            )}
          </div>
        </div>
      )}

      {/* The tab bar would otherwise sit on top of the keyboard, stealing a row from the results. */}
      {mobileLayout && keyboardLift === 0 && (
        <nav ref={tabsRef} className={styles.mTabs}>
          <button className={tab === "explore" ? styles.mTabOn : ""} onClick={() => { setTab("explore"); closeSelected(); }}>
            <IconExplore />Explore
          </button>
          <button className={tab === "events" ? styles.mTabOn : ""} onClick={() => { setTab("events"); closeSelected(); }}>
            <IconEvents />Events
          </button>
          <Link href={huntHref}>
            <Route size={17} />Hunt
          </Link>
          <Link href="/portal">
            <IconAdd />Claim
          </Link>
        </nav>
      )}

      {welcome && (
        <section className={styles.welcome} aria-label="Welcome to Stroll">
          <img src="/brand/stroll-logo.png" alt="stroll.city" />
          <p className={styles.eyebrow}>{city.theme.brandTag}</p>
          <p>{city.theme.welcomeLine}</p>
          <button onClick={closeWelcome}>Start strolling →</button>
        </section>
      )}
    </main>
  );
}
