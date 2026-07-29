"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl, { LngLatBoundsLike, Map as MapLibreMap, Marker } from "maplibre-gl";
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
  Lightbulb,
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

type Category = "restaurant" | "cafe" | "bar" | "shop" | "services" | "gallery";
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

const CAT_ICON: Record<Category, string> = {
  restaurant: "M7 3v8a3 3 0 0 0 6 0V3M10 11v10M17 3c-1.2 2-1.6 3.4-1.6 5.2 0 1.3.7 2 1.6 2s1.6-.7 1.6-2C18.6 6.4 18.2 5 17 3Zm0 7.2V21",
  cafe: "M4 8h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Zm12 1h2.5a2.5 2.5 0 0 1 0 5H16M3 21h14",
  bar: "M5 4h14l-7 8v7M9 21h6M5 4l7 8",
  shop: "M4 8h16l-1 12H5L4 8Zm4 0V6a4 4 0 0 1 8 0v2",
  services: "M12 3v3M12 18v3M4.5 12h3M16.5 12h3M6.7 6.7l2.1 2.1M15.2 15.2l2.1 2.1M17.3 6.7l-2.1 2.1M8.8 15.2l-2.1 2.1",
  gallery: "M12 3a9 9 0 1 0 0 18c1.4 0 2-.9 2-2 0-2 2-1.6 3.4-2.2A5 5 0 0 0 21 12a9 9 0 0 0-9-9Zm-3.5 6h0M12 7h0m3.5 2h0",
};
const CAT_LABEL: Record<Category, string> = {
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

function categoryColor(city: CityConfig, category: Category) {
  return city.theme.categories[category] ?? city.theme.primary;
}

function CatIcon({ d, size = 16, color = "currentColor", strokeWidth = 1.8 }: { d: string; size?: number; color?: string; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

const measureCanvas = typeof document !== "undefined" ? document.createElement("canvas").getContext("2d") : null;
function chipWidth(name: string, showNames: boolean, isSelected: boolean) {
  if (!showNames && !isSelected) return 34;
  if (measureCanvas) measureCanvas.font = '700 12.5px "Plus Jakarta Sans", sans-serif';
  const w = measureCanvas ? measureCanvas.measureText(name).width : name.length * 7.2;
  return 50 + Math.min(132, w);
}

function pinMarkup(styles_: typeof styles, biz: Business, color: string, compact: boolean, active: boolean) {
  const glyphInner = biz.logo_url ? `<img src="${biz.logo_url}" alt="" />` : biz.mono;
  const classes = [styles_.pin, compact ? styles_.compact : "", active ? styles_.pinActive : ""].filter(Boolean).join(" ");
  const glyph = `<span class="${styles_.glyph}" style="background:${color}">${glyphInner}</span>`;
  if (compact) return `<div class="${classes}">${glyph}</div>`;
  return `<div class="${classes}">${glyph}<span class="${styles_.label}">${biz.name}</span></div>`;
}

function clusterMarkup(styles_: typeof styles, members: Business[], wide: boolean, colors: string[]) {
  if (wide) {
    const dots = colors.slice(0, 3).map((c, i) => `<span style="width:12px;height:12px;border-radius:99px;background:${c};border:2px solid #fff;margin-left:${i ? -5 : 0}px"></span>`).join("");
    return `<div class="${styles_.pin} ${styles_.cluster}"><span style="display:flex;align-items:center">${dots}</span><span class="${styles_.label}">${members.length} places</span></div>`;
  }
  return `<div class="${styles_.pin} ${styles_.cluster} ${styles_.compact}"><span class="${styles_.glyph}" style="background:#1C1A17">${members.length}</span></div>`;
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

export default function StrollCityApp({ city }: { city: CityConfig }) {
  const mapNode = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const pinMarkersRef = useRef<Marker[]>([]);
  const eventMarkersRef = useRef<Marker[]>([]);
  const featMarkersRef = useRef<{ marker: Marker; attraction: Attraction }[]>([]);
  const rowElsRef = useRef<Map<string, HTMLElement>>(new Map());
  const pinElsRef = useRef<Map<string, HTMLElement>>(new Map());

  const [data, setData] = useState<StrollData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<SidebarTab>("explore");
  const [browseCategory, setBrowseCategory] = useState<Category | null>(null);
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<"az" | "claimed">("az");
  const [mapDirty, setMapDirty] = useState(false);
  const [boundsFilter, setBoundsFilter] = useState<{ w: number; s: number; e: number; n: number } | null>(null);
  const [selected, setSelected] = useState<Business | null>(null);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [showNames, setShowNames] = useState(true);
  const [showStrip, setShowStrip] = useState(true);
  const [showBike, setShowBike] = useState(true);
  const [showPathways, setShowPathways] = useState(true);
  const [showBeyond, setShowBeyond] = useState(true);
  const [welcome, setWelcome] = useState(false);
  const [hint, setHint] = useState<string | null>("Hover a rooftop chip to preview it; click to open the profile without leaving the map.");
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

  const isResultsView = query.trim() !== "" || browseCategory !== null || boundsFilter !== null;

  const visibleBusinesses = useMemo(() => {
    if (!data) return [];
    const needle = normalize(query);
    let list = data.businesses.filter((b) => {
      const matchesCategory = browseCategory ? b.category === browseCategory : true;
      const matchesQuery = needle ? normalize(`${b.name} ${b.address} ${b.category}`).includes(needle) : true;
      const matchesBounds = boundsFilter ? b.lon >= boundsFilter.w && b.lon <= boundsFilter.e && b.lat >= boundsFilter.s && b.lat <= boundsFilter.n : true;
      return matchesCategory && matchesQuery && matchesBounds;
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
  }, [data, browseCategory, query, sortMode, boundsFilter]);

  const closeWelcome = () => {
    setWelcome(false);
    try {
      window.localStorage.setItem(`stroll-welcome-${city.slug}`, "1");
    } catch {
      // Private/in-app browsers can block localStorage; the button should still close the overlay.
    }
  };

  const openCategory = (key: Category) => {
    setBrowseCategory(key);
    setQuery("");
    setBoundsFilter(null);
    setMapDirty(false);
  };
  const backToBrowse = () => {
    setBrowseCategory(null);
    setQuery("");
    setSelected(null);
    setBoundsFilter(null);
    setMapDirty(false);
  };

  const searchThisArea = () => {
    const map = mapRef.current;
    if (!map) return;
    const b = map.getBounds();
    setBoundsFilter({ w: b.getWest(), s: b.getSouth(), e: b.getEast(), n: b.getNorth() });
    setMapDirty(false);
  };

  const fitStrip = () => {
    const map = mapRef.current;
    if (!map || !data) return;
    setBoundsFilter(null);
    setMapDirty(false);
    map.fitBounds(data.stripBounds as LngLatBoundsLike, { padding: 48, bearing: 0, duration: 800 });
    map.once("moveend", () => { if (map.getZoom() < 16) map.easeTo({ zoom: 16, duration: 300 }); });
  };
  const flyCity = () => {
    setBoundsFilter(null);
    setMapDirty(false);
    mapRef.current?.flyTo({ center: city.center, zoom: 11.2, bearing: 0, duration: 1100 });
  };
  const [extent, setExtent] = useState<"strip" | "city">("strip");

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
    setBoundsFilter(null);
    setMapDirty(false);
    if (n.enabled) {
      mapRef.current.fitBounds(n.bounds as LngLatBoundsLike, { padding: 80, duration: 900 });
      setHint(`${n.name} is ready to stroll.`);
    } else {
      mapRef.current.flyTo({ center: n.center, zoom: 13, duration: 900 });
      setHint(`${n.name} is marked coming soon — the pipeline can light this up in Phase 2.`);
    }
  };

  const openPortal = (business: Business) => {
    window.location.href = `/portal?business=${encodeURIComponent(business.id)}`;
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // ---------------- map init ----------------
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
          stripband: { type: "geojson", data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [data.stripBounds[0], data.stripBounds[1]] } } },
        },
        layers: [
          { id: "carto", type: "raster", source: "carto" },
          { id: "stripband", type: "line", source: "stripband", layout: { "line-cap": "round" }, paint: { "line-color": "#1C1A17", "line-width": 26, "line-opacity": 0.06 } },
          { id: "pathways", type: "line", source: "pathways", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#5C6350", "line-width": ["interpolate", ["linear"], ["zoom"], 11, 1.2, 15, 3, 18, 5], "line-opacity": 0.55 } },
          { id: "bike-line", type: "line", source: "bike", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#1B5FA8", "line-width": ["interpolate", ["linear"], ["zoom"], 11, 1, 15, 2.4, 18, 4], "line-dasharray": [2, 1.6], "line-opacity": 0.6 } },
          { id: "street-ink", type: "line", source: "streets", paint: { "line-color": "#C7C2B8", "line-width": ["interpolate", ["linear"], ["zoom"], 13, 0.4, 16, 1.2, 18, 2.8], "line-opacity": 0.5 } },
          { id: "biz-shadow", type: "fill", source: "biz", minzoom: 15, paint: { "fill-color": "#1C1A17", "fill-opacity": 0.06, "fill-translate": [2, 3] } },
          { id: "biz-roof", type: "fill", source: "biz", minzoom: 15, paint: { "fill-color": "#E4E0D6", "fill-opacity": 0.5 } },
          { id: "biz-edge", type: "line", source: "biz", minzoom: 15, paint: { "line-color": "#D3CDBF", "line-width": 1, "line-opacity": 0.8 } },
          { id: "cartoLabels", type: "raster", source: "cartoLabels", paint: { "raster-opacity": 0.85 } },
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
      fitStrip();
    });

    map.on("moveend", () => forceTick((t) => t + 1));
    map.on("zoomend", () => forceTick((t) => t + 1));
    map.on("move", (e) => { if (e.originalEvent) setMapDirty(true); });
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

  // ---------------- layer visibility ----------------
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

  // ---------------- event markers ----------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    eventMarkersRef.current.forEach((m) => m.remove());
    eventMarkersRef.current = [];
    if (tab !== "events") return;
    eventMarkersRef.current = events.map((event) => {
      const el = document.createElement("button");
      el.className = styles.pin;
      el.innerHTML = `<span class="${styles.glyph}" style="background:${city.theme.primary}"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></span><span class="${styles.label}">${event.name}</span>`;
      el.title = event.name;
      el.addEventListener("click", () => {
        mapRef.current?.flyTo({ center: [event.lon, event.lat], zoom: 16.4, duration: 650 });
        setHint(`${event.name} · ${event.venue}`);
      });
      return new maplibregl.Marker({ element: el, anchor: "bottom" }).setLngLat([event.lon, event.lat]).addTo(map);
    });
  }, [events, tab, city.theme.primary]);

  // ---------------- featured (attractions) markers + chrome-avoidance ----------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    featMarkersRef.current.forEach(({ marker }) => marker.remove());
    featMarkersRef.current = attractions.map((attraction) => {
      const el = document.createElement("button");
      el.className = `${styles.pin} ${styles.featPin}`;
      el.innerHTML = `<span class="${styles.glyph}" style="background:${city.theme.green}"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 21 8 3 8"/></svg></span><span class="${styles.label}">${attraction.name}</span>`;
      el.title = attraction.name;
      el.addEventListener("click", () => goFeatured(attraction));
      return { marker: new maplibregl.Marker({ element: el, anchor: "bottom" }).setLngLat([attraction.lon, attraction.lat]).addTo(map), attraction };
    });
  }, [attractions, city.theme.green]);

  useEffect(() => {
    const wrap = mapNode.current?.parentElement;
    if (!wrap) return;
    const pane = wrap.getBoundingClientRect();
    const chrome = [...wrap.querySelectorAll(`.${styles.cardUi}, .${styles.drawerOpen}, .${styles.edgeTab}`)].map((n) => n.getBoundingClientRect()).map((r) => ({ x1: r.left - pane.left, x2: r.right - pane.left, y1: r.top - pane.top, y2: r.bottom - pane.top }));
    featMarkersRef.current.forEach(({ marker }) => {
      const node = marker.getElement();
      if (!showBeyond) { node.style.display = "none"; return; }
      const p = marker.getLngLat();
      const map = mapRef.current;
      if (!map) return;
      const projected = map.project(p);
      const box = { x1: projected.x - 16, x2: projected.x - 16 + (node.offsetWidth || 150), y1: projected.y - 17, y2: projected.y + 19 };
      const inside = box.x1 > 6 && box.x2 < pane.width - 6 && box.y1 > 6 && box.y2 < pane.height - 6;
      const clashes = chrome.some((c) => box.x1 < c.x2 + 6 && box.x2 + 6 > c.x1 && box.y1 < c.y2 + 6 && box.y2 + 6 > c.y1);
      node.style.display = inside && !clashes ? "" : "none";
    });
  });

  // ---------------- business pins: collision-avoided placement ----------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !data) return;
    pinMarkersRef.current.forEach((m) => m.remove());
    pinMarkersRef.current = [];
    pinElsRef.current.clear();

    const items = visibleBusinesses;
    const order = [...items].sort((a, b) => (b.id === selected?.id ? 1 : 0) - (a.id === selected?.id ? 1 : 0));
    type Slot = { x1: number; x2: number; y1: number; y2: number; cx: number; cy: number; members: Business[]; mode: "label" | "glyph"; pinned: boolean };
    const slots: Slot[] = [];
    const clears = (r: { x1: number; x2: number; y1: number; y2: number }) => !slots.some((s) => r.x1 < s.x2 + 8 && r.x2 + 8 > s.x1 && r.y1 < s.y2 + 6 && r.y2 + 6 > s.y1);
    const rectFor = (cp: { x: number; y: number }, w: number) => ({ x1: cp.x - 16, x2: cp.x - 16 + w, y1: cp.y - 17, y2: cp.y + 19, cx: cp.x, cy: cp.y });

    order.forEach((biz) => {
      const cp = map.project([biz.lon, biz.lat]);
      const isSel = biz.id === selected?.id;
      const wide = rectFor(cp, chipWidth(biz.name, showNames, isSel));
      if (showNames && clears(wide)) { slots.push({ ...wide, members: [biz], mode: "label", pinned: isSel }); return; }
      const small = rectFor(cp, 34);
      if (clears(small)) { slots.push({ ...small, members: [biz], mode: "glyph", pinned: isSel }); return; }
      if (isSel) { slots.push({ ...small, members: [biz], mode: "label", pinned: true }); return; }
      let best: Slot | null = null, bd = Infinity;
      slots.forEach((s) => { if (s.pinned) return; const d = (s.cx - cp.x) ** 2 + (s.cy - cp.y) ** 2; if (d < bd) { bd = d; best = s; } });
      (best ?? slots[0])?.members.push(biz);
    });

    slots.forEach((s) => {
      if (s.pinned || s.members.length === 1) {
        const biz = s.members[0];
        const compact = s.mode === "glyph" && biz.id !== selected?.id;
        const el = document.createElement("button");
        el.innerHTML = pinMarkup(styles, biz, categoryColor(city, biz.category), compact, biz.id === selected?.id);
        el.addEventListener("click", () => flyToBusiness(biz));
        el.addEventListener("mouseenter", () => { el.querySelector(`.${styles.pin}`)?.classList.add(styles.pinActive); rowElsRef.current.get(biz.id)?.classList.add(styles.rowActive); });
        el.addEventListener("mouseleave", () => { if (biz.id !== selected?.id) { el.querySelector(`.${styles.pin}`)?.classList.remove(styles.pinActive); rowElsRef.current.get(biz.id)?.classList.remove(styles.rowActive); } });
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
      <header className={styles.topbar}>
        <button className={styles.brand} onClick={() => setWelcome(true)} aria-label="Open welcome">
          <img className={styles.mark} src="/brand/stroll-mark.png" alt="" />
          <span>
            <div className={styles.brandName}>STROLL <span>CITY</span></div>
            <div className={styles.brandSub}>{city.theme.brandTag}</div>
          </span>
        </button>
        <div className={styles.dividerV} />
        <label className={`${styles.field} ${styles.picker}`}>
          <Navigation size={15} />
          {data?.neighbourhoods.find((n) => n.id === city.defaultHood)?.name ?? city.name}
          <ChevronDown size={14} color="var(--ink-3)" />
          <select className={styles.pickerSelect} aria-label="Neighbourhood selector" onChange={(e) => chooseNeighbourhood(e.target.value)} defaultValue={city.defaultHood}>
            {data?.neighbourhoods.map((n) => <option key={n.id} value={n.id}>{n.name}{n.enabled ? "" : " · soon"}</option>)}
          </select>
        </label>
        <label className={`${styles.field} ${styles.search}`}>
          <Search size={15} color="var(--ink-3)" />
          <input aria-label="Search businesses" placeholder="Search cafés, shops, galleries…" value={query} onChange={(e) => { setQuery(e.target.value); setBrowseCategory(null); setBoundsFilter(null); setMapDirty(false); }} />
        </label>
        <div className={styles.spacer} />
        <div className={styles.seg}>
          <button className={extent === "strip" ? styles.segActive : ""} onClick={() => { setExtent("strip"); fitStrip(); }}>Fit to strip</button>
          <button className={extent === "city" ? styles.segActive : ""} onClick={() => { setExtent("city"); flyCity(); }}>Whole city</button>
        </div>
        <Link className={`${styles.btn} ${styles.btnPrimary}`} href="/portal">
          Claim your business
          <ChevronRight size={15} />
        </Link>
      </header>

      <div className={styles.mainSplit}>
        <aside className={`${styles.panel} ${panelCollapsed ? styles.panelCollapsed : ""}`}>
          <div className={styles.panelHead}>
            <div className={styles.tabs} role="tablist">
              <button role="tab" aria-selected={tab === "explore"} className={tab === "explore" ? styles.tabActive : ""} onClick={() => setTab("explore")}>Explore <span className={styles.count}>{data?.businesses.length ?? 0}</span></button>
              <button role="tab" aria-selected={tab === "events"} className={tab === "events" ? styles.tabActive : ""} onClick={() => setTab("events")}>Events <span className={styles.count}>{events.length}</span></button>
              <button role="tab" aria-selected={false} disabled title="Coming soon" style={{ opacity: .55, cursor: "default" }}>Saved</button>
            </div>
            {tab === "explore" && !isResultsView && (
              <div>
                <p className={styles.eyebrow}>{city.name} / Inglewood MVP</p>
                <p className={styles.h1} style={{ marginBottom: 2 }}>Painted rooftops, real storefronts.</p>
                <p className={styles.lede}>Real Calgary licence points snapped to real building footprints — browse by category or search the strip.</p>
              </div>
            )}
          </div>

          {tab === "explore" && !isResultsView && (
            <div className={styles.catList}>
              {allCategories.map((key) => (
                <button key={key} className={styles.catCard} onClick={() => openCategory(key)}>
                  <span className={styles.ccTile} style={{ background: `${categoryColor(city, key)}18`, color: categoryColor(city, key) }}>
                    <CatIcon d={CAT_ICON[key]} size={21} color={categoryColor(city, key)} strokeWidth={1.9} />
                  </span>
                  <span className={styles.ccBody}>
                    <span className={styles.ccName}>{CAT_LABEL[key]}</span>
                    <span className={styles.ccMeta}>{CAT_BLURB[key]}</span>
                  </span>
                  <span className={styles.ccN}>{counts[key] || 0}</span>
                  <ChevronRight size={16} className={styles.ccChev} />
                </button>
              ))}
              <div className={styles.catSep}><span>Featured places</span><span className={styles.catSepRule} /></div>
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
          )}

          {tab === "explore" && isResultsView && (
            <>
              <div className={styles.resultsHead}>
                <button className={styles.back} onClick={backToBrowse} title="All categories"><ChevronLeft size={16} /></button>
                {browseCategory ? (
                  <>
                    <span className={styles.rhTile} style={{ background: `${categoryColor(city, browseCategory)}18`, color: categoryColor(city, browseCategory) }}><CatIcon d={CAT_ICON[browseCategory]} size={16} color={categoryColor(city, browseCategory)} /></span>
                    <span className={styles.rhText}><b>{CAT_LABEL[browseCategory]}</b><span>{visibleBusinesses.length} places</span></span>
                  </>
                ) : query.trim() !== "" ? (
                  <>
                    <span className={styles.rhTile} style={{ background: "var(--surface-2)" }}><Search size={15} color="var(--ink-2)" /></span>
                    <span className={styles.rhText}><b>Search results</b><span>{visibleBusinesses.length} places</span></span>
                  </>
                ) : (
                  <>
                    <span className={styles.rhTile} style={{ background: "var(--surface-2)" }}><Compass size={15} color="var(--ink-2)" /></span>
                    <span className={styles.rhText}><b>This area</b><span>{visibleBusinesses.length} places</span></span>
                  </>
                )}
                <button className={styles.linkBtn} onClick={() => setSortMode((m) => (m === "az" ? "claimed" : "az"))}>{sortMode === "az" ? "A–Z" : "Claimed first"} <ChevronDown size={12} /></button>
              </div>
              <div className={styles.list}>
                {visibleBusinesses.length === 0 && <div className={styles.empty}><b>Nothing here yet</b>Turn a category back on, or clear the search.</div>}
                {visibleBusinesses.map((biz) => (
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
                        <span className={styles.catLabel} style={{ color: categoryColor(city, biz.category) }}><span className={styles.dot} />{CAT_LABEL[biz.category]}</span>
                        {biz.claim_status === "claimed" && <><span className={styles.dotSep} /><span className={styles.tag} style={{ color: "var(--violet)" }}>Claimed</span></>}
                      </div>
                      <div className={styles.rowMeta}><span style={{ color: "var(--ink-3)" }}>{biz.address}</span></div>
                      <div className={styles.rowTags}>{biz.highlights.slice(0, 3).map(([, text]) => <span key={text} className={styles.tag}>{text}</span>)}</div>
                    </div>
                  </button>
                ))}
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
            <ShieldCheck size={14} style={{ flex: "0 0 auto", marginTop: 1 }} />
            <span><b>Open data note:</b> geometry and licences come from City of Calgary open data. Curation placeholders stay until the claim portal goes live.</span>
          </div>
        </aside>

        <div className={styles.mapWrap}>
          <div ref={mapNode} className={styles.map} />

          <button className={`${styles.edgeTab} ${styles.edgeTabLeft}`} onClick={() => setPanelCollapsed((c) => !c)} title={panelCollapsed ? "Show list" : "Hide list"}>
            {panelCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>

          {mapDirty && (
            <button className={styles.searchArea} onClick={searchThisArea}>
              <Search size={14} /> Search this area
            </button>
          )}

          <div className={`${styles.mapUi} ${styles.mapUiTr}`}>
            <div className={`${styles.cardUi} ${styles.layers}`}>
              <div className={styles.layersTitle}>Map layers</div>
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
            <button className={`${styles.cardUi} ${styles.iconBtn}`} onClick={fitStrip} title="Re-centre"><Compass size={17} /></button>
          </div>

          {hint && (
            <div className={`${styles.cardUi} ${styles.hint}`}>
              <Lightbulb size={16} color="var(--violet)" style={{ flex: "0 0 auto" }} />
              <span className={styles.txt}><b>Stroll hint</b>&nbsp;{hint}</span>
              <button onClick={() => setHint(null)}>Got it</button>
            </div>
          )}

          {!data && !error && <div className={styles.loading}>Painting rooftops…</div>}
          {error && <div className={styles.loading}>Could not load Stroll data: {error}</div>}

          <div className={`${styles.drawer} ${selected ? styles.drawerOpen : ""}`}>
            <button className={`${styles.edgeTab} ${styles.edgeTabRight}`} onClick={() => setSelected(null)} title="Close"><ChevronRight size={15} /></button>
            {selected && (
              <div className={styles.drawerScroll}>
                <div className={styles.hero}>
                  <img src={selected.photo} alt="" />
                  <button className={styles.heroClose} onClick={() => setSelected(null)}><X size={15} /></button>
                  <div className={styles.glyphLg} style={{ background: categoryColor(city, selected.category) }}>
                    {selected.logo_url ? <img src={selected.logo_url} alt="" /> : selected.mono}
                  </div>
                </div>
                <div className={styles.dBody}>
                  <div>
                    <div className={styles.dTitle}>{selected.name}</div>
                    <div className={styles.dSub}>
                      <span className={styles.pill} style={{ color: categoryColor(city, selected.category), borderColor: `${categoryColor(city, selected.category)}33`, background: `${categoryColor(city, selected.category)}12` }}>
                        <CatIcon d={CAT_ICON[selected.category]} size={12} color={categoryColor(city, selected.category)} /> {CAT_LABEL[selected.category]}
                      </span>
                      {selected.claim_status === "claimed" && <span className={`${styles.pill} ${styles.pillClaimed}`}><ShieldCheck size={12} /> Claimed</span>}
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
                    <div className={styles.kvRow}><span className={styles.k}>Source</span><span className={`${styles.v} ${styles.mono}`} style={{ fontWeight: 500, fontSize: 11.5, color: "var(--ink-2)" }}>{selected.source}</span></div>
                  </div>
                  <div>
                    <div className={styles.sectTitle} style={{ marginBottom: 8 }}>Good for</div>
                    <div className={styles.rowTags}>{selected.highlights.map(([icon, text]) => <span key={text} className={styles.tag}>{icon} {text}</span>)}</div>
                  </div>
                  <button className={styles.claimCard} onClick={() => openPortal(selected)}>
                    <Briefcase size={20} color="var(--violet)" style={{ flex: "0 0 auto" }} />
                    <p><b>Is this your business?</b>Claim the listing to edit hours, add photos and publish events.</p>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {selected && <button aria-label="Close" onClick={() => setSelected(null)} style={{ position: "fixed", inset: 0, zIndex: 690, border: 0, background: "transparent", cursor: "default", display: window.innerWidth <= 860 ? "block" : "none" }} />}

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
