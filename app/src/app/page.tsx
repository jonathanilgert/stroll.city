"use client";

import Link from "next/link";
import maplibregl from "maplibre-gl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getCity, isLightHex } from "./cities";
import { categoryColor, type Category } from "./StrollCityApp";
import styles from "./landing.module.css";

const city = getCity("calgary")!;
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

type Business = {
  id: string;
  name: string;
  address: string;
  category: Category;
  mono: string;
  lon: number;
  lat: number;
  blurb?: string;
};

type HuntStop = {
  id: string;
  name: string;
  riddle: string;
  clue_1: string;
  clue_2: string;
  clue_3: string;
  challenge: string;
  difficulty: string;
};

type StrollData = {
  businesses: Business[];
  hunts?: { slug: string; name: string; stop_ids: string[] }[];
  huntStops?: HuntStop[];
};

/* Six moods with shorter labels than the map app's, but the same colours — they come
   from the city theme (cities.ts), so the landing and the map can't drift apart. */
const MOODS: { id: Category; label: string; color: string }[] = (
  [
    { id: "shop", label: "Shops" },
    { id: "restaurant", label: "Restaurants" },
    { id: "services", label: "Studios" },
    { id: "cafe", label: "Cafés" },
    { id: "bar", label: "Bars" },
    { id: "gallery", label: "Arts" },
  ] as const
).map((mood) => ({ ...mood, color: categoryColor(city, mood.id) }));
const MOOD_COLOR = Object.fromEntries(MOODS.map((m) => [m.id, m.color])) as Record<Category, string>;
const MOOD_LABEL = Object.fromEntries(MOODS.map((m) => [m.id, m.label])) as Record<Category, string>;

/* The punch card takes one tint per stop, in the order they're walked. */
const STOP_TINTS = ["#0B47E8", "#F9BFD0", "#DCF23C", "#FBE08A"];

const PLANS = [
  {
    id: "friendly",
    name: "Friendly Mode",
    price: "Free",
    suffix: "",
    flag: "",
    hot: false,
    feats: ["4 stops, always", "No account, no card", "Postcard finish"],
    cta: "Start now",
    href: "/calgary/hunt?type=friendly",
  },
  {
    id: "full",
    name: "Full Hunt",
    price: "$20",
    suffix: " /team",
    flag: "First one free",
    hot: true,
    feats: ["8 stops", "Something waiting at the last one", "Postcard finish"],
    cta: "Start a hunt",
    href: "/calgary/hunt?type=full",
  },
  {
    id: "loop",
    name: "Loop Race",
    price: "$20",
    suffix: " /team",
    flag: "",
    hot: false,
    feats: ["8 stops, 2 teams and up", "Rotated starts", "Live leaderboard"],
    cta: "Set up a race",
    href: "/calgary/hunt/race/new",
  },
  {
    id: "events",
    name: "Event bookings",
    price: "From $99",
    suffix: "",
    flag: "",
    hot: false,
    feats: ["Birthdays and staff days", "Class trips and youth groups", "Private group booking"],
    cta: "Book an event",
    href: "/events",
  },
];

const FEATURE_CARDS = [
  { title: "Loop Race", copy: "Same eight stops, rotated starts, live leaderboard.", href: "/calgary/hunt/race/new" },
  { title: "Event bookings", copy: "Birthdays, staff days, class trips, youth groups.", href: "/events" },
  { title: "Claim your doorway", copy: "Owners update hours and photos in minutes.", href: "/portal" },
  { title: "How it works", copy: "The rules of the hunt, in one short page.", href: "/rules" },
];

