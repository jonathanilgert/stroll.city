"use client";

import Link from "next/link";
import maplibregl from "maplibre-gl";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
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

type Hunt = {
  slug: string;
  name: string;
  stop_ids: string[];
  mode?: string;
};

type HuntStop = {
  id: string;
  name: string;
  riddle: string;
  clue_1?: string;
  clue_2?: string;
  clue_3?: string;
  challenge?: string;
  difficulty: string;
};

type StrollData = {
  businesses: Business[];
  huntStops?: HuntStop[];
  hunts?: Hunt[];
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

/* The punch dots keep one tint per stop; the front-page postcard marks use
   the four numbered proof-photo examples Jonathan supplied. */
const STOP_TINTS = ["#0B47E8", "#F9BFD0", "#DCF23C", "#FBE08A"];
const POSTCARD_STAMPS = [
  { src: "/brand/hunt-postcard/02-ironwood-stage-and-grill.jpg", alt: "Ironwood Stage and Grill postcard photo", static: true },
  { src: "/brand/hunt-postcard/03-kent-of-inglewood.jpeg", alt: "Kent of Inglewood postcard photo", static: true },
  { src: "/brand/hunt-postcard/01-fairs-fair-books.jpeg", alt: "Fair's Fair Books postcard photo", static: false },
  { src: "/brand/hunt-postcard/04-doughnut-party.jpeg", alt: "Doughnut Party postcard photo", static: false },
];

const CLUE_BUTTON_LABELS = ["Give me a clue", "One more", "Just tell me"];
const CLUE_SUBLABEL = "Three clues per stop";
const CLUE_DONE_LINE = "Every stop has the same three. You can’t get properly lost.";
const HOMEPAGE_HUNT_START_INDEX = 2;

function answerOptions(name: string) {
  const withoutParenthetical = name.replace(/\s*\([^)]*\)/g, "").trim();
  const variants = new Set([name, withoutParenthetical]);
  variants.forEach((variant) => {
    variants.add(variant.replace(/[’']/g, ""));
    variants.add(variant.replace(/\b\(The\)|\bThe\b/gi, "").trim());
  });
  return Array.from(variants).filter(Boolean);
}

function stopCounterText(stopIndex: number, total: number) {
  const remaining = total - stopIndex - 1;
  if (remaining >= 3) return "Three more stops, then a postcard.";
  if (remaining === 2) return "Two more stops, then a postcard.";
  if (remaining === 1) return "One more stop, then a postcard.";
  return "Last stop — then the postcard.";
}

function cluesForStop(stop: HuntStop | null) {
  if (!stop) return [];
  return [stop.clue_1, stop.clue_2, stop.clue_3].filter(Boolean) as string[];
}

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

function normalizeGuess(value: string) {
  return value
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(the|a|an|and)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isCloseGuess(guess: string, answers: string[]) {
  const normalizedGuess = normalizeGuess(guess);
  if (!normalizedGuess) return false;
  return answers.some((answer) => {
    const normalizedAnswer = normalizeGuess(answer);
    return normalizedGuess === normalizedAnswer || normalizedGuess.includes(normalizedAnswer) || normalizedAnswer.includes(normalizedGuess);
  });
}

export default function LandingPage() {
  const [data, setData] = useState<StrollData | null>(null);
  const [active, setActive] = useState<Set<Category>>(new Set(MOODS.map((m) => m.id)));
  const [selected, setSelected] = useState<Business | null>(null);
  const [stop, setStop] = useState(HOMEPAGE_HUNT_START_INDEX);
  const [cluesOpen, setCluesOpen] = useState(0);
  const [answerText, setAnswerText] = useState("");
  const [answerStatus, setAnswerStatus] = useState<"idle" | "wrong" | "correct">("idle");
  const [shareOpen, setShareOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
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
  const visible = useMemo(() => businesses.filter((b) => active.has(b.category)), [businesses, active]);
  const litCount = visible.length;

  const marquee = useMemo(() => {
    const names = businesses.slice(0, 22).map((b) => b.name);
    return names.length ? names.concat(names) : [];
  }, [businesses]);

  const huntStopsById = useMemo(() => new Map((data?.huntStops ?? []).map((item) => [item.id, item])), [data]);
  const friendlyHunt = useMemo(() => data?.hunts?.find((hunt) => hunt.mode === "friendly") ?? data?.hunts?.[0], [data]);
  const homepageRiddles = useMemo(() => (friendlyHunt?.stop_ids ?? [])
    .map((id) => huntStopsById.get(id))
    .filter(Boolean)
    .slice(0, 4) as HuntStop[], [friendlyHunt, huntStopsById]);
  const huntDone = homepageRiddles.length > 0 && stop >= homepageRiddles.length;
  const currentStop = homepageRiddles[Math.min(stop, Math.max(homepageRiddles.length - 1, 0))] ?? null;
  const clueLadder = cluesForStop(currentStop);

  useEffect(() => {
    if (!showConfetti) return;
    const timer = window.setTimeout(() => setShowConfetti(false), 1900);
    return () => window.clearTimeout(timer);
  }, [showConfetti]);

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

  const goNextRiddle = () => {
    setStop((s) => {
      const next = Math.min(s + 1, homepageRiddles.length);
      if (next >= homepageRiddles.length && s < homepageRiddles.length) {
        setShowConfetti(true);
        setShareOpen(true);
      }
      return next;
    });
    setCluesOpen(0);
    setAnswerText("");
    setAnswerStatus("idle");
  };

  const revealHomeClue = () => {
    if (!currentStop) return;
    setCluesOpen((n) => Math.min(3, n + 1));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("stroll:analytics", { detail: { event: "clue_revealed", surface: "home_demo", stop_index: stop, clue_index: Math.min(3, cluesOpen + 1) } }));
    }
  };

  const submitGuess = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentStop || huntDone) return;
    if (isCloseGuess(answerText, answerOptions(currentStop.name))) {
      setAnswerStatus("correct");
      return;
    }
    setAnswerStatus("wrong");
  };

  return (
    <main className={styles.landing}>
      {showConfetti && (
        <div className={styles.confettiBurst} aria-hidden>
          {Array.from({ length: 34 }).map((_, i) => <span key={i} style={{ "--i": i } as CSSProperties} />)}
        </div>
      )}
      <nav className={styles.nav}>
        <a className={styles.brand} href="#top">
          {/* eslint-disable-next-line @next/next/no-img-element -- static export, same as the map app's rail logo */}
          <img className={styles.brandMark} src="/brand/stroll-mark.png" alt="" width={26} height={26} />
          stroll.city
        </a>
        <span className={styles.navLinks}>
          <a className={styles.navLink} href="#value">Why stroll</a>
          <a className={styles.navLink} href="#hunt">The hunt</a>
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
            Inglewood, Calgary is live
          </span>
          <h1 className={styles.h1} data-rise>Stroll the strip like never before.</h1>
          <p className={styles.heroSub} data-rise>
            Ready for some casual adventure? Start a riddle hunt and go find the Inglewood doors you&apos;ve walked past a hundred times — or just scroll your stroll and see what the street&apos;s got, whatever you&apos;re in the mood for.
          </p>
          <div className={styles.heroCta} data-rise>
            <a className={`${styles.btn} ${styles.btnBlue}`} href="#hunt">Start a riddle hunt<Arrow /></a>
            <Link className={`${styles.btn} ${styles.btnOutline}`} href="/calgary">Explore the map</Link>
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
                {litCount ? "Drag to pan · tap a doorway" : "Loading Inglewood…"}
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
              <strong className={styles.valueTitle}>Scroll your stroll.</strong>
              <p className={styles.valueCopy}>Pick a mood and see what’s open right now.</p>
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
            <p className={styles.leadVerse}>Read the riddle, guess where to look,<br />stroll on over, snap your picture,<br />then on to the next — and look what you took.</p>
            <p className={styles.lead}>Can&apos;t crack one? Ask for a clue or two. The last clue names the shop outright, so nobody&apos;s left stranded on the sidewalk. Give it a shot and see how you do.</p>
          </div>

          <div className={styles.huntGrid} data-rise>
            <div className={styles.huntPanel}>
              <div className={styles.huntHead}>
                <span className={`${styles.huntStep} ${styles.mono}`}>
                  Friendly Mode · stop {huntDone ? homepageRiddles.length : stop + 1} of {homepageRiddles.length || 4}
                </span>
                <span className={styles.punches}>
                  {POSTCARD_STAMPS.map((_, i) => (
                    <span className={styles.punch} key={i} style={i < Math.min(POSTCARD_STAMPS.length, Math.max(0, stop)) ? { background: STOP_TINTS[i] } : undefined} />
                  ))}
                </span>
              </div>

              <div className={styles.riddleCard}>
                <span className={styles.riddleTag}>
                  {huntDone ? "Postcard complete" : `Stop ${stop + 1} · ${currentStop?.difficulty ?? "easy"}`}
                </span>
                <p className={`${styles.riddleText} ${styles.riddleVerse}`}>
                  {huntDone
                    ? "Four neighbourhood moments, one finished Inglewood postcard."
                    : currentStop?.riddle ?? "Loading the first riddle…"}
                </p>
                {!huntDone && answerStatus === "correct" && currentStop?.challenge && (
                  <p className={styles.riddleChallenge}><b>Correct — photo to take:</b> {currentStop.challenge}</p>
                )}
                {huntDone ? (
                  <p className={styles.riddleHint}>Nice. The postcard is ready to share — and sharing is what enters the monthly Inglewood Basket draw.</p>
                ) : (
                  <div className={styles.locked}>
                    {clueLadder.slice(0, cluesOpen).map((clue, index) => (
                      <div className={styles.callout} key={`${currentStop.id}-clue-${index}`}><b>Clue {index + 1}</b> {clue}</div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.huntActions}>
                {huntDone ? (
                  <button type="button" className={`${styles.btn} ${styles.btnMd} ${styles.btnBlue}`} onClick={() => setShareOpen((open) => !open)}>
                    Share postcard<Arrow size={13} />
                  </button>
                ) : (
                  <>
                    {answerStatus === "correct" ? (
                      <button type="button" className={`${styles.btn} ${styles.btnMd} ${styles.btnBlue}`} onClick={goNextRiddle}>
                        Photo taken — next stop<Arrow size={13} />
                      </button>
                    ) : cluesOpen >= 3 ? (
                      <span className={styles.huntNote}>{CLUE_DONE_LINE}</span>
                    ) : (
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnMd} ${styles.btnDark}`}
                        onClick={revealHomeClue}
                        aria-expanded={cluesOpen > 0}
                      >
                        {CLUE_BUTTON_LABELS[cluesOpen]}<Arrow />
                        {cluesOpen === 0 && <small>{CLUE_SUBLABEL}</small>}
                      </button>
                    )}
                    {answerStatus !== "correct" && <form className={styles.answerForm} onSubmit={submitGuess}>
                      <label className={styles.answerLabel} htmlFor="homepage-hunt-answer">Your guess</label>
                      <input
                        id="homepage-hunt-answer"
                        className={styles.answerInput}
                        value={answerText}
                        onChange={(event) => { setAnswerText(event.target.value); setAnswerStatus("idle"); }}
                        placeholder="Type your answer"
                        autoComplete="off"
                      />
                      <button type="submit" className={styles.answerSubmit}>Check your guess</button>
                      {answerStatus === "wrong" && <span className={styles.answerHelp}>Close, but not quite. Try another wording or open the next clue.</span>}
                    </form>}
                  </>
                )}
                <button type="button" className={`${styles.btn} ${styles.btnMd} ${styles.btnHuntGhost}`} onClick={() => { setStop(HOMEPAGE_HUNT_START_INDEX); setCluesOpen(0); setAnswerText(""); setAnswerStatus("idle"); setShareOpen(false); }}>Start over</button>
                <span className={styles.huntNote}>
                  {huntDone ? "Postcard completed" : stopCounterText(stop, homepageRiddles.length || 4)}
                </span>
              </div>
            </div>

            <div className={styles.huntSide}>
              <figure className={`${styles.huntMemento} ${huntDone ? styles.huntMementoDone : ""}`}>
                <div className={styles.miniPunch}>
                  <div className={styles.miniStub}>
                    <span className={styles.miniWalk}>↟</span>
                    <span className={`${styles.miniStubText} ${styles.mono}`}>INGLEWOOD</span>
                  </div>
                  <div className={styles.miniPunchBody}>
                    <div className={styles.miniPunchTop}>
                      <span className={`${styles.mementoKicker} ${styles.mono}`}>{huntDone ? "Postcard ready" : "Postcard in progress"}</span>
                      <span className={`${styles.miniCode} ${styles.mono}`}>No. 004</span>
                    </div>
                    <strong>{huntDone ? "Your Inglewood postcard is complete." : stop < 3 ? "Solve this stop and the third postcard mark fills in." : "One last stop finishes it."}</strong>
                    <div className={styles.mementoGrid} aria-label="Postcard photos earned so far">
                      {POSTCARD_STAMPS.map((mark, i) => {
                        const found = i < 2 || i < stop;
                        return (
                          <span key={mark.src} className={found ? styles.stampFilled : undefined}>
                            {found ? <img src={mark.src} alt={mark.alt} /> : <i>{i + 1}</i>}
                          </span>
                        );
                      })}
                    </div>
                    <p>{huntDone ? "Post it with #StrollInglewood to enter the draw for the Inglewood Basket: ten Inglewood shops, one thing each, worth around $250 all together." : stop < 3 ? "The Fair’s Fair photo slot fills in after this riddle is completed." : "Doughnut Party is the last stamp in this example."}</p>
                  </div>
                </div>
              </figure>

              {huntDone && (
                <div className={styles.shareCard}>
                  <span className={`${styles.mementoKicker} ${styles.mono}`}>Inglewood Basket draw</span>
                  <strong className={styles.postcardTitle}>The finish</strong>
                  <p className={styles.postcardCopy}>Your four photos land on a postcard, postmarked Inglewood. Keep it, send it to whoever said there was nothing to do today — or post it with <b>#StrollInglewood</b> to enter the draw for the Inglewood Basket: ten Inglewood shops, one thing each, worth around $250 all together.</p>
                  <div className={styles.socialLinks} aria-label="Social posting links">
                    <a href="https://www.instagram.com/" target="_blank" rel="noreferrer">Open Instagram<Arrow size={12} /></a>
                    <a href="https://www.facebook.com/" target="_blank" rel="noreferrer">Open Facebook<Arrow size={12} /></a>
                    <a href="https://www.threads.net/" target="_blank" rel="noreferrer">Open Threads<Arrow size={12} /></a>
                  </div>
                  <button type="button" className={`${styles.btn} ${styles.btnMd} ${styles.btnBlue}`} onClick={() => setShareOpen((open) => !open)}>
                    Share steps<Arrow size={13} />
                  </button>
                  {shareOpen && (
                    <div className={styles.shareSteps}>
                      <b>Instagram share steps</b>
                      <ol>
                        <li>Save or screenshot the completed postcard.</li>
                        <li>Post it to your story or feed.</li>
                        <li>Tag <span>@stroll_city</span> and add <span>#StrollInglewood</span>.</li>
                      </ol>
                      <Link className={styles.pickedLink} href="/rules">Basket rules<Arrow size={12} /></Link>
                    </div>
                  )}
                </div>
              )}
            </div>
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
              <a className={`${styles.btn} ${styles.btnOnBlue}`} href="#hunt">Start a free hunt</a>
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
            <a href="#hunt">The hunt</a>
            <Link href="/rules">Rules</Link>
            <Link href="/events">Events</Link>
            <Link href="/business">For businesses</Link>
          </span>
          <p className={styles.footNote}>
            Geometry and licences come from City of Calgary open data. Basemap © OpenStreetMap contributors © CARTO.
          </p>
        </div>
      </footer>
    </main>
  );
}
