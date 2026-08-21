"use client";

import Link from "next/link";
import maplibregl from "maplibre-gl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getCity } from "./cities";
import type { Category } from "./StrollCityApp";
import styles from "./landing.module.css";

const city = getCity("calgary")!;

type Business = {
  id: string;
  name: string;
  address: string;
  category: Category;
  mono: string;
  lon: number;
  lat: number;
  blurb?: string;
  photo?: string;
  claim_status?: "unclaimed" | "pending" | "claimed" | "rejected";
};

/* The six moods, drawn from the brand board's accent set (the map app keeps its own
   earthier palette). Chips and pins pick dark or light ink per colour, so the lighter
   brand tones — gold, green, pink — stay legible without being muddied down. */
const MOODS: { id: Category; label: string; color: string }[] = [
  { id: "shop", label: "Shops", color: "#0B47E8" },        // cobalt — the brand blue
  { id: "restaurant", label: "Restaurants", color: "#EE6C43" }, // coral — "this weekend" / "local gem"
  { id: "services", label: "Studios", color: "#57C07A" },  // spring green — "bike routes"
  { id: "cafe", label: "Cafés", color: "#F5C93F" },        // gold — the sunburst
  { id: "bar", label: "Bars", color: "#8468E0" },          // lavender — "hikes"
  { id: "gallery", label: "Arts", color: "#F58AB4" },      // pink — the markets blob
];
const MOOD_COLOR = Object.fromEntries(MOODS.map((m) => [m.id, m.color])) as Record<Category, string>;
const MOOD_LABEL = Object.fromEntries(MOODS.map((m) => [m.id, m.label])) as Record<Category, string>;

/* Sample hunt shown on the page — four riddles, same shape as a real Friendly Mode run. */
const STOPS = [
  {
    tag: "Stop 1 · Riddle",
    text: "Black discs spin behind this window, and the owner still writes the price in pencil.",
    hint: "North side, two doors east of the coffee roaster.",
    shop: "Ninth & Ninth Records",
    tint: "#0B47E8",
  },
  {
    tag: "Stop 2 · Riddle",
    text: "The smell arrives before the sign does. Look for the tray in the window at four o’clock.",
    hint: "South side, mid-block, blue awning.",
    shop: "Sweet Nine Bakery",
    tint: "#F9BFD0",
  },
  {
    tag: "Stop 3 · Riddle",
    text: "Two chairs, one mirror, and a striped pole that hasn’t turned since 1974.",
    hint: "North side, next to the bike shop.",
    shop: "Fair Trim Barbers",
    tint: "#DCF23C",
  },
  {
    tag: "Stop 4 · Riddle",
    text: "The last door on the block keeps its lights low and its records loud.",
    hint: "South side, corner unit, unmarked door.",
    shop: "The Blackfoot Room",
    tint: "#FBE08A",
  },
];

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
    href: "#game",
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
    href: "#game",
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
    href: "#game",
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
    href: "#business",
  },
];

