"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl, { LngLatBounds, Map as MapLibreMap, Marker } from "maplibre-gl";
import {
  Bike,
  Briefcase,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Compass,
  ExternalLink,
  Globe,
  Landmark,
  Layers,
  Minus,
  Navigation,
  Plus,
  Search,
  ShieldCheck,
  Waves,
  X,
} from "lucide-react";
import type { CityConfig } from "./cities";
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
  stats: { businesses: number; businessBuildings: number; trees: number; categories: Record<string, number> };
};

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
const CAT_BLURB: Record<Category, string> = {
  restaurant: "Dining rooms, patios, counters",
  cafe: "Coffee, bakeries, ice cream",
  bar: "Taprooms, cocktails, live sets",
  shop: "Records, books, wine, homeware",
  services: "Barbers, makers, bookable rooms",
  gallery: "Galleries, studios, openings",
};
const allCategories = Object.keys(CAT_LABEL) as Category[];

export function categoryColor(city: CityConfig, category: Category) {
  return city.theme.categories[category] ?? city.theme.primary;
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
function pinMarkup(styles_: typeof styles, biz: Business, color: string, compact: boolean, active: boolean) {
  const glyphInner = biz.logo_url ? `<img src="${biz.logo_url}" alt="" />` : biz.mono;
  const classes = [styles_.pin, compact ? styles_.compact : "", active ? styles_.pinActive : ""].filter(Boolean).join(" ");
  const glyph = `<span class="${styles_.glyph}" style="background:${color}">${glyphInner}</span>`;
  if (compact) return `<div class="${classes}">${glyph}</div>`;
  return `<div class="${classes}">${glyph}<span class="${styles_.label}">${biz.name}</span></div>`;
}
function clusterMarkup(styles_: typeof styles, members: Business[], wide: boolean, colors: string[]) {
  if (wide) {
    const dots = colors.slice(0, 3).map((c, i) => `<span style="width:13px;height:13px;border-radius:99px;background:${c};border:2px solid #fff;margin-left:${i ? -5 : 0}px"></span>`).join("");
    return `<div class="${styles_.pin} ${styles_.cluster}"><span style="display:flex;align-items:center;padding-left:7px">${dots}</span><span class="${styles_.label}">${members.length} places</span></div>`;
  }
  return `<div class="${styles_.pin} ${styles_.cluster} ${styles_.compact}"><span class="${styles_.glyph}" style="background:#14181A">${members.length}</span></div>`;
}
function fallbackEvents(data: StrollData): EventItem[] {
  return [
    { id: "night-market-demo", name: "Inglewood Night Market", venue: "9 Ave SE between 12 & 13 St", starts_at: "2026-07-24T17:00:00-06:00", ends_at: "2026-07-24T22:00:00-06:00", source: "Phase 1 sample", lon: data.center[0] - 0.0028, lat: data.center[1] + 0.0006 },
    { id: "gallery-walk-demo", name: "Gallery walk + local shops", venue: "Atlantic Ave / 9 Ave SE", starts_at: "2026-07-27T12:00:00-06:00", source: "Phase 1 sample", lon: data.center[0] + 0.0024, lat: data.center[1] + 0.0002 },
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
function streetOnly(name: string) {
  const parts = name.split("/");
  return parts[parts.length - 1].trim();
}
function areaOnly(name: string) {
  return name.split("/")[0].trim();
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
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [showNames, setShowNames] = useState(true);
  const [showStrip, setShowStrip] = useState(true);
  const [showBike, setShowBike] = useState(true);
  const [showPathways, setShowPathways] = useState(true);
  const [showBeyond, setShowBeyond] = useState(true);
  const [neighbourhoodSaved, setNeighbourhoodSaved] = useState(true);
  const [welcome, setWelcome] = useState(false);
  const [hint, setHint] = useState<string | null>("Hover a chip to preview it; click to open the profile without leaving the map.");
  const [extent, setExtent] = useState<"strip" | "city">("strip");
  const [layersOpen, setLayersOpen] = useState(false);
  const [stageTight, setStageTight] = useState(false);
  const [stageSnug, setStageSnug] = useState(false);
  const [stageShort, setStageShort] = useState(false);
  const [, forceTick] = useState(0);

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

  const visibleBusinesses = useMemo(() => {
    if (!data) return [];
    const needle = normalize(query);
    let list = data.businesses.filter((b) => {
      const matchesCategory = browseCategory ? b.category === browseCategory : true;
      const matchesQuery = needle ? normalize(`${b.name} ${b.address} ${b.category}`).includes(needle) : true;
      return matchesCategory && matchesQuery;
    });
    list = [...list].sort((a, b) => {
      if (sortMode === "claimed") {
        const ca = a.claim_status === "claimed" ? 0 : 1;
        const cb = b.claim_status === "claimed" ? 0 : 1;
        if (ca !== cb) return ca - cb;
      }
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [data, browseCategory, query, sortMode]);

  const nowMinutes = useMemo(() => edmontonMinutesNow(), []);
  const openNowCount = useMemo(() => {
    if (!data) return 0;
    return data.businesses.filter((b) => isOpenNow(b.hours, nowMinutes)).length;
  }, [data, nowMinutes]);

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

  /* ---------------- padding-aware fit, matching the design's fitPad()/fitStrip() ---------------- */
  const computePadding = () => {
    const wrap = mapWrapRef.current;
    const w = wrap?.clientWidth ?? 800, h = wrap?.clientHeight ?? 600;
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

  const flyToBusiness = (business: Business) => {
    setSelected(business);
    const slug = normalize(business.name).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    window.history.replaceState(null, "", `?biz=${slug}`);
    mapRef.current?.panTo([business.lon, business.lat], { duration: 500 });
  };
  const goFeatured = (attraction: Attraction) => {
    setHint(`${attraction.name}: ${attraction.blurb}`);
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
      setHint(`${n.name} is marked coming soon — the pipeline can light this up in Phase 2.`);
    }
  };
  const openPortal = (business: Business) => { window.location.href = `/portal?business=${encodeURIComponent(business.id)}`; };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setSelected(null); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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
    const map = new maplibregl.Map({
      container: mapNode.current,
      style: {
        version: 8,
        sources: {
          carto: { type: "raster", tiles: ["https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png", "https://b.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png", "https://c.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png", "https://d.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png"], tileSize: 256, attribution: "© OpenStreetMap © CARTO" },
          cartoLabels: { type: "raster", tiles: ["https://a.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png", "https://b.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png", "https://c.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png", "https://d.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png"], tileSize: 256 },
          streets: { type: "geojson", data: data.streets },
          biz: { type: "geojson", data: data.businessBuildings },
          bike: { type: "geojson", data: data.bike },
          pathways: { type: "geojson", data: data.pathways },
          stripband: { type: "geojson", data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [[51.03755, -114.03430], [51.03720, -114.01560]] } } },
        },
        layers: [
          { id: "carto", type: "raster", source: "carto" },
          { id: "stripband", type: "line", source: "stripband", layout: { "line-cap": "round" }, paint: { "line-color": "#14181A", "line-width": 26, "line-opacity": 0.08 } },
          { id: "pathways", type: "line", source: "pathways", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#5C6350", "line-width": ["interpolate", ["linear"], ["zoom"], 11, 1.2, 15, 3, 18, 5], "line-opacity": 0.55 } },
          { id: "bike-line", type: "line", source: "bike", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#5A707E", "line-width": ["interpolate", ["linear"], ["zoom"], 11, 1, 15, 2.4, 18, 4], "line-dasharray": [2, 1.6], "line-opacity": 0.6 } },
          { id: "street-ink", type: "line", source: "streets", paint: { "line-color": "#D6DEDA", "line-width": ["interpolate", ["linear"], ["zoom"], 13, 0.4, 16, 1.2, 18, 2.8], "line-opacity": 0.6 } },
          { id: "biz-shadow", type: "fill", source: "biz", minzoom: 15, paint: { "fill-color": "#14181A", "fill-opacity": 0.05, "fill-translate": [2, 3] } },
          { id: "biz-roof", type: "fill", source: "biz", minzoom: 15, paint: { "fill-color": "#F7FAF8", "fill-opacity": 0.6 } },
          { id: "biz-edge", type: "line", source: "biz", minzoom: 15, paint: { "line-color": "#DCE8E3", "line-width": 1, "line-opacity": 0.85 } },
          { id: "cartoLabels", type: "raster", source: "cartoLabels", paint: { "raster-opacity": 0.7 } },
        ],
      },
      center: data.center,
      zoom: 16.25,
      pitch: 0,
      minZoom: 10,
      maxZoom: 19.5,
      attributionControl: false,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.AttributionControl({ customAttribution: "Businesses, trees, bikeways & pathways © City of Calgary Open Data" }), "bottom-left");

    map.on("load", () => {
      map.addSource("trees", { type: "geojson", data: { type: "FeatureCollection", features: data.trees.map((c, i) => ({ type: "Feature", properties: { i }, geometry: { type: "Point", coordinates: c } })) } });
      map.addLayer({ id: "trees", type: "circle", source: "trees", minzoom: 14.5, paint: { "circle-color": "#5C6350", "circle-radius": ["interpolate", ["linear"], ["zoom"], 12, 0.6, 16, 2.2, 18, 4], "circle-opacity": 0.4, "circle-blur": 0.35 } });
      fitStrip(false);
    });

    map.on("moveend", () => forceTick((t) => t + 1));
    map.on("zoomend", () => forceTick((t) => t + 1));
    const onResize = () => { map.resize(); forceTick((t) => t + 1); };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      pinMarkersRef.current.forEach((m) => m.remove());
      eventMarkersRef.current.forEach((m) => m.remove());
      featMarkersRef.current.forEach(({ marker }) => marker.remove());
      pinMarkersRef.current = [];
      eventMarkersRef.current = [];
      featMarkersRef.current = [];
      map.remove();
      mapRef.current = null;
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
      if (extent === "strip" && !selected) fitStrip(false);
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
  }, [showBike, showPathways, showStrip, data]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    eventMarkersRef.current.forEach((m) => m.remove());
    eventMarkersRef.current = [];
    if (tab !== "events") return;
    eventMarkersRef.current = events.map((event) => {
      const el = document.createElement("button");
      el.className = styles.pin;
      el.innerHTML = `<span class="${styles.glyph}" style="background:${city.theme.primary}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M8 3.5v3M16 3.5v3M3.5 10h17"/></svg></span><span class="${styles.label}">${event.name}</span>`;
      el.title = event.name;
      el.addEventListener("click", () => { mapRef.current?.flyTo({ center: [event.lon, event.lat], zoom: 16.4, duration: 650 }); setHint(`${event.name} · ${event.venue}`); });
      return new maplibregl.Marker({ element: el, anchor: "bottom" }).setLngLat([event.lon, event.lat]).addTo(map);
    });
  }, [events, tab, city.theme.primary]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    featMarkersRef.current.forEach(({ marker }) => marker.remove());
    featMarkersRef.current = attractions.map((attraction) => {
      const el = document.createElement("button");
      el.className = styles.pin;
      el.innerHTML = `<span class="${styles.glyph}" style="background:${city.theme.green}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 21 8 3 8"/></svg></span><span class="${styles.label}">${attraction.name}</span>`;
      el.title = attraction.name;
      el.addEventListener("click", () => goFeatured(attraction));
      return { marker: new maplibregl.Marker({ element: el, anchor: "bottom" }).setLngLat([attraction.lon, attraction.lat]).addTo(map), attraction };
    });
  }, [attractions, city.theme.green]);

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
    type Slot = { x1: number; x2: number; y1: number; y2: number; cx: number; cy: number; members: Business[]; mode: "label" | "glyph"; pinned: boolean; chrome?: boolean };
    const slots: Slot[] = [];
    if (pane) {
      const chromeEls = wrap!.querySelectorAll(`.${styles.cardUi}, .${styles.glass}, .${styles.stat}, .${styles.drawerOpen}, .${styles.edgeTab}, .${styles.btnPrimary}`);
      chromeEls.forEach((n) => {
        const el = n as HTMLElement;
        if (!el.offsetWidth || getComputedStyle(el).display === "none") return;
        const r = el.getBoundingClientRect();
        slots.push({ x1: r.left - pane.left, x2: r.right - pane.left, y1: r.top - pane.top, y2: r.bottom - pane.top, cx: 0, cy: 0, members: [], mode: "label", pinned: true, chrome: true });
      });
    }

    const items = visibleBusinesses;
    const order = [...items].sort((a, b) => (b.id === selected?.id ? 1 : 0) - (a.id === selected?.id ? 1 : 0));
    const clears = (r: { x1: number; x2: number; y1: number; y2: number }) => !slots.some((s) => r.x1 < s.x2 + 8 && r.x2 + 8 > s.x1 && r.y1 < s.y2 + 6 && r.y2 + 6 > s.y1);
    const rectFor = (cp: { x: number; y: number }, w: number) => ({ x1: cp.x - 16, x2: cp.x - 16 + w, y1: cp.y - 17, y2: cp.y + 19, cx: cp.x, cy: cp.y });
    const measureCanvas = document.createElement("canvas").getContext("2d");
    const chipWidth = (name: string, isSelected: boolean) => {
      if (!showNames && !isSelected) return 32;
      if (measureCanvas) measureCanvas.font = "400 12.5px Outfit, sans-serif";
      const w = measureCanvas ? measureCanvas.measureText(name).width : name.length * 7;
      return 52 + Math.min(132, w);
    };

    order.forEach((biz) => {
      const cp = map.project([biz.lon, biz.lat]);
      const isSel = biz.id === selected?.id;
      const wide = rectFor(cp, chipWidth(biz.name, isSel));
      if (showNames && clears(wide)) { slots.push({ ...wide, members: [biz], mode: "label", pinned: isSel }); return; }
      const small = rectFor(cp, 32);
      if (clears(small)) { slots.push({ ...small, members: [biz], mode: "glyph", pinned: isSel }); return; }
      if (isSel) { slots.push({ ...small, members: [biz], mode: "label", pinned: true }); return; }
      let best: Slot | null = null;
      let bd = Infinity;
      for (const s of slots) {
        if (s.pinned || s.chrome) continue;
        const d = (s.cx - cp.x) ** 2 + (s.cy - cp.y) ** 2;
        if (d < bd) { bd = d; best = s; }
      }
      if (best !== null) { (best as Slot).members.push(biz); }
    });

    slots.forEach((s) => {
      if (s.chrome || !s.members.length) return;
      if (s.pinned || s.members.length === 1) {
        const biz = s.members[0];
        const compact = s.mode === "glyph" && biz.id !== selected?.id;
        const el = document.createElement("button");
        el.innerHTML = pinMarkup(styles, biz, categoryColor(city, biz.category), compact, biz.id === selected?.id);
        el.addEventListener("click", () => flyToBusiness(biz));
        el.addEventListener("mouseenter", () => {
          const pinEl = el.querySelector(`.${styles.pin}`);
          if (pinEl?.classList.contains(styles.compact)) { pinEl.classList.remove(styles.compact); (el as HTMLElement).dataset.wasCompact = "true"; }
          rowElsRef.current.get(biz.id)?.classList.add(styles.rowActive);
        });
        el.addEventListener("mouseleave", () => {
          const pinEl = el.querySelector(`.${styles.pin}`);
          if (el.dataset.wasCompact === "true") pinEl?.classList.add(styles.compact);
          if (biz.id !== selected?.id) rowElsRef.current.get(biz.id)?.classList.remove(styles.rowActive);
        });
        const marker = new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat([biz.lon, biz.lat]).addTo(map);
        pinMarkersRef.current.push(marker);
        pinElsRef.current.set(biz.id, el);
      } else {
        const wide = s.x2 - s.x1 >= 104;
        const colors = [...new Set(s.members.map((m) => categoryColor(city, m.category)))];
        const el = document.createElement("button");
        el.innerHTML = clusterMarkup(styles, s.members, wide, colors);
        el.addEventListener("click", () => mapRef.current?.flyTo({ center: [s.members[0].lon, s.members[0].lat], zoom: Math.min(19, (mapRef.current?.getZoom() ?? 16) + 2), duration: 550 }));
        const marker = new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat([s.members[0].lon, s.members[0].lat]).addTo(map);
        pinMarkersRef.current.push(marker);
      }
    });
  });

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

  if (city.status !== "live") {
    return (
      <main className={styles.comingSoon}>
        <img src="/brand/stroll-logo.png" alt="Stroll City" />
        <h1>{city.name} is next on the stroll.</h1>
        <p>{city.theme.welcomeLine}</p>
        <Link href="/">Back to city picker</Link>
      </main>
    );
  }

  return (
    <main className={styles.shell}>
      <nav className={styles.rail}>
        <img className={styles.railLogo} src="/brand/stroll-mark.png" alt="Stroll City" />
        <button className={`${styles.railBtn} ${tab === "explore" ? styles.railOn : ""}`} title="Explore" onClick={() => { setTab("explore"); backToBrowse(); }}><IconExplore /></button>
        <Link className={`${styles.railBtn} ${styles.railGhost}`} title="Add a place" href="/portal"><IconAdd /></Link>
        <button className={`${styles.railBtn} ${tab === "events" ? styles.railOn : ""}`} title="Events" onClick={() => setTab("events")}><IconEvents /></button>
        <button className={styles.railBtn} title="Saved (coming soon)" onClick={() => setHint("Saved lists are coming in a later phase.")}><IconSaved /></button>
        <button className={`${styles.railBtn} ${styles.railSpacer}`} title="Open data note" onClick={() => setHint("Geometry and licences come from City of Calgary open data.")}><IconOpenData /></button>
      </nav>

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
              <button role="tab" aria-selected={false} disabled title="Coming soon" style={{ opacity: .55, cursor: "default" }}>Saved</button>
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
              </div>

              <div className={styles.catlist}>
                {allCategories.map((key) => (
                  <button key={key} className={styles.catcard} onClick={() => openCategory(key)}>
                    <span className={styles.ccTile} style={{ background: wash(categoryColor(city, key), 38, 16), color: categoryColor(city, key) }}>
                      <CatIcon d={CAT_ICON[key]} size={20} color={categoryColor(city, key)} />
                    </span>
                    <span className={styles.ccBody}>
                      <span className={styles.ccName}>{CAT_LABEL[key]}</span>
                      <span className={styles.ccMeta}>{CAT_BLURB[key]}</span>
                    </span>
                    <span className={`${styles.ccN} ${styles.num}`}>{counts[key] || 0}</span>
                    <ChevronRight size={16} className={styles.ccChev} />
                  </button>
                ))}
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
                    <span className={styles.rhTile} style={{ background: wash(categoryColor(city, browseCategory), 38, 16) }}><CatIcon d={CAT_ICON[browseCategory]} size={16} color={categoryColor(city, browseCategory)} /></span>
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
                {visibleBusinesses.map((biz) => {
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
                          <span className={styles.catLabel} style={{ color: categoryColor(city, biz.category) }}><span className={styles.dot} style={{ background: categoryColor(city, biz.category) }} />{CAT_LABEL[biz.category]}</span>
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
                })}
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

          <div className={styles.panelFoot}>
            <ShieldCheck size={13} style={{ flex: "0 0 auto", marginTop: 1 }} />
            <span>Geometry and licences come from City of Calgary open data. Curation placeholders stay until the claim portal goes live.</span>
          </div>
        </div>
      </aside>

      <div ref={stageRef} className={`${styles.stage} ${stageTight ? styles.tight : ""} ${stageSnug ? styles.snug : ""} ${stageShort ? styles.short : ""}`}>
        <div ref={mapWrapRef} className={styles.mapWrap}>
          <div ref={mapNode} className={styles.map} />

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
            <button className={`${styles.cardUi} ${styles.iconBtn}`} onClick={() => fitStrip(true)} title="Re-centre"><Compass size={17} /></button>
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

          {!data && !error && <div className={styles.hint}>Painting rooftops…</div>}
          {error && <div className={styles.hint}>Could not load Stroll data: {error}</div>}
        </div>

        <div className={`${styles.drawer} ${selected ? styles.drawerOpen : ""}`}>
          <button className={`${styles.edgeTab} ${styles.edgeTabRight}`} onClick={() => setSelected(null)} title="Close"><ChevronRight size={15} /></button>
          {selected && (
            <div className={styles.drawerScroll}>
              <div className={styles.hero}>
                <img src={selected.photo} alt="" />
                <button className={styles.heroClose} onClick={() => setSelected(null)}><X size={15} /></button>
                <div className={styles.glyphLg} style={{ background: categoryColor(city, selected.category) }}>
                  {selected.logo_url ? <img src={selected.logo_url} alt="" /> : <CatIcon d={CAT_ICON[selected.category]} size={24} color="#fff" strokeWidth={1.7} />}
                </div>
              </div>
              <div className={styles.dBody}>
                <div>
                  <div className={styles.dTitle}>{selected.name}</div>
                  <div className={styles.dSub}>
                    <span className={styles.pill} style={{ color: categoryColor(city, selected.category), borderColor: `${categoryColor(city, selected.category)}33`, background: `${categoryColor(city, selected.category)}10` }}>
                      <CatIcon d={CAT_ICON[selected.category]} size={12} color={categoryColor(city, selected.category)} /> {CAT_LABEL[selected.category]}
                    </span>
                    {(() => { const open = isOpenNow(selected.hours, nowMinutes); return open === true ? <span className={styles.openBadge}>Open now</span> : open === false ? <span className={styles.closedBadge}>Closed</span> : null; })()}
                    {selected.claim_status === "claimed" && <span className={`${styles.pill} ${styles.pillClaimed}`}>✓ Claimed</span>}
                  </div>
                </div>
                <div className={styles.dActions}>
                  <button className={`${styles.btn} ${styles.btnPrimary}`} style={{ width: "100%", justifyContent: "center" }} onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lon}`, "_blank", "noopener,noreferrer")}>
                    <Navigation size={15} /> Directions
                  </button>
                  <button className={`${styles.btn} ${styles.btnGhost}`} title="Website" onClick={() => selected.website ? window.open(selected.website!, "_blank", "noopener,noreferrer") : setHint("No official website found yet — added to the marketing-help spreadsheet.")}>
                    <Globe size={16} />
                  </button>
                  <button className={`${styles.btn} ${styles.btnGhost}`} title="Save" onClick={() => setHint("Saved lists are coming in a later phase.")}>
                    <ExternalLink size={16} />
                  </button>
                </div>
                <p className={styles.blurb}>{selected.blurb}</p>
                <div className={styles.kv}>
                  <div className={styles.kvRow}><span className={styles.k}>Address</span><span className={styles.v}>{selected.address}, Calgary AB</span></div>
                  <div className={styles.kvRow}><span className={styles.k}>Hours</span><span className={styles.v}>{selected.hours}</span></div>
                  <div className={styles.kvRow}><span className={styles.k}>Source</span><span className={`${styles.v} ${styles.mono}`} style={{ fontSize: 11.5, color: "var(--ink-2)" }}>{selected.source}</span></div>
                </div>
                <div>
                  <div className={styles.lbl} style={{ marginBottom: 8 }}>Good for</div>
                  <div className={styles.rowTags}>{selected.highlights.map(([icon, text]) => <span key={text} className={styles.tag}>{icon} {text}</span>)}</div>
                </div>
                <button className={styles.claimcard} onClick={() => openPortal(selected)}>
                  <Briefcase size={20} color="var(--amber)" style={{ flex: "0 0 auto" }} />
                  <p><b>Is this your business?</b>Claim the listing to edit hours, add photos and publish events.</p>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {selected && <button aria-label="Close" onClick={() => setSelected(null)} style={{ position: "fixed", inset: 0, zIndex: 690, border: 0, background: "transparent", cursor: "default", display: typeof window !== "undefined" && window.innerWidth <= 860 ? "block" : "none" }} />}

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
