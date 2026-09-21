"use client";

import Link from "next/link";
import maplibregl from "maplibre-gl";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { getCity, isLightHex } from "./cities";
import { categoryColor, type Category } from "./StrollCityApp";
import styles from "./landing.module.css";

const city = getCity("calgary")!;
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const OPENFREEMAP_POSITRON_STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

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
/* Copied from [city]/hunt/[session]/HuntGame.tsx so the demo card tints exactly
   like the real stop it is standing in for. */
const HUNT_TINTS = [
  { bg: "#E9EFFF", border: "#CBD9FF", ink: "#0B47E8" },
  { bg: "#FDEDF3", border: "#F7DBE5", ink: "#A3376A" },
  { bg: "#EDF5E9", border: "#D8E8D0", ink: "#3D6B2A" },
  { bg: "#FDF6E4", border: "#F5E7C0", ink: "#8A6410" },
];
const POSTCARD_STAMPS = [
  { src: "/brand/hunt-postcard/02-ironwood-stage-and-grill.jpg", alt: "Ironwood Stage and Grill postcard photo", static: true },
  { src: "/brand/hunt-postcard/03-kent-of-inglewood.jpeg", alt: "Kent of Inglewood postcard photo", static: true },
  { src: "/brand/hunt-postcard/01-fairs-fair-books.jpeg", alt: "Fair's Fair Books postcard photo", static: false },
  { src: "/brand/hunt-postcard/04-doughnut-party.jpeg", alt: "Doughnut Party postcard photo", static: false },
];

const CLUE_BUTTON_LABELS = ["Give me a clue", "One more", "Final hint"];
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
  const clues = [stop.clue_1, stop.clue_2, stop.clue_3].filter(Boolean) as string[];
  return clues.map((clue, index) => {
    if (index !== 2) return clue;
    if (/Fair's Fair/i.test(clue)) return "Look for the used bookstore on the river-end block. Type the name you find on the door once you’re sure.";
    if (/Doughnut Party/i.test(clue)) return "Look for the bright doughnut shop on 9 Ave SE. Type the name you find on the door once you’re sure.";
    return clue;
  });
}

async function imageToDataUrl(src: string) {
  const response = await fetch(src);
  if (!response.ok) throw new Error(`Could not load ${src}`);
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read image"));
    reader.readAsDataURL(blob);
  });
}

const PLANS = [
  {
    id: "friendly",
    name: "Friendly Mode",
    price: "Free",
    suffix: "",
    note: "",
    flag: "",
    hot: false,
    feats: ["4 stops, always", "No account, no card", "Postcard finish"],
    cta: "Start now",
    href: "/calgary/hunt/start?type=friendly",
  },
  {
    id: "full",
    name: "Full Hunt",
    price: "$20",
    suffix: " /team",
    note: "",
    flag: "First one free",
    hot: true,
    feats: ["8 stops", "Something waiting at the last one", "Postcard finish"],
    cta: "Start a hunt",
    href: "/calgary/hunt/start?type=full",
  },
  {
    id: "loop",
    name: "Loop Race",
    price: "$15",
    suffix: " /team",
    note: "2 teams and up",
    flag: "",
    hot: false,
    feats: ["8 stops", "Rotated starts", "Live leaderboard"],
    cta: "Set up a race",
    href: "/calgary/hunt/race/new",
  },
];

/* The four steps of a real hunt, in the order they happen. Written from the
   flow in /[city]/hunt — onboarding, riddle, photo gate, postcard — so the page
   cannot drift away from what the app does. */
const HOW_STEPS = [
  {
    title: "Pick your walk",
    copy: "Solo, one team or a big group split into teams. Choose a mood — date night, shop crawl, eat your way down — and we pull the stops that fit it.",
  },
  {
    title: "Read the riddle",
    copy: "Each stop is a verse about a real Inglewood doorway. Stuck? Open a clue. The third clue names the shop outright, so nobody ends up stranded on the sidewalk.",
  },
  {
    title: "Find it, snap it",
    copy: "Walk over, type the answer, then take a photo at the door. The photo is the proof — a stop is not done until both are in.",
  },
  {
    title: "Finish with a postcard",
    copy: "Your photos land on one Inglewood postcard, postmarked and numbered. Save it, send it, or post it to enter the monthly basket draw.",
  },
];