function Arrow({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden>
      <path d="M3.5 8h9M9 4.5 12.5 8 9 11.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Tick({ color }: { color: string }) {
  return (
    <svg width="9" height="9" viewBox="0 0 16 16" aria-hidden>
      <path d="M4 8.4 6.4 10.8 12 5" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function LandingPage() {
  const [data, setData] = useState<StrollData | null>(null);
  const [active, setActive] = useState<Set<Category>>(new Set(MOODS.map((m) => m.id)));
  const [selected, setSelected] = useState<Business | null>(null);
  const [stop, setStop] = useState(0);
  const [cluesOpen, setCluesOpen] = useState(0);
  /* Bumped on every map idle so the marker thinning re-runs against the new screen positions. */
  const [viewTick, setViewTick] = useState(0);

  const mapNode = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const fittedRef = useRef(false);

  /* One fetch of the city file gives the map its businesses and the hunt preview its
     real riddles — the same file the map app reads. */
  useEffect(() => {
    fetch(`${BASE_PATH}${city.dataPath}`)
      .then((response) => response.json())
      .then((json: StrollData) => setData(json))
      .catch(() => {});
  }, []);

  const businesses = useMemo(() => data?.businesses ?? [], [data]);
  const totalCount = businesses.length;
  const counts = useMemo(() => {
    const tally = {} as Record<Category, number>;
    businesses.forEach((b) => { tally[b.category] = (tally[b.category] ?? 0) + 1; });
    return tally;
  }, [businesses]);

  const visible = useMemo(() => businesses.filter((b) => active.has(b.category)), [businesses, active]);
  const litCount = visible.length;

  const marquee = useMemo(() => {
    const names = businesses.slice(0, 22).map((b) => b.name);
    return names.length ? names.concat(names) : [];
  }, [businesses]);

  /* The preview walks the real Friendly Mode hunt — same riddles you get on the street. */
  const huntStops = useMemo(() => {
    const hunt = data?.hunts?.find((h) => h.slug === "friendly-mode");
    if (!hunt || !data?.huntStops) return [];
    return hunt.stop_ids
      .map((id) => data.huntStops!.find((s) => s.id === id))
      .filter(Boolean) as HuntStop[];
  }, [data]);
  const huntDone = huntStops.length > 0 && stop >= huntStops.length;
  const currentStop = huntStops[Math.min(stop, Math.max(huntStops.length - 1, 0))] ?? null;
  const clueLadder = currentStop ? [currentStop.clue_1, currentStop.clue_2, currentStop.clue_3].filter(Boolean) : [];

  /* ---------------- live map in the hero frame ---------------- */
  useEffect(() => {
    if (!mapNode.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: mapNode.current,
      style: {
        version: 8,
        sources: {
          carto: {
            type: "raster",
            tiles: ["a", "b", "c", "d"].map((s) => `https://${s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png`),
            tileSize: 256,
            attribution: "© OpenStreetMap © CARTO",
          },
          cartoLabels: {
            type: "raster",
            tiles: ["a", "b", "c", "d"].map((s) => `https://${s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png`),
            tileSize: 256,
          },
        },
        layers: [
          { id: "carto", type: "raster", source: "carto" },
          { id: "cartoLabels", type: "raster", source: "cartoLabels", paint: { "raster-opacity": 0.7 } },
        ],
      },
      center: city.center,
      zoom: 14.8,
      attributionControl: false,
      // The hero map is genuinely live, but cooperative gestures keep it from eating the
      // page scroll: wheel needs ctrl, and a one-finger swipe scrolls past it on touch.
      cooperativeGestures: true,
    });
    mapRef.current = map;
    const bump = () => setViewTick((tick) => tick + 1);
    map.on("moveend", bump);
    map.on("load", bump);
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || fittedRef.current || !businesses.length) return;
    const bounds = new maplibregl.LngLatBounds();
    businesses.forEach((b) => bounds.extend([b.lon, b.lat]));
    map.fitBounds(bounds, { padding: { top: 64, bottom: 56, left: 32, right: 32 }, animate: false, maxZoom: 16.4 });
    fittedRef.current = true;
    setViewTick((tick) => tick + 1);
  }, [businesses]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
    const placed: maplibregl.Point[] = [];
    visible.forEach((b) => {
      const on = selected?.id === b.id;
      const point = map.project([b.lon, b.lat]);
      // Thin out pins that would sit on top of each other at this zoom — the selected
      // one always survives so clicking a chip never hides what you just opened.
      if (!on && placed.some((p) => Math.hypot(p.x - point.x, p.y - point.y) < 30)) return;
      placed.push(point);
      const el = document.createElement("button");
      el.type = "button";
      el.className = `${styles.pin} ${on ? styles.pinOn : ""}`;
      el.setAttribute("aria-label", b.name);
      // Pins stay one neutral tone whatever the mood — 162 of them in six colours turns
      // the street into confetti. Colour is reserved for the selected pin (see .pinOn).
      const glyph = document.createElement("span");
      glyph.className = styles.pinGlyph;
      glyph.textContent = b.mono;
      el.appendChild(glyph);
      el.onclick = () => setSelected(b);
      markersRef.current.push(new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat([b.lon, b.lat]).addTo(map));
    });
  }, [visible, selected, viewTick]);

  const toggleMood = useCallback((mood: Category) => {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(mood)) next.delete(mood); else next.add(mood);
      return next;
    });
    setSelected((prev) => (prev && prev.category === mood ? null : prev));
  }, []);

  const postTint = (i: number) => (i < stop ? STOP_TINTS[i] : "#F6E8ED");
  const goNextRiddle = () => {
    setStop((s) => Math.min(s + 1, huntStops.length || 4));
    setCluesOpen(0);
  };

  return (
    <main className={styles.landing}>
      <nav className={styles.nav}>
        <a className={styles.brand} href="#top">
          {/* eslint-disable-next-line @next/next/no-img-element -- static export, same as the map app's rail logo */}
          <img className={styles.brandMark} src="/brand/stroll-mark.png" alt="" width={26} height={26} />
          stroll.city
        </a>
        <span className={styles.navLinks}>
          <a className={styles.navLink} href="#value">Why stroll</a>
          <a className={styles.navLink} href="#hunt">The hunt</a>
          <a className={styles.navLink} href="#features">Features</a>
          <a className={styles.navLink} href="#pricing">Pricing</a>
        </span>
        <span className={styles.navRight}>
          <Link className={`${styles.navLink} ${styles.navGhost}`} href="/business">For businesses</Link>
          <Link className={`${styles.btn} ${styles.btnDark} ${styles.btnSm}`} href="/calgary">Explore the map</Link>
        </span>
      </nav>

      <section className={styles.hero} id="top">
        <div className={styles.heroCopy}>
          <span className={styles.badge} data-rise>
            <span className={styles.badgeNew}>New</span>
            Inglewood, Calgary is live{totalCount ? ` — ${totalCount} places mapped` : ""}
          </span>
          <h1 className={styles.h1} data-rise>The city map that looks like the walk</h1>
          <p className={styles.heroSub} data-rise>
            Every business drawn on its real building, a filter for whatever you feel like, and scavenger hunts that get you through the door. No account, no app.
          </p>
          <div className={styles.heroCta} data-rise>
            <Link className={`${styles.btn} ${styles.btnBlue}`} href="/calgary">Explore the map<Arrow /></Link>
            <Link className={`${styles.btn} ${styles.btnOutline}`} href="/calgary/hunt?type=friendly">Start a free hunt</Link>
          </div>
        </div>

        <div className={styles.frameWrap} data-rise>
          <div className={styles.frame}>
            <div className={styles.frameBar}>
              <span className={styles.frameDots} aria-hidden><i /><i /><i /></span>
              <span className={`${styles.frameUrl} ${styles.mono}`}>stroll.city/calgary/inglewood</span>
              <span className={styles.frameEnd}>
                <span className={`${styles.frameLive} ${styles.mono}`}><i />Live</span>
              </span>
            </div>

            <div className={styles.stage}>
              <div ref={mapNode} className={styles.map} />

              <div className={styles.chips}>
                {MOODS.map((mood) => {
                  const on = active.has(mood.id);
                  const dark = isLightHex(mood.color);
                  return (
                    <button
                      key={mood.id}
                      type="button"
                      className={styles.chip}
                      aria-pressed={on}
                      onClick={() => toggleMood(mood.id)}
                      style={on ? { background: mood.color, borderColor: mood.color, color: dark ? "#14161A" : "#fff" } : undefined}
                    >
                      <i style={on ? undefined : { background: mood.color, opacity: 1 }} />
                      {mood.label}
                      {counts[mood.id] ? <small>{counts[mood.id]}</small> : null}
                    </button>
                  );
                })}
              </div>

              <div className={`${styles.picked} ${selected ? styles.pickedOn : ""}`}>
                {selected && (
                  <>
                    <div className={styles.pickedName}>{selected.name}</div>
                    <div className={styles.pickedMeta}>
                      <i style={{ background: MOOD_COLOR[selected.category] }} />
                      {MOOD_LABEL[selected.category]}
                    </div>
                    <div className={styles.pickedAddr}>{selected.blurb?.trim() || selected.address}</div>
                    <Link className={styles.pickedLink} href="/calgary">Open in the map<Arrow size={12} /></Link>
                  </>
                )}
              </div>

              <span className={styles.hint}>
                {litCount ? `${litCount} of ${totalCount} places lit · drag to pan` : "Loading Inglewood…"}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.marquee} aria-label="On the street">
        <div className={styles.marqueeTrack}>
          {marquee.map((name, i) => (
            <span className={styles.marqueeItem} key={`${name}-${i}`}>{name}<i /></span>
          ))}
        </div>
      </section>

      <section className={styles.section} id="value">
        <div className={styles.sectionIn}>
          <div className={`${styles.head} ${styles.headWide}`} data-rise>
            <span className={`${styles.eyebrow} ${styles.mono}`}>Why stroll.city</span>
            <h2 className={styles.h2}>Search engines list places. We draw the street.</h2>
            <p className={styles.lead}>
              A map of a shopping street should tell you what it feels like to stand on it — which side has the cafés, how far the next block really is, what’s behind the door you keep walking past.
            </p>
          </div>
          <div className={styles.valueGrid} data-rise>
            <div className={styles.valueCard}>
              <span className={styles.valueIcon} style={{ background: "#E4EBFF" }}>
                <svg width="17" height="17" viewBox="0 0 20 20" aria-hidden>
                  <rect x="2.6" y="6.4" width="6" height="11" rx="1.4" fill="none" stroke="#0B47E8" strokeWidth="1.5" />
                  <rect x="11.4" y="3.4" width="6" height="14" rx="1.4" fill="none" stroke="#0B47E8" strokeWidth="1.5" />
                </svg>
              </span>
              <strong className={styles.valueTitle}>Real building footprints</strong>
              <p className={styles.valueCopy}>Each shop sits on the building it actually occupies, at the size it actually is.</p>
            </div>
            <div className={styles.valueCard}>
              <span className={styles.valueIcon} style={{ background: "#FBD9E4" }}>
                <svg width="17" height="17" viewBox="0 0 20 20" aria-hidden>
                  <path d="M3 5.5h14M5.5 10h9M8 14.5h4" stroke="#C2296B" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </span>
              <strong className={styles.valueTitle}>Filter by mood</strong>
              <p className={styles.valueCopy}>Six moods, not forty categories. Turn one off and that stretch goes quiet.</p>
            </div>
            <div className={styles.valueCard}>
              <span className={styles.valueIcon} style={{ background: "#EDF7B8" }}>
                <svg width="17" height="17" viewBox="0 0 20 20" aria-hidden>
                  <circle cx="10" cy="10" r="6.6" fill="none" stroke="#5F7A12" strokeWidth="1.5" />
                  <path d="M10 6.4v4l2.6 1.6" stroke="#5F7A12" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
              <strong className={styles.valueTitle}>No route generator</strong>
              <p className={styles.valueCopy}>You decide the walk. The map stays out of the way and tells the truth.</p>
            </div>
            <div className={styles.valueCard}>
              <span className={styles.valueIcon} style={{ background: "#FDECBE" }}>
                <svg width="17" height="17" viewBox="0 0 20 20" aria-hidden>
                  <path d="M6 3.5h8a1.5 1.5 0 0 1 1.5 1.5v10A1.5 1.5 0 0 1 14 16.5H6A1.5 1.5 0 0 1 4.5 15V5A1.5 1.5 0 0 1 6 3.5z" fill="none" stroke="#8A6410" strokeWidth="1.5" />
                  <path d="M8.4 13.6h3.2" stroke="#8A6410" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
              <strong className={styles.valueTitle}>Opens in a browser</strong>
              <p className={styles.valueCopy}>Nothing to install, no account to make. A link is the whole product.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section} id="hunt">
        <div className={styles.sectionIn}>
          <div className={`${styles.head} ${styles.headNarrow}`} data-rise>
            <span className={`${styles.eyebrow} ${styles.eyebrowPink} ${styles.mono}`}>The hunt</span>
            <h2 className={styles.h2}>Solve the street, one doorway at a time.</h2>
            <p className={styles.leadVerse}>Read the riddle, guess where to look, stroll on over, snap your picture, then on to the next — and look what you took.</p>
            <p className={styles.lead}>Can&apos;t crack one? Ask for a clue or two. The last clue names the shop outright, so nobody&apos;s left stranded on the sidewalk. Give it a shot and see how you do.</p>
          </div>

          <div className={styles.huntGrid} data-rise>
            <div className={styles.huntPanel}>
              <div className={styles.huntHead}>
                <span className={`${styles.huntStep} ${styles.mono}`}>
                  Friendly Mode · stop {huntDone ? huntStops.length : Math.min(stop + 1, Math.max(huntStops.length, 1))} of {huntStops.length || 4}
                </span>
                <span className={styles.punches}>
                  {(huntStops.length ? huntStops : [0, 1, 2, 3]).map((_, i) => (
                    <span className={styles.punch} key={i} style={i < stop ? { background: STOP_TINTS[i] } : undefined} />
                  ))}
                </span>
              </div>

              <div className={styles.riddleCard}>
                <span className={styles.riddleTag}>
                  {huntDone ? "That’s Friendly Mode" : currentStop ? `Stop ${Math.min(stop + 1, huntStops.length)} · ${currentStop.difficulty}` : "Loading the hunt…"}
                </span>
                <p className={`${styles.riddleText} ${styles.riddleVerse}`}>
                  {huntDone
                    ? "Four doors, four photos. Your postcard is ready."
                    : currentStop?.riddle ?? "Fetching the riddles from the street…"}
                </p>
                {huntDone ? (
                  <p className={styles.riddleHint}>Start the real thing and the punch card fills itself in as you walk.</p>
                ) : (
                  <div className={styles.locked}>
                    {clueLadder.slice(0, cluesOpen).map((clue, index) => (
                      <div className={styles.callout} key={`${currentStop?.id}-clue-${index}`}><b>Clue {index + 1}</b> {clue}</div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.huntActions}>
                {huntDone ? (
                  <Link className={`${styles.btn} ${styles.btnMd} ${styles.btnDark}`} href="/calgary/hunt?type=friendly">
                    Start the real hunt<Arrow />
                  </Link>
                ) : (
                  <>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnMd} ${styles.btnDark}`}
                      onClick={() => setCluesOpen((n) => Math.min(3, n + 1))}
                      disabled={!currentStop || cluesOpen >= 3}
                    >
                      {cluesOpen >= 3 ? "All clues shown" : `Show clue ${cluesOpen + 1}`}<Arrow />
                    </button>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnMd} ${styles.btnHuntGhost}`}
                      onClick={goNextRiddle}
                      disabled={!currentStop}
                    >
                      Next riddle
                    </button>
                  </>
                )}
                <button type="button" className={`${styles.btn} ${styles.btnMd} ${styles.btnHuntGhost}`} onClick={() => { setStop(0); setCluesOpen(0); }}>Start over</button>
                <span className={styles.huntNote}>
                  {huntDone ? "All four riddles read" : cluesOpen ? `${cluesOpen} of 3 clues open` : `${(huntStops.length || 4) - stop} riddles to go`}
                </span>
              </div>
            </div>

            <div className={styles.huntSide}>
              <figure className={styles.huntFig}>
                <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" className={styles.figArt} aria-hidden>
                  <rect width="400" height="500" fill="#0B47E8" />
                  <rect x="52" y="120" width="296" height="380" rx="10" fill="#CFDCFF" />
                  <rect x="52" y="120" width="296" height="34" fill="#DCF23C" />
                  <rect x="82" y="188" width="104" height="128" rx="6" fill="#fff" opacity=".82" />
                  <rect x="214" y="188" width="104" height="128" rx="6" fill="#fff" opacity=".82" />
                  <path d="M158 352h84v148h-84z" fill="#0736B8" />
                  <circle cx="228" cy="428" r="6" fill="#DCF23C" />
                  <rect x="82" y="352" width="52" height="8" rx="4" fill="#F9BFD0" />
                  <rect x="266" y="352" width="52" height="8" rx="4" fill="#F9BFD0" />
                </svg>
                <span className={styles.huntShade} aria-hidden />
                <figcaption className={styles.huntCap}>
                  <span className={`${styles.huntCapK} ${styles.mono}`}>{cluesOpen >= 3 || huntDone ? "The challenge at this stop" : "Photo prompt locked"}</span>
                  <span className={styles.huntCapV}>
                    {huntDone ? "Ninth Avenue SE, Inglewood" : cluesOpen >= 3 ? currentStop?.challenge ?? "Take a proof photo at the door." : "Open the final clue when you want the shop and photo prompt revealed."}
                  </span>
                </figcaption>
              </figure>

              <div className={styles.postcard}>
                <strong className={styles.postcardTitle}>Postcard + Basket draw</strong>
                <p className={styles.postcardCopy}>Finish Friendly Mode to make your postcard and open entry to the Inglewood Basket draw. No purchase necessary.</p>
                <Link className={styles.pickedLink} href="/rules">Basket rules<Arrow size={12} /></Link>
                <div className={styles.postRow}>
                  {[0, 1, 2, 3].map((i) => <span key={i} style={{ background: postTint(i) }} />)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section} id="features">
        <div className={styles.sectionIn}>
          <div className={`${styles.head} ${styles.headNarrow}`} data-rise>
            <span className={`${styles.eyebrow} ${styles.eyebrowLime} ${styles.mono}`}>Features</span>
            <h2 className={styles.h2}>Everything the street needs, nothing it doesn’t</h2>
          </div>

          <div className={styles.featTop} data-rise>
            <div className={styles.featBig}>
              <span className={`${styles.eyebrow} ${styles.eyebrowMuted} ${styles.mono} ${styles.eyebrowFlush}`}>Mood filters</span>
              <strong className={styles.featTitle}>Six moods instead of forty categories</strong>
              <p className={styles.featCopy}>
                Shops, restaurants, studios, cafés, bars, arts. Every place carries one, so nothing lands in the wrong drawer.
              </p>
              <div className={styles.featChips}>
                {MOODS.map((mood) => (
                  <span className={styles.featChip} key={mood.id}>
                    <i style={{ background: mood.color }} />
                    {mood.label}
                  </span>
                ))}
              </div>
            </div>

            <div className={styles.featHuntCard}>
              <span className={`${styles.eyebrow} ${styles.mono} ${styles.eyebrowFlush}`}>Scavenger hunts</span>
              <strong className={styles.featTitle}>Four free stops, clues when you need them</strong>
              <p className={styles.featHuntCopy}>Riddle first, three clues after. The last clue names the shop so the walk keeps moving.</p>
              <Link className={`${styles.btn} ${styles.btnSm} ${styles.btnPaper} ${styles.featCta}`} href="/calgary/hunt?type=friendly">
                Try the hunt<Arrow size={13} />
              </Link>
            </div>
          </div>

          <div className={styles.featSmalls} data-rise>
            {FEATURE_CARDS.map((card) => (
              <Link className={styles.featSmall} key={card.title} href={card.href}>
                <strong className={styles.featSmallTitle}>{card.title}</strong>
                <p className={styles.featSmallCopy}>{card.copy}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section} id="pricing">
        <div className={styles.sectionIn}>
          <div className={`${styles.head} ${styles.headTight}`} data-rise>
            <span className={`${styles.eyebrow} ${styles.mono}`}>Pricing</span>
            <h2 className={styles.h2}>Pick the size of the walk</h2>
            <p className={styles.lead}>Browsing the map is always free. Hunts are per team, and your first Full Hunt is on us.</p>
          </div>

          <div className={styles.priceGrid} data-rise>
            {PLANS.map((plan) => (
              <div className={`${styles.priceCard} ${plan.hot ? styles.priceHot : ""}`} key={plan.id}>
                <div>
                  <span className={styles.priceName}>
                    {plan.name}
                    {plan.flag && <span className={styles.priceFlag}>{plan.flag}</span>}
                  </span>
                  <span className={styles.priceAmt}>
                    {plan.price}
                    {plan.suffix && <small>{plan.suffix}</small>}
                  </span>
                </div>
                <ul className={styles.priceList}>
                  {plan.feats.map((feat) => (
                    <li key={feat}>
                      <span className={styles.priceTick}><Tick color={plan.hot ? "#fff" : "#767A82"} /></span>
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link className={`${styles.btn} ${styles.btnBlock} ${plan.hot ? styles.btnLime : styles.btnPaper}`} href={plan.href}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section} id="business">
        <div className={styles.bizBand} data-rise>
          <figure className={styles.bizFig}>
            <svg viewBox="0 0 600 450" preserveAspectRatio="xMidYMid slice" className={styles.figArt} aria-hidden>
              <rect width="600" height="450" fill="#CFDCFF" />
              <rect y="330" width="600" height="120" fill="#F6FBDA" />
              <rect x="24" y="150" width="150" height="180" rx="8" fill="#fff" />
              <rect x="192" y="110" width="170" height="220" rx="8" fill="#0B47E8" />
              <rect x="380" y="168" width="146" height="162" rx="8" fill="#F9BFD0" />
              <rect x="48" y="182" width="102" height="60" rx="5" fill="#DCF23C" />
              <rect x="216" y="146" width="122" height="70" rx="5" fill="#CFDCFF" opacity=".85" />
              <rect x="404" y="198" width="98" height="56" rx="5" fill="#fff" opacity=".9" />
              <rect x="80" y="268" width="38" height="62" rx="4" fill="#0736B8" />
              <rect x="256" y="248" width="42" height="82" rx="4" fill="#DCF23C" />
              <rect x="434" y="264" width="38" height="66" rx="4" fill="#0B47E8" />
              <circle cx="132" cy="372" r="16" fill="#0B47E8" />
              <circle cx="322" cy="382" r="20" fill="#14161A" opacity=".8" />
              <circle cx="486" cy="368" r="14" fill="#C2296B" />
            </svg>
          </figure>
          <div className={styles.bizCopy}>
            <span className={`${styles.eyebrow} ${styles.eyebrowLime} ${styles.mono}`}>For businesses</span>
            <h2 className={`${styles.h2} ${styles.bizH2}`}>Claim your doorway on the street</h2>
            <p className={styles.bizLead}>
              Owners keep their own hours, photos and description up to date, and can host a hunt stop at their door. Free while Inglewood is our first street.
            </p>
            <div className={styles.bizActions}>
              <Link className={`${styles.btn} ${styles.btnMd} ${styles.btnDark}`} href="/portal">Claim your shop<Arrow size={13} /></Link>
              <Link className={`${styles.btn} ${styles.btnMd} ${styles.btnBiz}`} href="/business">What owners get</Link>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.closeSection}>
        <div className={styles.closeBand} data-rise>
          <span className={styles.closeDeco} aria-hidden>
            <span className={styles.closeDecoBar} />
            <span className={styles.closeDecoDot} />
            <span className={styles.closeDecoDot} />
            <span className={styles.closeDecoDot} />
            <span className={styles.closeDecoDot} />
          </span>
          <div className={styles.closeInner}>
            <h2 className={styles.closeH2}>Explore more.<br /><span>Worry less.</span></h2>
            <p className={styles.closeLead}>Open the Calgary map, pick a mood, or start the free hunt right now. No account, no app.</p>
            <div className={styles.closeActions}>
              <Link className={`${styles.btn} ${styles.btnLime}`} href="/calgary">Explore the map<Arrow /></Link>
              <Link className={`${styles.btn} ${styles.btnOnBlue}`} href="/calgary/hunt?type=friendly">Start a free hunt</Link>
            </div>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footIn}>
          <span className={styles.brand}>
            {/* eslint-disable-next-line @next/next/no-img-element -- static export, same as the map app's rail logo */}
            <img className={`${styles.brandMark} ${styles.footMark}`} src="/brand/stroll-mark.png" alt="" width={22} height={22} />
            stroll.city
          </span>
          <span>Calgary · Inglewood first</span>
          <span className={styles.footLinks}>
            <Link href="/calgary/hunt?type=friendly">The hunt</Link>
            <Link href="/rules">Rules</Link>
            <Link href="/events">Events</Link>
            <Link href="/business">For businesses</Link>
            <Link href="/portal">Claim a listing</Link>
          </span>
          <p className={styles.footNote}>
            Geometry and licences come from City of Calgary open data. Basemap © OpenStreetMap contributors © CARTO.
          </p>
        </div>
      </footer>
    </main>
  );
}