const FEATURE_CARDS = [
  { title: "Loop Race", copy: "Same eight stops, rotated starts, live leaderboard." },
  { title: "Event bookings", copy: "Birthdays, staff days, class trips, youth groups." },
  { title: "Claim your doorway", copy: "Owners update hours and photos in minutes." },
  { title: "Street by street", copy: "Inglewood first, then the next Calgary high street." },
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

/* Relative luminance — decides whether a lit mood chip takes dark or light ink. */
function isLight(hex: string) {
  const channel = [1, 3, 5].map((i) => {
    const s = parseInt(hex.slice(i, i + 2), 16) / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channel[0] + 0.7152 * channel[1] + 0.0722 * channel[2] > 0.4;
}

export default function LandingPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [active, setActive] = useState<Set<Category>>(new Set(MOODS.map((m) => m.id)));
  const [selected, setSelected] = useState<Business | null>(null);
  const [stop, setStop] = useState(0);
  /* Bumped on every map idle so the marker thinning re-runs against the new screen positions. */
  const [viewTick, setViewTick] = useState(0);

  const mapNode = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const fittedRef = useRef(false);

  useEffect(() => {
    fetch("/api/v1/calgary/businesses")
      .then((response) => response.json())
      .then((json) => setBusinesses(Array.isArray(json.data) ? json.data : []))
      .catch(() => {});
  }, []);

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
      const tone = MOOD_COLOR[b.category] ?? "#0B47E8";
      const glyph = document.createElement("span");
      glyph.className = styles.pinGlyph;
      glyph.style.background = tone;
      // Gold and pink pins need dark initials; cobalt and lavender need white ones.
      glyph.style.color = isLight(tone) ? "#14161A" : "#fff";
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

  /* ---------------- sample hunt ---------------- */
  const done = stop >= 4;
  const current = STOPS[Math.min(stop, 3)];
  const postTint = (i: number) => (i < stop ? STOPS[i].tint : "#F6E8ED");

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
          <a className={styles.navLink} href="#game">The hunt</a>
          <a className={styles.navLink} href="#features">Features</a>
          <a className={styles.navLink} href="#pricing">Pricing</a>
        </span>
        <span className={styles.navRight}>
          <a className={`${styles.navLink} ${styles.navGhost}`} href="#business">For businesses</a>
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
            <a className={`${styles.btn} ${styles.btnOutline}`} href="#game">Start a free hunt</a>
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
                  const dark = isLight(mood.color);
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

      <section className={styles.section} id="game">
        <div className={styles.sectionIn}>
          <div className={`${styles.head} ${styles.headNarrow}`} data-rise>
            <span className={`${styles.eyebrow} ${styles.eyebrowPink} ${styles.mono}`}>The hunter game</span>
            <h2 className={styles.h2}>A riddle. A doorway. Then the next riddle.</h2>
            <p className={styles.lead}>
              Nothing to print, nothing to carry. Work out which shop the riddle points at, walk there, take a photo at the door. Try it below.
            </p>
          </div>

          <div className={styles.huntGrid} data-rise>
            <div className={styles.huntPanel}>
              <div className={styles.huntHead}>
                <span className={`${styles.huntStep} ${styles.mono}`}>Friendly Mode · stop {done ? 4 : stop + 1} of 4</span>
                <span className={styles.punches}>
                  {[0, 1, 2, 3].map((i) => (
                    <span className={styles.punch} key={i} style={i < stop ? { background: STOPS[i].tint } : undefined} />
                  ))}
                </span>
              </div>

              <div className={styles.riddleCard}>
                <span className={styles.riddleTag}>{done ? "Hunt complete" : current.tag}</span>
                <p className={styles.riddleText}>
                  {done ? "Four doors, four photos. Your postcard is ready." : current.text}
                </p>
                <p className={styles.riddleHint}>
                  {done ? "Start over for a different four, or step up to the eight-stop Full Hunt." : current.hint}
                </p>
              </div>

              <div className={styles.huntActions}>
                <button type="button" className={`${styles.btn} ${styles.btnMd} ${styles.btnDark}`} onClick={() => setStop((s) => Math.min(s + 1, 4))}>
                  {done ? "See the postcard" : "Photo at the door"}
                  <Arrow />
                </button>
                <button type="button" className={`${styles.btn} ${styles.btnMd} ${styles.btnHuntGhost}`} onClick={() => setStop(0)}>Start over</button>
                <span className={styles.huntNote}>{done ? "All four stops punched" : `${4 - stop} stops to go`}</span>
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
                  <span className={`${styles.huntCapK} ${styles.mono}`}>Photo at the door</span>
                  <span className={styles.huntCapV}>{done ? "Ninth Avenue SE, Inglewood" : current.shop}</span>
                </figcaption>
              </figure>

              <div className={styles.postcard}>
                <strong className={styles.postcardTitle}>Postcard finish</strong>
                <p className={styles.postcardCopy}>At the last stop your photos become a postcard you can send or keep.</p>
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

            <div className={styles.featBlue}>
              <span className={`${styles.eyebrow} ${styles.mono} ${styles.eyebrowFlush}`}>Scavenger hunts</span>
              <strong className={styles.featTitle}>Four stops free, every time different</strong>
              <p className={styles.featBlueCopy}>The punch card fills itself in on screen. No printing, no staff to find.</p>
              <a className={`${styles.btn} ${styles.btnSm} ${styles.btnLime} ${styles.featCta}`} href="#game">
                Try the hunt<Arrow size={13} />
              </a>
            </div>
          </div>

          <div className={styles.featSmalls} data-rise>
            {FEATURE_CARDS.map((card) => (
              <div className={styles.featSmall} key={card.title}>
                <strong className={styles.featSmallTitle}>{card.title}</strong>
                <p className={styles.featSmallCopy}>{card.copy}</p>
              </div>
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
                <a className={`${styles.btn} ${styles.btnBlock} ${plan.hot ? styles.btnLime : styles.btnPaper}`} href={plan.href}>
                  {plan.cta}
                </a>
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
              <Link className={`${styles.btn} ${styles.btnMd} ${styles.btnBiz}`} href="/calgary">See the map</Link>
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
              <a className={`${styles.btn} ${styles.btnOnBlue}`} href="#game">Start a free hunt</a>
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
            <a href="#game">The hunt</a>
            <a href="#pricing">Pricing</a>
            <a href="#business">For businesses</a>
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