const HUNT_FACTS = [
  { k: "60–90 minutes", v: "Four stops in about an hour, eight in an afternoon.", icon: "clock" },
  { k: "About 2 km, flat", v: "One walkable loop along 9th Avenue SE. Stroller and wheelchair friendly sidewalks.", icon: "route" },
  { k: "Nothing to install", v: "It runs in the browser on any phone. No account, no download.", icon: "phone" },
  { k: "Go at your own pace", v: "Stop for a coffee mid-hunt. Your punch card waits — close the tab and come back to the same link.", icon: "pause" },
];

/* Occasion → the hunt theme it maps to in hunt-themes.ts, so a click lands on a
   pre-picked mood rather than the generic start screen. */
const OCCASIONS = [
  { who: "Two of you", title: "Date night", copy: "Wine bars, small plates and a gallery to argue about on the way home.", theme: "date-night", tone: "var(--pink-ink-2)" },
  { who: "Friends in town", title: "Showing someone Calgary", copy: "Better than a restaurant list. They meet the street instead of reading about it.", theme: "with-friends", tone: "var(--blue)" },
  { who: "Weekend, kids welcome", title: "Family afternoon", copy: "Shops, bakeries and makers only — the age-restricted doors are left out.", theme: "shop-crawl", tone: "var(--lime-ink)" },
  { who: "Hungry", title: "Eat your way down", copy: "Bakeries, counters and coffee, roughly in that order. Bring an appetite.", theme: "eat-drink", tone: "var(--amber-ink)" },
  { who: "8 to 60 people", title: "Team offsite", copy: "Split into teams, rotated starts so nobody queues, one live leaderboard.", theme: "classic", tone: "var(--ink)", href: "/events" },
  { who: "Birthdays, stags, hens", title: "The group thing", copy: "Name every team, each gets its own punch card, all of them finish on one postcard.", theme: "with-friends", tone: "var(--pink-ink)", href: "/events" },
];

const FAQS = [
  {
    q: "Do I need to download an app?",
    a: "No. The whole hunt runs in your phone's browser. There is no account to make and nothing to install — open the link and start walking.",
  },
  {
    q: "How long does it take?",
    a: "The free Friendly Mode is four stops, about 45–60 minutes at a stroll. The Full Hunt is eight stops and usually fills an afternoon. There is no timer forcing you along.",
  },
  {
    q: "What if we cannot solve a riddle?",
    a: "Every stop has three clues you can open whenever you like. The third one names the place outright, so you can always move on. Using clues does not lock you out of anything.",
  },
  {
    q: "Is it really free?",
    a: "Browsing the map is always free, and so is Friendly Mode. Your first Full Hunt is on us too. After that it is $20 a team — not per person.",
  },
  {
    q: "How does it work for a big group?",
    a: "Pick the large-group option, name each team, and every team gets its own link and punch card. Loop Race rotates where each team starts so twelve people are not standing at the same door.",
  },
  {
    q: "Do I have to give you my location?",
    a: "It helps — the map shows where you are on the street — but it is optional. You can play the whole hunt by reading the riddles and looking around. Answers are typed, not GPS-checked.",
  },
  {
    q: "What happens to my photos?",
    a: "They go on your postcard. We do not post anything for you and we do not sell them. Sharing on Instagram is your call, and only matters if you want to enter the basket draw.",
  },
  {
    q: "Where does the map data come from?",
    a: "Building footprints, streets and business licences come from City of Calgary open data, with the basemap from OpenStreetMap. The riddles are written by us, door by door.",
  },
  {
    q: "What if it rains, or a shop is closed?",
    a: "The stops are doorways, not appointments — you can photograph a closed shopfront just fine. Your punch card keeps its place if you want to finish another day.",
  },
  {
    q: "Which neighbourhoods can I play?",
    a: "Inglewood is live now, along 9th Avenue SE. More of Calgary is being drawn — one street at a time, properly, rather than all at once badly.",
  },
];

