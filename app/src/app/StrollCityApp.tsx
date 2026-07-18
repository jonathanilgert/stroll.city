"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl, { GeoJSONSource, LngLatBoundsLike, Map as MapLibreMap, Marker } from "maplibre-gl";
import type { CityConfig } from "./cities";
import { themeStyle } from "./cities";
import styles from "./page.module.css";

type Category = "restaurant" | "cafe" | "bar" | "shop" | "services" | "gallery";
type SidebarTab = "explore" | "events";

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
  emoji?: string;
  url?: string;
};

type Attraction = {
  id: string;
  name: string;
  emoji: string;
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
const ROOFS = ["#c76e55", "#d89a58", "#d7b56d", "#8fb982", "#74a9a5", "#8d9ed2", "#a98ac3", "#c98599", "#b98b62"];
const CATEGORY_META: Record<Category, { label: string; icon: string }> = {
  restaurant: { label: "Restaurants", icon: "🍽️" },
  cafe: { label: "Cafés & sweets", icon: "☕" },
  bar: { label: "Bars & music", icon: "🍺" },
  shop: { label: "Shops", icon: "🛍️" },
  services: { label: "Studios & services", icon: "✨" },
  gallery: { label: "Arts & galleries", icon: "🎨" },
};
const allCategories = Object.keys(CATEGORY_META) as Category[];

function categoryColor(city: CityConfig, category: Category) {
  return city.theme.categories[category] ?? city.theme.primary;
}

function mapStyle(data: StrollData): maplibregl.StyleSpecification {
  return {
    version: 8,
    sources: {
      carto: {
        type: "raster",
        tiles: [
          "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
          "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
          "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
        ],
        tileSize: 256,
        attribution: "© OpenStreetMap © CARTO",
      },
      streets: { type: "geojson", data: data.streets },
      biz: { type: "geojson", data: data.businessBuildings },
      bike: { type: "geojson", data: data.bike },
      pathways: { type: "geojson", data: data.pathways },
    },
    layers: [
      { id: "carto", type: "raster", source: "carto", paint: { "raster-opacity": 0.62, "raster-saturation": -0.32, "raster-contrast": 0.08 } },
      { id: "pathways", type: "line", source: "pathways", layout: { "line-cap": "round", "line-join": "round", visibility: "visible" }, paint: { "line-color": "#43893E", "line-width": ["interpolate", ["linear"], ["zoom"], 11, 1.2, 15, 3, 18, 5], "line-opacity": 0.78 } },
      { id: "bike-line", type: "line", source: "bike", layout: { "line-cap": "round", "line-join": "round", visibility: "visible" }, paint: { "line-color": "#009ADE", "line-width": ["interpolate", ["linear"], ["zoom"], 11, 1, 15, 2.4, 18, 4], "line-dasharray": [2, 1.6], "line-opacity": 0.82 } },
      { id: "street-ink", type: "line", source: "streets", paint: { "line-color": "#8b7658", "line-width": ["interpolate", ["linear"], ["zoom"], 13, 0.4, 16, 1.5, 18, 3.5], "line-opacity": 0.32 } },
      { id: "biz-shadow", type: "fill", source: "biz", minzoom: 14, paint: { "fill-color": "#5a4a32", "fill-opacity": 0.22, "fill-translate": [4, 6] } },
      { id: "biz-roof", type: "fill", source: "biz", minzoom: 14, paint: { "fill-color": ["match", ["get", "roof"], 0, ROOFS[0], 1, ROOFS[1], 2, ROOFS[2], 3, ROOFS[3], 4, ROOFS[4], 5, ROOFS[5], 6, ROOFS[6], 7, ROOFS[7], 8, ROOFS[8], ROOFS[0]], "fill-opacity": 0.9 } },
      { id: "biz-edge", type: "line", source: "biz", minzoom: 14, paint: { "line-color": "#6b563a", "line-blur": 1, "line-width": 2.2, "line-opacity": 0.5 } },
    ],
  };
}

function pointCollection<T extends { lon: number; lat: number }>(items: T[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: items.map((item, i) => ({ type: "Feature", properties: { i }, geometry: { type: "Point", coordinates: [item.lon, item.lat] } })),
  };
}

function treeCollection(trees: [number, number][]): GeoJSON.FeatureCollection {
  return { type: "FeatureCollection", features: trees.map((coords, i) => ({ type: "Feature", properties: { i }, geometry: { type: "Point", coordinates: coords } })) };
}

function fallbackEvents(data: StrollData): EventItem[] {
  return [
    {
      id: "night-market-demo",
      name: "Inglewood Night Market",
      venue: "9 Ave SE between 12 & 13 St",
      starts_at: "2026-07-24T17:00:00-06:00",
      ends_at: "2026-07-24T22:00:00-06:00",
      source: "Phase 1 sample",
      lon: data.center[0] - 0.0028,
      lat: data.center[1] + 0.0006,
      emoji: "🏮",
    },
    {
      id: "gallery-walk-demo",
      name: "Gallery walk + local shops",
      venue: "Atlantic Ave / 9 Ave SE",
      starts_at: "2026-07-27T12:00:00-06:00",
      source: "Phase 1 sample",
      lon: data.center[0] + 0.0024,
      lat: data.center[1] + 0.0002,
      emoji: "🎨",
    },
  ];
}

function fallbackAttractions(data: StrollData): Attraction[] {
  return [
    { id: "zoo", name: "Calgary Zoo", emoji: "🦁", lon: -114.0307, lat: 51.0457, blurb: "A citywide discovery pin near the Bow River and Inglewood." },
    { id: "fort-calgary", name: "The Confluence", emoji: "🏛️", lon: -114.0446, lat: 51.0476, blurb: "Historic gathering place and cultural destination." },
    { id: "riverwalk", name: "RiverWalk", emoji: "🚶", lon: data.center[0] - 0.006, lat: data.center[1] + 0.005, blurb: "A friendly route for strolling into the neighbourhood." },
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
  const markersRef = useRef<{ marker: Marker; el: HTMLButtonElement; business: Business }[]>([]);
  const eventMarkersRef = useRef<Marker[]>([]);
  const attractionMarkersRef = useRef<Marker[]>([]);
  const [data, setData] = useState<StrollData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<Set<Category>>(new Set(allCategories));
  const [selected, setSelected] = useState<Business | null>(null);
  const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null);
  const [portalOpen, setPortalOpen] = useState(false);
  const [hovered, setHovered] = useState<Business | null>(null);
  const [thumb, setThumb] = useState<{ x: number; y: number } | null>(null);
  const [showBike, setShowBike] = useState(true);
  const [showPathways, setShowPathways] = useState(true);
  const [showAttractions, setShowAttractions] = useState(true);
  const [tab, setTab] = useState<SidebarTab>("explore");
  const [trayOpen, setTrayOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [welcome, setWelcome] = useState(false);
  const [toast, setToast] = useState("Hover a rooftop logo; click to open the mini-app profile without leaving the map.");

  useEffect(() => {
    if (city.status !== "live" || !city.dataPath) return;
    const welcomeTimer = window.setTimeout(() => {
      try {
        const isSmallScreen = window.matchMedia("(max-width: 920px)").matches;
        const seen = window.localStorage.getItem(`stroll-welcome-${city.slug}`);
        setWelcome(!seen && !isSmallScreen);
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

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const needle = normalize(query);
    return data?.businesses.filter((business) => normalize(`${business.name} ${business.address} ${business.category}`).includes(needle)).slice(0, 8) ?? [];
  }, [data, query]);

  const closeWelcome = () => {
    setWelcome(false);
    try {
      window.localStorage.setItem(`stroll-welcome-${city.slug}`, "1");
    } catch {
      // Private/in-app browsers can block localStorage; the button should still close the overlay.
    }
  };

  const closePanels = () => {
    setSelected(null);
    setSelectedAttraction(null);
    setPortalOpen(false);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePanels();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const openPortal = (business?: Business | null) => {
    if (business) setSelected(business);
    setPortalOpen(true);
  };

  const fitStrip = () => {
    if (!mapRef.current || !data) return;
    mapRef.current.fitBounds(data.stripBounds as LngLatBoundsLike, { padding: 78, bearing: -25, duration: 800 });
  };

  const flyCity = () => mapRef.current?.flyTo({ center: city.center, zoom: 11.2, bearing: 0, duration: 1100 });

  const flyToBusiness = (business: Business) => {
    setSelectedAttraction(null);
    setSelected(business);
    setTrayOpen(false);
    const slug = normalize(business.name).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    window.history.replaceState(null, "", `?biz=${slug}`);
    mapRef.current?.flyTo({ center: [business.lon, business.lat], zoom: Math.max(mapRef.current.getZoom(), 17), duration: 520 });
  };

  const openAttraction = (attraction: Attraction) => {
    setSelected(null);
    setSelectedAttraction(attraction);
    setTrayOpen(false);
    setToast(`${attraction.name}: ${attraction.blurb}`);
    mapRef.current?.flyTo({ center: [attraction.lon, attraction.lat], zoom: 14.5, duration: 700 });
  };

  const chooseNeighbourhood = (id: string) => {
    const n = data?.neighbourhoods.find((item) => item.id === id);
    if (!n || !mapRef.current) return;
    if (n.enabled) {
      mapRef.current.fitBounds(n.bounds as LngLatBoundsLike, { padding: 80, bearing: n.bearing, duration: 900 });
      setToast(`${n.name} is ready to stroll.`);
    } else {
      mapRef.current.flyTo({ center: n.center, zoom: 13, bearing: n.bearing, duration: 900 });
      setToast(`${n.name} is marked coming soon — the pipeline can light this up in Phase 2.`);
    }
  };

  useEffect(() => {
    if (!data || !mapNode.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: mapNode.current,
      style: mapStyle(data),
      center: data.center,
      zoom: 16.25,
      bearing: -25,
      pitch: 0,
      minZoom: 10,
      maxZoom: 19.5,
      attributionControl: false,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");
    map.addControl(new maplibregl.AttributionControl({ customAttribution: "Businesses, trees, bikeways & pathways © City of Calgary Open Data" }), "bottom-right");

    map.on("load", () => {
      map.addSource("trees", { type: "geojson", data: treeCollection(data.trees) });
      map.addLayer({ id: "trees", type: "circle", source: "trees", minzoom: 14.5, paint: { "circle-color": "#43893E", "circle-radius": ["interpolate", ["linear"], ["zoom"], 12, 0.6, 16, 2.2, 18, 4], "circle-opacity": 0.46, "circle-blur": 0.35 } });
      map.addSource("events", { type: "geojson", data: pointCollection(events) });
      map.addLayer({ id: "event-halo", type: "circle", source: "events", paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 8, 16, 18], "circle-color": "#C8102E", "circle-opacity": 0.16 } });
      fitStrip();
    });

    markersRef.current = data.businesses.map((business) => {
      const el = document.createElement("button");
      el.className = styles.marker;
      el.style.setProperty("--marker-color", categoryColor(city, business.category));
      el.type = "button";
      if (business.logo_url) {
        const img = document.createElement("img");
        img.src = business.logo_url;
        img.alt = "";
        img.className = styles.markerLogo;
        el.appendChild(img);
      } else {
        el.textContent = business.domain ? "★" : business.mono;
      }
      el.title = business.name;
      el.addEventListener("mouseenter", () => setHovered(business));
      el.addEventListener("mousemove", (event) => setThumb({ x: event.clientX, y: event.clientY }));
      el.addEventListener("mouseleave", () => {
        setHovered(null);
        setThumb(null);
      });
      el.addEventListener("click", () => flyToBusiness(business));
      const marker = new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat([business.lon, business.lat]).addTo(map);
      return { marker, el, business };
    });

    eventMarkersRef.current = events.map((event) => {
      const el = document.createElement("button");
      el.className = styles.eventMarker;
      el.textContent = event.emoji ?? "•";
      el.title = event.name;
      el.addEventListener("click", () => {
        setTab("events");
        map.flyTo({ center: [event.lon, event.lat], zoom: 16.4, duration: 650 });
      });
      return new maplibregl.Marker({ element: el, anchor: "bottom" }).setLngLat([event.lon, event.lat]).addTo(map);
    });

    attractionMarkersRef.current = attractions.map((attraction) => {
      const el = document.createElement("button");
      el.className = styles.attractionMarker;
      el.textContent = attraction.emoji;
      el.title = attraction.name;
      el.addEventListener("click", () => {
        setSelected(null);
        setSelectedAttraction(attraction);
        setTrayOpen(false);
        setToast(`${attraction.name}: ${attraction.blurb}`);
        map.flyTo({ center: [attraction.lon, attraction.lat], zoom: 14.5, duration: 700 });
      });
      return new maplibregl.Marker({ element: el, anchor: "bottom" }).setLngLat([attraction.lon, attraction.lat]).addTo(map);
    });

    return () => {
      markersRef.current.forEach(({ marker }) => marker.remove());
      eventMarkersRef.current.forEach((marker) => marker.remove());
      attractionMarkersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      eventMarkersRef.current = [];
      attractionMarkersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    markersRef.current.forEach(({ el, business }) => el.classList.toggle(styles.hide, !active.has(business.category)));
  }, [active]);

  useEffect(() => {
    eventMarkersRef.current.forEach((marker) => marker.getElement().classList.toggle(styles.hide, tab !== "events"));
    const map = mapRef.current;
    const source = map?.getSource("events") as GeoJSONSource | undefined;
    if (source) source.setData(pointCollection(events));
  }, [events, tab]);

  useEffect(() => {
    attractionMarkersRef.current.forEach((marker) => marker.getElement().classList.toggle(styles.hide, !showAttractions));
  }, [showAttractions]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const setVisibility = (layer: string, visible: boolean) => {
      if (map.getLayer(layer)) map.setLayoutProperty(layer, "visibility", visible ? "visible" : "none");
    };
    setVisibility("bike-line", showBike);
    setVisibility("pathways", showPathways);
  }, [showBike, showPathways]);

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
      <main className={styles.comingSoon} style={themeStyle(city.theme)}>
        <div className={styles.landingPaper} />
        <StrollArch colors={city.theme.archColors} />
        <p className={styles.eyebrow}>{city.theme.brandTag}</p>
        <h1>{city.name} is next on the stroll.</h1>
        <p>{city.theme.welcomeLine}</p>
        <Link href="/">Back to city picker</Link>
      </main>
    );
  }

  return (
    <main className={styles.shell} style={themeStyle(city.theme)}>
      <div className={styles.paper} />
      <div className={styles.grain} />
      <div ref={mapNode} className={styles.map} />

      <header className={styles.header}>
        <button className={styles.brand} onClick={() => setWelcome(true)} aria-label="Open welcome">
          <StrollArch colors={city.theme.archColors} compact />
          <span><b>stroll.city</b><small>{city.theme.brandTag}</small></span>
        </button>
        <select aria-label="Neighbourhood selector" onChange={(e) => chooseNeighbourhood(e.target.value)} defaultValue={city.defaultHood}>
          {data?.neighbourhoods.map((n) => <option key={n.id} value={n.id}>{n.name}{n.enabled ? "" : " · soon"}</option>)}
        </select>
        <div className={styles.searchWrap}>
          <input aria-label="Search businesses" placeholder="Search cafés, shops, galleries..." value={query} onChange={(e) => setQuery(e.target.value)} />
          {results.length > 0 && <div className={styles.results}>{results.map((business) => <button key={business.id} onClick={() => { flyToBusiness(business); setQuery(""); }}><span>{business.name}</span><small>{business.address}</small></button>)}</div>}
        </div>
        <button onClick={flyCity}>Whole city</button>
        <button onClick={fitStrip}>Fit to strip</button>
        <Link className={styles.claim} href={selected ? `/portal?business=${encodeURIComponent(selected.id)}` : "/portal"}>Claim your business</Link>
      </header>

      <aside className={`${styles.sidebar} ${trayOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.tabs} role="tablist" aria-label="Stroll sidebar">
          <button className={tab === "explore" ? styles.activeTab : ""} onClick={() => setTab("explore")}>Explore</button>
          <button className={tab === "events" ? styles.activeTab : ""} onClick={() => setTab("events")}>Events</button>
          <button className={styles.trayClose} onClick={() => setTrayOpen(false)}>Map</button>
        </div>

        {tab === "explore" ? (
          <section>
            <p className={styles.eyebrow}>{city.name} / Inglewood MVP</p>
            <h1>Painted rooftops, real storefronts.</h1>
            <p>Real Calgary licence points snapped to real building footprints, wrapped in the friendlier illustrated Stroll interface.</p>
            <div className={styles.actions}><button onClick={() => setActive(new Set(allCategories))}>Select all</button><button onClick={() => setActive(new Set())}>Clear all</button></div>
            <div className={styles.filters}>
              {allCategories.map((key) => (
                <button key={key} className={`${styles.filter} ${active.has(key) ? "" : styles.off}`} onClick={() => setActive((prev) => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; })}>
                  <span className={styles.swatch} style={{ background: categoryColor(city, key) }} />
                  <span>{CATEGORY_META[key].icon} {CATEGORY_META[key].label}</span>
                  <b>{counts[key] || 0}</b>
                </button>
              ))}
            </div>
            <div className={styles.layerToggles}>
              <b>Getting around</b>
              <label><input type="checkbox" checked={showPathways} onChange={(e) => setShowPathways(e.target.checked)} /> River pathways</label>
              <label><input type="checkbox" checked={showBike} onChange={(e) => setShowBike(e.target.checked)} /> Bikeways</label>
              <label><input type="checkbox" checked={showAttractions} onChange={(e) => setShowAttractions(e.target.checked)} /> Beyond the strip</label>
            </div>
            {showAttractions && <div className={styles.attractionList}>{attractions.map((attraction) => <button key={attraction.id} onClick={() => openAttraction(attraction)}><span>{attraction.emoji}</span><b>{attraction.name}</b><small>{attraction.blurb}</small></button>)}</div>}
            <div className={styles.note}><b>Open data note:</b> Phase 2 keeps geometry/licences from City of Calgary open data, with curation placeholders until the claim portal goes live.</div>
          </section>
        ) : (
          <section>
            <p className={styles.eyebrow}>Happening today-ish</p>
            <h1>Events without leaving the map.</h1>
            <p>Phase 1 includes the Events tab UI and map pins. Phase 3 will wire the live agent API and event sources.</p>
            <div className={styles.eventList}>{events.map((event) => <button key={event.id} onClick={() => mapRef.current?.flyTo({ center: [event.lon, event.lat], zoom: 16.4, duration: 650 })}><b>{formatDate(event.starts_at)}</b><span>{event.emoji ?? "📍"} {event.name}</span><small>{event.venue} · {event.source}</small></button>)}</div>
          </section>
        )}
      </aside>

      <div className={styles.mobileBar}>
        <button onClick={() => { setTab("explore"); setTrayOpen(true); }}>Filters</button>
        <button onClick={() => { setTab("events"); setTrayOpen(true); }}>Events</button>
        <button onClick={fitStrip}>Re-centre</button>
      </div>

      {!data && !error && <div className={styles.loading}>Painting rooftops…</div>}
      {error && <div className={styles.loading}>Could not load Stroll data: {error}</div>}

      {hovered && thumb && <div className={styles.thumb} style={{ left: thumb.x + 18, top: thumb.y + 18 }}><img src={hovered.photo} alt="" /><span className={styles.thumbTag} style={{ background: categoryColor(city, hovered.category) }}>click to open ›</span><b>{hovered.name}</b><small>{hovered.blurb}</small></div>}

      {(selected || selectedAttraction || portalOpen) && <button className={styles.scrim} aria-label="Close panels" onClick={closePanels} />}
      <aside className={`${styles.panel} ${selected ? styles.open : ""}`}>
        {selected && <>
          <button className={styles.close} onClick={() => setSelected(null)}>× keep strolling</button>
          <img className={styles.hero} src={selected.photo} alt="" />
          <span className={styles.cat} style={{ background: categoryColor(city, selected.category) }}>{CATEGORY_META[selected.category].label}</span>
          <h2>{selected.name}</h2>
          <p className={styles.addr}>{selected.address}</p>
          <p>{selected.blurb}</p>
          <div className={styles.hours}>Open now-ish: <b>{selected.hours}</b></div>
          <div className={styles.highlights}>{selected.highlights.map(([icon, text]) => <div key={`${icon}-${text}`}><span>{icon}</span>{text}</div>)}</div>
          <div className={styles.findIt}><b>Find it on the map</b><span>{selected.logo_url ? "Verified logo marker and profile media were enriched from the business website." : "Logo pinned to the nearest verified building footprint from Calgary open data."}</span></div>
          <div className={styles.panelActions}>
            {selected.website ? <button onClick={() => window.open(selected.website!, "_blank", "noopener,noreferrer")}>Website</button> : <button onClick={() => setToast("No official website found yet — added to the marketing-help spreadsheet.")}>No website yet</button>}
            <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lon}`, "_blank", "noopener,noreferrer")}>Directions</button>
            <button onClick={() => setToast("Reviews become a curated/claimed-business feature after the portal is live.")}>Reviews</button>
          </div>
          <button className={styles.claimRow} onClick={() => openPortal(selected)}>Is this your business? Claim this page</button>
          {selected.website && <p className={styles.domain}>Official website: <a href={selected.website} target="_blank" rel="noreferrer">{selected.domain ?? selected.website}</a></p>}
          {!selected.logo_url && <p className={styles.domain}>Logo still needed — included in the marketing-help spreadsheet.</p>}
          <p className={styles.review}>Source: {selected.source}. {selected.needsReview ? "Auto-enriched media is marked for review until the business claims/approves it." : "Business website and media enrichment complete."}</p>
        </>}
      </aside>

      <aside className={`${styles.panel} ${styles.attractionPanel} ${selectedAttraction ? styles.open : ""}`}>
        {selectedAttraction && <>
          <button className={styles.close} onClick={() => setSelectedAttraction(null)}>× back to map</button>
          <div className={styles.attractionHero}><span>{selectedAttraction.emoji}</span></div>
          <span className={styles.cat} style={{ background: city.theme.sky }}>Beyond the strip</span>
          <h2>{selectedAttraction.name}</h2>
          <p>{selectedAttraction.blurb}</p>
          <div className={styles.findIt}><b>Citywide discovery layer</b><span>Phase 2 shows attractions as separate map pins so Stroll can grow beyond one retail strip.</span></div>
          <div className={styles.panelActions}><button onClick={() => mapRef.current?.flyTo({ center: [selectedAttraction.lon, selectedAttraction.lat], zoom: 15.5, duration: 650 })}>Zoom here</button><button onClick={() => setToast("Phase 3 can enrich this with Google Places photos, hours, ratings, and ticket/event feeds.")}>Future data</button></div>
        </>}
      </aside>

      {portalOpen && <PortalModal city={city} business={selected} onClose={() => setPortalOpen(false)} />}

      {welcome && <WelcomeOverlay city={city} onClose={closeWelcome} />}
      {toast && <div className={styles.toast}><b>Stroll hint</b><span>{toast}</span><button onClick={() => setToast("")}>Got it</button></div>}
    </main>
  );
}

function PortalModal({ city, business, onClose }: { city: CityConfig; business: Business | null; onClose: () => void }) {
  const plans = [
    ["Free", "$0", "Verified pin, name, category, address, and monogram marker."],
    ["Stroll", "$29/mo", "Logo marker, photo gallery, curated profile, hours, highlights, and links."],
    ["Stroll+", "$59/mo", "Everything in Stroll plus event/promos, featured placement, and analytics."],
  ];
  return (
    <section className={styles.portalModal} role="dialog" aria-modal="true" aria-label="Claim your business">
      <button className={styles.close} onClick={onClose}>× close</button>
      <p className={styles.eyebrow}>{city.name} business portal preview</p>
      <h2>{business ? `Claim ${business.name}` : "Claim your Stroll page"}</h2>
      <p className={styles.portalLead}>Phase 2 turns the CTA into a real product flow preview: verify your licence, claim the rooftop marker, pick a plan, and later connect Stripe/Supabase in the portal phase.</p>
      <ol className={styles.claimSteps}>
        <li><b>1</b><span>Find your business from the verified Calgary licence data.</span></li>
        <li><b>2</b><span>Confirm address/building footprint and ownership details.</span></li>
        <li><b>3</b><span>Upload logo, photos, hours, links, and highlights.</span></li>
        <li><b>4</b><span>Choose Free, Stroll, or Stroll+ and publish after review.</span></li>
      </ol>
      <div className={styles.planGrid}>{plans.map(([name, price, desc]) => <article key={name}><b>{name}</b><strong>{price}</strong><span>{desc}</span></article>)}</div>
      <button className={styles.claimRow} onClick={onClose}>Got it — keep strolling</button>
    </section>
  );
}

function WelcomeOverlay({ city, onClose }: { city: CityConfig; onClose: () => void }) {
  return (
    <section className={styles.welcome} aria-label="Welcome to Stroll">
      <div className={styles.cloudOne} />
      <div className={styles.cloudTwo} />
      <StrollArch colors={city.theme.archColors} />
      <p className={styles.eyebrow}>{city.theme.brandTag}</p>
      <h1>stroll.city</h1>
      <p>{city.theme.welcomeLine}</p>
      <button onClick={onClose}>Start strolling →</button>
    </section>
  );
}

function StrollArch({ colors, compact = false }: { colors: string[]; compact?: boolean }) {
  return (
    <svg className={compact ? styles.archMini : styles.arch} viewBox="0 0 120 68" role="img" aria-label="Stroll arch logo">
      <path d="M16 60C16 35.7 35.7 16 60 16s44 19.7 44 44" fill="none" stroke={colors[0]} strokeWidth="12" strokeLinecap="round" />
      <path d="M32 60c0-15.5 12.5-28 28-28s28 12.5 28 28" fill="none" stroke={colors[1]} strokeWidth="12" strokeLinecap="round" />
      <path d="M48 60c0-6.6 5.4-12 12-12s12 5.4 12 12" fill="none" stroke={colors[2]} strokeWidth="12" strokeLinecap="round" />
    </svg>
  );
}