function FactIcon({ name }: { name: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" aria-hidden className={styles.factIcon}>
      {name === "clock" && <><circle cx="10" cy="10" r="7" {...common} /><path d="M10 5.8V10l2.8 1.8" {...common} /></>}
      {name === "route" && <><circle cx="5.4" cy="5.4" r="2.2" {...common} /><circle cx="14.6" cy="14.6" r="2.2" {...common} /><path d="M7.6 5.4h4.2a2.8 2.8 0 0 1 0 5.6H8.2a2.8 2.8 0 0 0 0 5.6h.3" {...common} /></>}
      {name === "phone" && <><rect x="6" y="2.6" width="8" height="14.8" rx="2" {...common} /><path d="M9 4.8h2" {...common} /></>}
      {name === "pause" && <><circle cx="10" cy="10" r="7" {...common} /><path d="M8.4 7.6v4.8M11.6 7.6v4.8" {...common} /></>}
    </svg>
  );
}

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
  const [photoStepDone, setPhotoStepDone] = useState(false);
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

  const huntStopsById = useMemo(() => new Map((data?.huntStops ?? []).map((item) => [item.id, item])), [data]);
  const friendlyHunt = useMemo(() => data?.hunts?.find((hunt) => hunt.mode === "friendly") ?? data?.hunts?.[0], [data]);
  const homepageRiddles = useMemo(() => (friendlyHunt?.stop_ids ?? [])
    .map((id) => huntStopsById.get(id))
    .filter(Boolean)
    .slice(0, 4) as HuntStop[], [friendlyHunt, huntStopsById]);
  const huntDone = homepageRiddles.length > 0 && stop >= homepageRiddles.length;
  const currentStop = homepageRiddles[Math.min(stop, Math.max(homepageRiddles.length - 1, 0))] ?? null;
  const clueLadder = cluesForStop(currentStop);
  const tint = HUNT_TINTS[stop % HUNT_TINTS.length];

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
      /* CARTO's free raster tiles now stamp "API KEY REQUIRED" across every zoom,
         so the hero map was serving a watermarked basemap. The map app already
         moved to OpenFreeMap's Positron; the landing follows it. */
      style: OPENFREEMAP_POSITRON_STYLE_URL,
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
    setPhotoStepDone(false);
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
      setPhotoStepDone(false);
      return;
    }
    setAnswerStatus("wrong");
  };

  const downloadDemoPostcard = async () => {
    if (!huntDone || typeof window === "undefined") return;
    const images = await Promise.all(POSTCARD_STAMPS.map((stamp) => imageToDataUrl(stamp.src)));

    /* The same card players are handed at the end of a real hunt — dashed spine,
       vertical postmark, serial, a slot per stop with its FOUND stamp. The front
       page used to offer a different souvenir entirely: a "Greetings from
       Inglewood" card in the pre-rebrand browns, with all four photos piled into
       one corner on top of the wordmark. */
    const left = 168;
    const right = 1120;
    const top = 268;
    const bottom = 604;
    const gap = 20;
    const slotW = (right - left - gap * 3) / 4;
    const slotH = bottom - top;

    const slots = images.map((src, index) => {
      const x = left + index * (slotW + gap);
      const pillW = 96;
      const pillX = x + slotW / 2 - pillW / 2;
      const pillY = bottom - 46;
      return `<g>
        <clipPath id="slot${index}"><rect x="${x.toFixed(1)}" y="${top}" width="${slotW.toFixed(1)}" height="${slotH}" rx="12"/></clipPath>
        <image href="${src}" x="${x.toFixed(1)}" y="${top}" width="${slotW.toFixed(1)}" height="${slotH}" preserveAspectRatio="xMidYMid slice" clip-path="url(#slot${index})"/>
        <rect x="${x.toFixed(1)}" y="${top}" width="${slotW.toFixed(1)}" height="${slotH}" rx="12" fill="none" stroke="#0B47E8" stroke-width="2"/>
        <rect x="${pillX.toFixed(1)}" y="${pillY}" width="${pillW}" height="30" rx="15" fill="#ffffff" fill-opacity=".95" stroke="#0B47E8" stroke-width="2"/>
        <text x="${(x + slotW / 2).toFixed(1)}" y="${pillY + 20}" font-family="ui-monospace, Menlo, monospace" font-size="13" letter-spacing="2.5" fill="#0B47E8" text-anchor="middle">FOUND</text>
      </g>`;
    }).join("");

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
      <rect width="1200" height="800" fill="#F3F1E9"/>
      <rect x="40" y="40" width="1120" height="720" rx="44" fill="#FAF9F4" stroke="#E4E2D8" stroke-width="3"/>
      <line x1="120" y1="96" x2="120" y2="704" stroke="#DFDDD2" stroke-width="2" stroke-dasharray="6 10"/>
      <text transform="translate(96 640) rotate(-90)" font-family="ui-monospace, Menlo, monospace" font-size="20" letter-spacing="7" fill="#8A8E96">INGLEWOOD</text>
      <text x="${left}" y="140" font-family="ui-monospace, Menlo, monospace" font-size="21" letter-spacing="6" fill="#767A82">POSTCARD COMPLETE</text>
      <text x="1112" y="140" font-family="ui-monospace, Menlo, monospace" font-size="21" fill="#767A82" text-anchor="end">No. 004</text>
      <text x="${left}" y="214" font-family="Helvetica, Arial, sans-serif" font-size="50" font-weight="600" fill="#14161A">Four doors, four photos.</text>
      ${slots}
      <text x="${left}" y="668" font-family="Helvetica, Arial, sans-serif" font-size="26" fill="#6B6F77">4 of 4 stops photographed in Inglewood</text>
      <text x="${left}" y="712" font-family="ui-monospace, Menlo, monospace" font-size="22" fill="#8A8E96">stroll.city · #StrollInglewood</text>
    </svg>`;

    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "stroll-city-inglewood-postcard.svg";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 500);
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
          <a className={styles.navLink} href="#how">How it works</a>
          <a className={styles.navLink} href="#hunt">The hunt</a>
          <a className={styles.navLink} href="#pricing">Pricing</a>
          <a className={styles.navLink} href="#faq">FAQ</a>
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

          {/* Counted from the shipped dataset, not rounded up for effect. */}
          <div className={styles.proofStrip} data-rise>
            <div className={styles.proofCell}>
              <b className={styles.proofN}>162</b>
              <span className={styles.proofLabel}>doors drawn on their real buildings</span>
            </div>
            <div className={styles.proofCell}>
              <b className={styles.proofN}>112</b>
              <span className={styles.proofLabel}>riddles written, one per doorway</span>
            </div>
            <div className={styles.proofCell}>
              <b className={styles.proofN}>6</b>
              <span className={styles.proofLabel}>moods, from date night to shop crawl</span>
            </div>
            <div className={styles.proofCell}>
              <b className={styles.proofN}>$0</b>
              <span className={styles.proofLabel}>to browse the map and play your first hunt</span>
            </div>
          </div>
        </div>

      </section>

      <section className={`${styles.section} ${styles.exploreSection}`} id="value">
        <div className={`${styles.sectionIn} ${styles.exploreGrid}`}>
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

          <div className={styles.exploreCopy} data-rise>
            <div className={`${styles.head} ${styles.headWide}`}>
              <span className={`${styles.eyebrow} ${styles.mono}`}>Why stroll.city</span>
              <h2 className={styles.h2}>Search engines list places. We draw the street.</h2>
              <p className={styles.lead}>
                A map of a shopping street should tell you what it feels like to stand on it — which side has the cafés, how far the next block really is, what’s behind the door you keep walking past.
              </p>
            </div>
            <div className={styles.valueGrid}>
              <div className={styles.valueCard}>
                <span className={styles.valueIcon} style={{ background: "#E4EBFF" }}>
                  <svg width="17" height="17" viewBox="0 0 20 20" aria-hidden>
                    <rect x="2.6" y="6.4" width="6" height="11" rx="1.4" fill="none" stroke="#0B47E8" strokeWidth="1.5" />
                    <rect x="11.4" y="3.4" width="6" height="14" rx="1.4" fill="none" stroke="#0B47E8" strokeWidth="1.5" />
                  </svg>
                </span>
                <strong className={styles.valueTitle}>Real building footprints</strong>
                <p className={styles.valueCopy}>Each shop sits on the building it actually occupies.</p>
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
                <p className={styles.valueCopy}>You decide the walk. The map stays out of the way.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works — the questions people ask before committing an afternoon,
          answered before they reach the demo rather than after it. */}
      <section className={`${styles.section} ${styles.howSection}`} id="how">
        <div className={styles.sectionIn}>
          <div className={`${styles.head} ${styles.headNarrow}`} data-rise>
            <span className={`${styles.eyebrow} ${styles.mono}`}>How it works</span>
            <h2 className={styles.h2}>A walk with something to solve.</h2>
            <p className={styles.lead}>
              stroll.city is a map of one shopping street and a riddle hunt that sends you down it. No tour guide, no timer, no route telling you where to turn — just four or eight doorways to work out, and a postcard at the end with your own photos on it.
            </p>
          </div>

          <div className={styles.howGrid} data-rise>
            {HOW_STEPS.map((step, i) => (
              <div className={styles.howCard} key={step.title}>
                <span className={styles.howNum}>{i + 1}</span>
                <strong className={styles.howTitle}>{step.title}</strong>
                <p className={styles.howCopy}>{step.copy}</p>
              </div>
            ))}
          </div>

          <div className={styles.factRow} data-rise>
            {HUNT_FACTS.map((fact) => (
              <div className={styles.factCell} key={fact.k}>
                <FactIcon name={fact.icon} />
                <span>
                  <b className={styles.factK}>{fact.k}</b>
                  <span className={styles.factV}>{fact.v}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.huntSection}`} id="hunt">
        <div className={`${styles.sectionIn} ${styles.huntSectionIn}`}>
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

              {/* Lifted from the game screen: same tinted card, same dashed head,
                  same notch, same clue chips. The demo should look like the thing
                  it is demonstrating. */}
              <div className={styles.riddleCard} style={{ background: tint.bg, borderColor: tint.border }}>
                <div className={styles.riddleCardHead} style={{ borderColor: tint.border }}>
                  <button
                    type="button"
                    className={styles.riddleNav}
                    style={{ borderColor: tint.border }}
                    onClick={() => { setStop((n) => Math.max(HOMEPAGE_HUNT_START_INDEX, n - 1)); setCluesOpen(0); setAnswerText(""); setAnswerStatus("idle"); setPhotoStepDone(false); }}
                    disabled={huntDone || stop <= HOMEPAGE_HUNT_START_INDEX}
                    aria-label="Previous stop"
                  >
                    <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden><path d="M10 3.5 5.5 8 10 12.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                  <span className={`${styles.riddleKicker} ${styles.mono}`} style={{ color: tint.ink }}>
                    {huntDone ? "Postcard complete" : `Stop ${stop + 1} · ${answerStatus === "correct" ? "Solved" : "Riddle"}`}
                  </span>
                  <button
                    type="button"
                    className={styles.riddleNav}
                    style={{ borderColor: tint.border }}
                    disabled
                    aria-label="Next stop, locked until this one is solved"
                  >
                    <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden><path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                </div>

                <div className={styles.riddleCardBody}>
                  <p className={`${styles.riddleText} ${styles.riddleVerse}`}>
                    {huntDone
                      ? "Four neighbourhood moments, one finished Inglewood postcard."
                      : currentStop?.riddle ?? "Loading the first riddle…"}
                  </p>

                  {huntDone ? (
                    <p className={styles.riddleHint}>Nice. The postcard is ready to share — and sharing is what enters the monthly Inglewood Basket draw.</p>
                  ) : (
                    <div className={styles.locked} aria-live="polite">
                      {clueLadder.slice(0, cluesOpen).map((clue, index) => (
                        <span className={styles.clueStamp} style={{ borderColor: tint.border }} key={`${currentStop.id}-clue-${index}`}>
                          <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden style={{ flex: "none", marginTop: 2, color: "var(--ink-3)" }}>
                            <circle cx="8" cy="8" r="6.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
                            <path d="M8 7.2v4M8 4.9v.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                          <span className={styles.clueStampCopy}>
                            <b className={styles.clueStampNo}>Clue {index + 1}.</b> {clue}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className={styles.riddleNotch} style={{ borderColor: tint.border }} aria-hidden />
              </div>

              <div className={styles.huntSteps} aria-label="How this riddle stop works">
                {huntDone ? (
                  <>
                    <div className={`${styles.huntStepItem} ${styles.huntStepItemDone}`}>
                      <span className={styles.huntStepNo}>✓</span>
                      <div className={styles.huntStepBody}>
                        <strong>Postcard complete</strong>
                        <p>Your four photo marks are finished. Save it, share it, or start the demo again.</p>
                      </div>
                    </div>
                    <div className={styles.huntStepControls}>
                      <button type="button" className={`${styles.btn} ${styles.btnMd} ${styles.btnBlue}`} onClick={() => setShareOpen((open) => !open)}>
                        Share postcard<Arrow size={13} />
                      </button>
                      <button type="button" className={`${styles.btn} ${styles.btnMd} ${styles.btnHuntGhost}`} onClick={() => { setStop(HOMEPAGE_HUNT_START_INDEX); setCluesOpen(0); setAnswerText(""); setAnswerStatus("idle"); setPhotoStepDone(false); setShareOpen(false); }}>Start over</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={`${styles.huntStepItem} ${answerStatus === "correct" ? styles.huntStepItemDone : ""}`}>
                      <span className={styles.huntStepNo}>1</span>
                      <div className={styles.huntStepBody}>
                        <strong>Enter your answer</strong>
                        {answerStatus === "correct" ? (
                          <p>Correct — you found the destination.</p>
                        ) : (
                          <form className={styles.answerForm} onSubmit={submitGuess}>
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
                          </form>
                        )}
                      </div>
                    </div>

                    {answerStatus !== "correct" && (
                      <div className={styles.huntStepItem}>
                        <span className={styles.huntStepNo}>2</span>
                        <div className={styles.huntStepBody}>
                          <strong>Need a clue?</strong>
                          {cluesOpen >= 3 ? (
                            <p>{CLUE_DONE_LINE}</p>
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
                        </div>
                      </div>
                    )}

                    {answerStatus === "correct" && currentStop?.challenge && (
                      <div className={`${styles.huntStepItem} ${photoStepDone ? styles.huntStepItemDone : styles.huntStepItemActive}`}>
                        <span className={styles.huntStepNo}>3</span>
                        <div className={styles.huntStepBody}>
                          <strong>Take photo</strong>
                          <p>{currentStop.challenge}</p>
                          {!photoStepDone && (
                            <button type="button" className={`${styles.btn} ${styles.btnMd} ${styles.btnDark}`} onClick={() => setPhotoStepDone(true)}>
                              Photo taken<Arrow size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {answerStatus === "correct" && photoStepDone && (
                      <div className={`${styles.huntStepItem} ${styles.huntStepItemActive}`}>
                        <span className={styles.huntStepNo}>4</span>
                        <div className={styles.huntStepBody}>
                          <strong>Next riddle, next stop!</strong>
                          <button type="button" className={`${styles.btn} ${styles.btnMd} ${styles.btnBlue}`} onClick={goNextRiddle}>
                            Next riddle, next stop!<Arrow size={13} />
                          </button>
                        </div>
                      </div>
                    )}

                    <div className={styles.huntStepControls}>
                      <button type="button" className={`${styles.btn} ${styles.btnMd} ${styles.btnHuntGhost}`} onClick={() => { setStop(HOMEPAGE_HUNT_START_INDEX); setCluesOpen(0); setAnswerText(""); setAnswerStatus("idle"); setPhotoStepDone(false); setShareOpen(false); }}>Start over</button>
                      <span className={styles.huntNoteInline}>{stopCounterText(stop, homepageRiddles.length || 4)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className={styles.huntSide}>
              {/* The screen the hunt shows after the last step, whole: crest,
                  kicker, "Nice one, …", the run's three numbers, the postcard and
                  Save / Send it. Ported from PostcardScreen so the landing shows
                  the finish people actually get, not a card lifted out of it. */}
              <div className={styles.finishCard}>
                <span className={styles.finishCrest} aria-hidden>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
                    <path d="M20 2v4" /><path d="M22 4h-4" /><circle cx="4" cy="20" r="2" />
                  </svg>
                </span>
                <span className={`${styles.finishKicker} ${styles.mono}`}>Hunt complete · Shop crawl</span>
                <h3 className={styles.finishTitle}>Nice one, Team Sidewalk.</h3>
                <p className={styles.finishLede}>You walked Friendly Mode end to end — 4 riddles, 4 photos, and a postcard with your name on it.</p>

                <div className={styles.finishStats}>
                  <div className={styles.finishStat}>
                    <span className={styles.finishStatV}>4</span>
                    <span className={styles.finishStatK}>Stops found</span>
                  </div>
                  <div className={styles.finishStat}>
                    <span className={styles.finishStatV}>58 min</span>
                    <span className={styles.finishStatK}>On the street</span>
                  </div>
                  <div className={styles.finishStat}>
                    <span className={styles.finishStatV}>2</span>
                    <span className={styles.finishStatK}>Clues used</span>
                  </div>
                </div>

                <figure className={styles.pcard}>
                  <div className={styles.pcardInner}>
                    <span className={styles.pcardSpine} aria-hidden />
                    <span className={`${styles.pcardVert} ${styles.mono}`}>INGLEWOOD</span>
                    <div className={`${styles.pcardTop} ${styles.mono}`}>
                      <span>Postcard complete</span>
                      <span className={styles.pcardSerial}>No. 004</span>
                    </div>
                    <h4 className={styles.pcardTitle}>Team Sidewalk walked Friendly Mode.</h4>
                    <div className={styles.pcardSlots}>
                      {POSTCARD_STAMPS.map((mark) => (
                        <figure className={`${styles.pcardSlot} ${styles.pcardSlotFilled}`} key={mark.src}>
                          {/* eslint-disable-next-line @next/next/no-img-element -- static demo asset, same as the map app's rail logo */}
                          <img src={mark.src} alt={mark.alt} />
                          <figcaption className={`${styles.pcardFound} ${styles.mono}`}>FOUND</figcaption>
                        </figure>
                      ))}
                    </div>
                    <p className={styles.pcardFoot}>Ironwood Stage and Grill · Kent of Inglewood · Fair&apos;s Fair Books · Doughnut Party</p>
                  </div>
                </figure>

                <div className={styles.finishCtaRow}>
                  <button type="button" className={`${styles.finishCta} ${styles.finishCtaGhost}`} onClick={() => { void downloadDemoPostcard(); }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg>
                    Save
                  </button>
                  <Link className={styles.finishCta} href="/calgary/hunt/start?type=friendly">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.59 13.51l6.83 3.98" /><path d="M15.41 6.51L8.59 10.49" /></svg>
                    Earn yours
                  </Link>
                </div>
                <Link className={styles.finishBack} href="/calgary">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z" /><path d="M15 5.764v15" /><path d="M9 3.236v15" /></svg>
                  Back to the map
                </Link>
              </div>

              {huntDone && (
                <div className={styles.shareCard}>
                  <span className={`${styles.mementoKicker} ${styles.mono}`}>Inglewood Basket draw</span>
                  <strong className={styles.postcardTitle}>The finish</strong>
                  <p className={styles.postcardCopy}>Your four photos land on a postcard, postmarked Inglewood. Download it, keep it, send it to whoever said there was nothing to do today — or post it with <b>#StrollInglewood</b> to enter the Inglewood Basket draw. Ten Inglewood shops each add one thing, worth around $250 all together.</p>
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
                        <li>Tap <b>Download postcard</b> to save the completed postcard.</li>
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

      {/* Who it is for. Each card lands on the start screen with that mood already
          picked, so the promise on the card is the hunt they get. */}
      <section className={styles.section} id="occasions">
        <div className={styles.sectionIn}>
          <div className={`${styles.head} ${styles.headNarrow}`} data-rise>
            <span className={`${styles.eyebrow} ${styles.eyebrowLime} ${styles.mono}`}>Who it&apos;s for</span>
            <h2 className={styles.h2}>Same street, six different afternoons.</h2>
            <p className={styles.lead}>Pick the reason you&apos;re out and the stops change with it. Every card below starts a real hunt with that mood already chosen.</p>
          </div>

          <div className={styles.occGrid} data-rise>
            {OCCASIONS.map((occasion) => (
              <Link
                className={styles.occCard}
                key={occasion.title}
                href={occasion.href ?? `/calgary/hunt/start?theme=${occasion.theme}`}
                style={{ "--occ": occasion.tone } as CSSProperties}
              >
                <span className={`${styles.occWho} ${styles.mono}`}>{occasion.who}</span>
                <strong className={styles.occTitle}>{occasion.title}</strong>
                <p className={styles.occCopy}>{occasion.copy}</p>
                <span className={styles.occGo}>{occasion.href ? "See group options" : "Start this hunt"}<Arrow size={12} /></span>
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
                  <span className={styles.priceNote}>{plan.note}</span>
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
          <p className={styles.groupPriceLink}>
            Booking for a group? <Link href="/events">From $9 a person<Arrow size={12} /></Link>
            <span className={styles.groupExamples}>Corporate events, bachelor parties, bachelorette parties, birthday parties, youth groups, charity fundraiser events and more.</span>
          </p>
        </div>
      </section>

      {/* Straight answers, no JavaScript — <details> so the list still works if the
          bundle never loads and so a browser find-in-page can reach the answers. */}
      <section className={styles.section} id="faq">
        <div className={styles.sectionIn}>
          <div className={`${styles.head} ${styles.headNarrow}`} data-rise>
            <span className={`${styles.eyebrow} ${styles.eyebrowMuted} ${styles.mono}`}>Straight answers</span>
            <h2 className={styles.h2}>Before you head out.</h2>
            <p className={styles.lead}>Everything people ask us on the sidewalk, answered plainly.</p>
          </div>

          <div className={styles.faqGrid} data-rise>
            {FAQS.map((item) => (
              <details className={styles.faqItem} key={item.q}>
                <summary className={styles.faqQ}>
                  {item.q}
                  <span aria-hidden>
                    <svg width="11" height="11" viewBox="0 0 16 16"><path d="M8 3v10M3 8h10" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" /></svg>
                  </span>
                </summary>
                <p className={styles.faqA}>{item.a}</p>
              </details>
            ))}
          </div>

          <p className={styles.faqFoot} data-rise>
            Still wondering something? <a href="mailto:hello@stroll.city">hello@stroll.city</a>
            <Link href="/rules">Basket draw rules<Arrow size={12} /></Link>
            <Link href="/business">Own a shop on the strip?<Arrow size={12} /></Link>
          </p>
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
              <Link className={`${styles.btn} ${styles.btnOnBlue}`} href="/calgary/hunt/start?type=friendly">Start a free hunt</Link>
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
            <a href="#how">How it works</a>
            <a href="#hunt">The hunt</a>
            <a href="#faq">FAQ</a>
            <Link href="/rules">Rules</Link>
            <Link href="/events">Events</Link>
            <Link href="/business">For businesses</Link>
          </span>
          <p className={styles.footNote}>
            Geometry and licences come from City of Calgary open data. Basemap © OpenStreetMap contributors, served by OpenFreeMap.
          </p>
        </div>
      </footer>
    </main>
  );
}
