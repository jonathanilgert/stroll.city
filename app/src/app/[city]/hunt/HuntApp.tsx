"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "../../page.module.css";

export type Hunt = {
  id: string;
  slug: string;
  name: string;
  blurb: string;
  stop_ids: string[];
  mode: "friendly" | "full" | "race";
  est_minutes: number;
  distance_m: number;
  difficulty: string;
  status: string;
};

export type HuntStopLite = {
  id: string;
  business_id: string;
  business_slug?: string;
  name: string;
  address?: string;
  lon?: number;
  lat?: number;
  riddle: string;
  clue_1: string;
  clue_2: string;
  clue_3: string;
  challenge?: string;
  difficulty: string;
  age_restricted: boolean;
  status: string;
};

type HuntBranch = "solo" | "team" | "event";
type HuntStage = "setup" | "briefing" | "playing" | "paused" | "help" | "review" | "finished";
type Progress = { state: "pending" | "solved" | "skipped"; clues: number; photo?: string; photoName?: string; solvedAt?: string; skippedAt?: string };
type Player = { id: string; name: string; role: string; avatar: string; ready: boolean };
type PersistedHunt = {
  version: 2;
  selectedSlug: string;
  branch: HuntBranch;
  stage: HuntStage;
  teamName: string;
  avatar: string;
  playStyle: string;
  deviceMode: string;
  eventName: string;
  organiserName: string;
  participantCount: number;
  teamCount: number;
  routeStyle: string;
  customChallenge: string;
  sessionId: string;
  startedAt: number | null;
  current: number;
  progress: Record<string, Progress>;
  players: Player[];
};

const STORAGE_KEY = "stroll-active-hunt";
const cluePenalty = [0, 180, 480, 1080];
const productCopy = {
  friendly: "4 stops · randomised · postcard finish · basket entry",
  full: "8 stops · curated · final-stop treat when available · postcard finish",
  race: "8 stops · rotated starts · Stroll Time · live leaderboard",
};
const branchCopy: Record<HuntBranch, { title: string; body: string; steps: string[] }> = {
  solo: {
    title: "Solo / one-phone hunt",
    body: "Fastest path for a couple, family, or small group sharing one phone.",
    steps: ["Nickname + avatar", "Relaxed / competitive / family-friendly", "Explorer / photographer / trivia hunter", "Route map + distance", "Directions", "Final confirmation"],
  },
  team: {
    title: "Team lobby",
    body: "A shared hunt setup for people who want player roles and an invite code before the route starts.",
    steps: ["Team name", "Avatar/photo + leader", "One device or everyone on their own", "Invite code", "QR/share link", "Joined players", "Bonus tasks", "Leader starts"],
  },
  event: {
    title: "Event / group setup",
    body: "The organiser flow for races, school groups, charity starts, and corporate groups.",
    steps: ["Event size", "Participants + teams", "Organiser", "Event date", "Auto/manual teams", "Route style", "Custom challenge", "Master QR/code"],
  },
};
const avatarChoices = ["🥾", "📷", "🧩", "🗺️", "⭐", "🐾"];
const playStyles = ["Relaxed", "Competitive", "Family-friendly"];
const playerRoles = ["Explorer", "Photographer", "Trivia hunter", "Navigator"];
const stampSwatches = [
  ["#0B47E8", "#0736B8"], ["#F58AB4", "#C2296B"], ["#F5C93F", "#8A6410"], ["#8468E0", "#5B3FC4"],
  ["#57C07A", "#2E7D50"], ["#1573C6", "#12639F"], ["#DCF23C", "#5F7A12"], ["#14161A", "#55585F"],
];

function hash32(input: string) {
  let hash = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash >>> 0;
}
function mulberry32(seed: number) {
  return function next() {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function tiltFor(session: string, index: number) {
  const rand = mulberry32(hash32(`${session}:${index}`));
  return { rot: rand() * 14 - 7, dx: rand() * 7 - 3.5, dy: rand() * 7 - 3.5, pm: rand() * 50 - 25 };
}
function fmt(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}
function rotate<T>(rows: T[], offset: number) {
  if (!rows.length) return rows;
  const n = Math.abs(offset) % rows.length;
  return [...rows.slice(n), ...rows.slice(0, n)];
}
function makeInvite(seed: string) {
  return `HUNT-${(hash32(seed).toString(36).toUpperCase() + "0000").slice(0, 4)}`;
}
function safeReadSession(): PersistedHunt | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedHunt>;
    if (parsed.version !== 2 || !parsed.selectedSlug || !parsed.sessionId) return null;
    return parsed as PersistedHunt;
  } catch { return null; }
}
function mapUrl(stop?: HuntStopLite) {
  if (!stop) return "https://maps.google.com/?q=Inglewood%20Calgary";
  const query = stop.lat && stop.lon ? `${stop.lat},${stop.lon}` : `${stop.name} ${stop.address ?? "Inglewood Calgary"}`;
  return `https://maps.google.com/?q=${encodeURIComponent(query)}`;
}
function distanceLabel(meters: number) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`;
}
function MiniRouteMap({ stops, current, progress, cityName }: { stops: HuntStopLite[]; current: number; progress: Record<string, Progress>; cityName: string }) {
  const points = useMemo(() => {
    const geo = stops.filter((stop) => typeof stop.lon === "number" && typeof stop.lat === "number") as Required<Pick<HuntStopLite, "lon" | "lat"> & HuntStopLite>[];
    if (!geo.length) return [];
    const lons = geo.map((s) => s.lon), lats = geo.map((s) => s.lat);
    const minLon = Math.min(...lons), maxLon = Math.max(...lons), minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const dx = maxLon - minLon || 0.01, dy = maxLat - minLat || 0.01;
    return stops.map((stop, index) => {
      const lon = typeof stop.lon === "number" ? stop.lon : minLon + dx * (index / Math.max(1, stops.length - 1));
      const lat = typeof stop.lat === "number" ? stop.lat : minLat + dy * 0.5;
      return { stop, x: 36 + ((lon - minLon) / dx) * 288, y: 34 + (1 - ((lat - minLat) / dy)) * 148 };
    });
  }, [stops]);
  const path = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  return <div className={styles.huntMapCard} aria-label="Hunt route map">
    <div className={styles.huntMapTop}><span className={styles.lbl}>Live route map</span><Link href={`/${cityName.toLowerCase()}`}>Open full map</Link></div>
    <svg viewBox="0 0 360 220" role="img" aria-label="Current hunt stops mapped in route order">
      <defs><linearGradient id="huntMapBg" x1="0" x2="1"><stop stopColor="#F7F8FA" /><stop offset="1" stopColor="#E4EBFF" /></linearGradient></defs>
      <rect width="360" height="220" rx="24" fill="url(#huntMapBg)" />
      <path d="M18 132 C88 108 124 142 188 104 S284 72 342 96" fill="none" stroke="#D7DAE2" strokeWidth="18" strokeLinecap="round" />
      <path d="M16 140 C90 112 128 152 194 112 S290 82 344 106" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeDasharray="10 10" />
      {points.length > 1 && <polyline points={path} fill="none" stroke="#0B47E8" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />}
      {points.map((point, index) => {
        const state = progress[point.stop.id]?.state;
        const isCurrent = index === current;
        const fill = state === "solved" ? "#DCF23C" : isCurrent ? "#0B47E8" : "#fff";
        const stroke = state === "solved" ? "#14161A" : isCurrent ? "#0B47E8" : "#C9CCD3";
        return <g key={point.stop.id}>
          {isCurrent && <circle cx={point.x} cy={point.y} r="22" fill="none" stroke="#0B47E8" strokeOpacity=".16" strokeWidth="9" />}
          <circle cx={point.x} cy={point.y} r="15" fill={fill} stroke={stroke} strokeWidth="2" />
          <text x={point.x} y={point.y + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill={isCurrent ? "#fff" : "#14161A"}>{index + 1}</text>
        </g>;
      })}
    </svg>
    <div className={styles.huntMapLegend}><span><i className={styles.huntDotNow} />Current</span><span><i className={styles.huntDotDone} />Found</span><span><i />Upcoming</span></div>
  </div>;
}

function RoadmapCoverage({ compact = false }: { compact?: boolean }) {
  const groups = [
    ["Mode picker", 6, "Hunt cards, mode selection, pricing, stop counts, basket/postcard promise, route summary"],
    ["Branch A — solo", 6, "Nickname, avatar, play style, player role, map/directions, final confirmation"],
    ["Branch B — team", 8, "Team name, leader, devices, invite code, share link, players, bonus tasks, leader start"],
    ["Branch C — event", 8, "Size, participants, organiser, date, team split, route style, custom question, master code"],
    ["Universal pre-game", 4, "Route map, open in maps, arrival/location guidance, rules, official begin"],
    ["Per-stop loop", 7, "Stop status, riddle, three clues, physical-place photo challenge, reveal, next riddle"],
    ["Persistent screens", 4, "Route/progress, score/time, players/tasks, ranking, photo roll"],
    ["Pause/interruption", 4, "Pause/resume/exit, timer note, exact return, save progress, active card"],
    ["Recovery/help", 7, "Manual continue, photo permission, offline retry, wrong-place help, rejoin, current-stop join, skip impact, bypass"],
    ["Final stop", 4, "Last challenge, completion, confetti, score summary, rank"],
    ["Memory/retention", 5, "Route recap, photos, postcard, sharing, rating"],
    ["Next action", 3, "Another neighbourhood, return to map, bookmark, history"],
  ];
  const total = groups.reduce((sum, row) => sum + Number(row[1]), 0);
  const shown = compact ? groups.slice(0, 5) : groups;
  return <div className={styles.huntCoverage}>
    <div className={styles.huntCoverageHead}><span className={styles.lbl}>Roadmap coverage</span><b>{total} screens / steps wired</b></div>
    <div className={styles.huntCoverageGrid}>{shown.map(([name, count, detail]) => <div className={styles.huntCoverageRow} key={String(name)}><span>{String(count).padStart(2, "0")}</span><div><b>{name}</b><small>{detail}</small></div></div>)}</div>
  </div>;
}

export default function HuntApp({ cityName, hunts, stops }: { cityName: string; hunts: Hunt[]; stops: HuntStopLite[] }) {
  const [selectedSlug, setSelectedSlug] = useState(() => {
    if (typeof window === "undefined") return hunts[0]?.slug ?? "friendly-mode";
    const params = new URLSearchParams(window.location.search);
    const type = params.get("type");
    const saved = params.get("resume") ? safeReadSession()?.selectedSlug : null;
    return saved ?? hunts.find((item) => item.mode === type)?.slug ?? hunts[0]?.slug ?? "friendly-mode";
  });
  const [branch, setBranch] = useState<HuntBranch>("solo");
  const [stage, setStage] = useState<HuntStage>("setup");
  const [teamName, setTeamName] = useState("");
  const [avatar, setAvatar] = useState("🥾");
  const [playStyle, setPlayStyle] = useState("Family-friendly");
  const [playerRole, setPlayerRole] = useState("Explorer");
  const [deviceMode, setDeviceMode] = useState("One shared phone");
  const [eventName, setEventName] = useState("Inglewood Adventure Hunt");
  const [organiserName, setOrganiserName] = useState("");
  const [participantCount, setParticipantCount] = useState(12);
  const [teamCount, setTeamCount] = useState(3);
  const [routeStyle, setRouteStyle] = useState("Same route · rotated starts");
  const [customChallenge, setCustomChallenge] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(0);
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState<Record<string, Progress>>({});
  const [uploadingStopId, setUploadingStopId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [offlineNote, setOfflineNote] = useState("");
  const teamInputRef = useRef<HTMLInputElement>(null);

  const hunt = hunts.find((item) => item.slug === selectedSlug) ?? hunts[0];
  const stopsById = useMemo(() => new Map(stops.map((stop) => [stop.id, stop])), [stops]);
  const rawStops = useMemo(() => hunt ? hunt.stop_ids.map((id) => stopsById.get(id)).filter(Boolean) as HuntStopLite[] : [], [hunt, stopsById]);
  const routeSeed = `${sessionId || selectedSlug}-${teamName || "guest"}-${branch}`;
  const huntStops = useMemo(() => {
    if (!hunt) return [];
    const sessionOffset = routeSeed ? hash32(routeSeed) : 0;
    const ordered = hunt.mode === "friendly" ? rotate(rawStops, sessionOffset) : hunt.mode === "race" ? rotate(rawStops, sessionOffset) : rawStops;
    return ordered.slice(0, hunt.mode === "friendly" ? 4 : 8);
  }, [hunt, rawStops, routeSeed]);
  const active = huntStops[current];
  const activeClues = active ? [active.clue_1, active.clue_2, active.clue_3].filter(Boolean) : [];
  const solvedCount = huntStops.filter((stop) => progress[stop.id]?.state === "solved").length;
  const skippedCount = huntStops.filter((stop) => progress[stop.id]?.state === "skipped").length;
  const foundOrSkipped = solvedCount + skippedCount;
  const isRace = hunt?.mode === "race";
  const penalties = isRace ? huntStops.reduce((total, stop) => total + cluePenalty[progress[stop.id]?.clues ?? 0] + (progress[stop.id]?.state === "skipped" ? 1200 : 0), 0) : 0;
  const elapsed = startedAt && now ? Math.floor((now - startedAt) / 1000) : 0;
  const strollSeconds = isRace ? elapsed + penalties : elapsed;
  const activeSolved = active ? progress[active.id]?.state === "solved" : false;
  const activePhoto = active ? progress[active.id]?.photo : undefined;
  const finished = huntStops.length > 0 && foundOrSkipped === huntStops.length;
  const inviteCode = makeInvite(`${sessionId}-${teamName}-${eventName}`);
  const citySlug = cityName.toLowerCase();
  const sessionKey = `${sessionId || "preview"}-${hunt?.id ?? "hunt"}`;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const saved = safeReadSession();
    if (saved && (params.get("resume") || saved.stage !== "setup")) {
      window.setTimeout(() => {
        setSelectedSlug(saved.selectedSlug);
        setBranch(saved.branch);
        setStage(saved.stage === "finished" ? "finished" : saved.stage);
        setTeamName(saved.teamName);
        setAvatar(saved.avatar);
        setPlayStyle(saved.playStyle);
        setDeviceMode(saved.deviceMode);
        setEventName(saved.eventName);
        setOrganiserName(saved.organiserName);
        setParticipantCount(saved.participantCount);
        setTeamCount(saved.teamCount);
        setRouteStyle(saved.routeStyle);
        setCustomChallenge(saved.customChallenge);
        setSessionId(saved.sessionId);
        setStartedAt(saved.startedAt);
        setNow(Date.now());
        setCurrent(saved.current);
        setProgress(saved.progress);
        setPlayers(saved.players ?? []);
      }, 0);
    } else if (params.get("type")) {
      window.setTimeout(() => teamInputRef.current?.focus(), 60);
    }
  }, []);

  useEffect(() => {
    if (!startedAt || stage === "paused" || stage === "finished") return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [startedAt, stage]);

  useEffect(() => {
    if (typeof window === "undefined" || !sessionId) return;
    const payload: PersistedHunt = { version: 2, selectedSlug, branch, stage, teamName, avatar, playStyle, deviceMode, eventName, organiserName, participantCount, teamCount, routeStyle, customChallenge, sessionId, startedAt, current, progress, players };
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch { console.warn("Hunt state could not be saved locally"); }
  }, [selectedSlug, branch, stage, teamName, avatar, playStyle, deviceMode, eventName, organiserName, participantCount, teamCount, routeStyle, customChallenge, sessionId, startedAt, current, progress, players]);

  useEffect(() => {
    if (finished && stage !== "finished") window.setTimeout(() => setStage("finished"), 0);
  }, [finished, stage]);

  const resetForMode = (slug: string) => {
    setSelectedSlug(slug);
    setStage("setup");
    setStartedAt(null);
    setSessionId("");
    setCurrent(0);
    setProgress({});
    setPlayers([]);
    setUploadError("");
  };
  const primeSession = () => {
    const id = sessionId || `hunt_${Date.now().toString(36)}_${hash32(`${teamName}-${selectedSlug}`).toString(36).slice(0, 4)}`;
    setSessionId(id);
    if (!players.length) setPlayers([{ id: "p1", name: teamName || "Sidewalk Sleuths", role: playerRole, avatar, ready: true }]);
    return id;
  };
  const openBriefing = () => {
    primeSession();
    setProgress(Object.fromEntries(huntStops.map((stop) => [stop.id, progress[stop.id] ?? { state: "pending", clues: 0 }])));
    setStage("briefing");
    setNow(Date.now());
  };
  const beginHunt = () => {
    const started = startedAt ?? Date.now();
    const id = primeSession();
    setStartedAt(started);
    setNow(started);
    setStage("playing");
    void fetch(`/api/v1/${citySlug}/hunts/${hunt?.slug ?? selectedSlug}/sessions`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ team_name: teamName || "Anonymous team", mode: hunt?.mode, session_key: id }),
    }).catch(() => setOfflineNote("Connection is patchy. Your hunt is saved on this phone and will retry when signal returns."));
  };
  const revealClue = () => {
    if (!active) return;
    setProgress((rows) => ({ ...rows, [active.id]: { ...(rows[active.id] ?? { state: "pending", clues: 0 }), clues: Math.min(3, (rows[active.id]?.clues ?? 0) + 1) } }));
  };
  const completeCurrent = (photo?: { url: string; name: string }) => {
    if (!active) return;
    setProgress((rows) => ({ ...rows, [active.id]: { ...(rows[active.id] ?? { state: "pending", clues: 0 }), state: "solved", photo: photo?.url ?? rows[active.id]?.photo ?? `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240"><rect width="320" height="240" fill="#E4EBFF"/><text x="160" y="118" text-anchor="middle" font-family="Arial" font-size="20" fill="#0B47E8">Proof photo saved</text><text x="160" y="148" text-anchor="middle" font-family="Arial" font-size="14" fill="#55585F">${active.name}</text></svg>`)}`, photoName: photo?.name ?? rows[active.id]?.photoName ?? "Camera checkpoint", solvedAt: rows[active.id]?.solvedAt ?? new Date().toISOString() } }));
  };
  const uploadPhoto = async (file: File | undefined) => {
    if (!active || !file) return;
    if (!file.type.startsWith("image/")) { setUploadError("Please choose a photo file."); return; }
    if (file.size > 8 * 1024 * 1024) { setUploadError("Please choose a photo under 8MB."); return; }
    const currentSessionId = primeSession();
    setUploadingStopId(active.id); setUploadError("");
    const preview = URL.createObjectURL(file);
    const form = new FormData();
    form.append("photo", file); form.append("stop_id", active.id); form.append("team_name", teamName || "Anonymous team");
    try {
      const response = await fetch(`/api/v1/${citySlug}/sessions/${encodeURIComponent(currentSessionId)}/photos`, { method: "POST", body: form });
      const payload = await response.json().catch(() => null) as { ok?: boolean; data?: { url?: string; file_name?: string }; error?: string } | null;
      if (!response.ok || !payload?.ok) setOfflineNote("Photo is previewed locally. Upload will need a stronger connection before the final postcard export.");
      completeCurrent({ url: payload?.data?.url ?? preview, name: file.name });
    } catch {
      setOfflineNote("Photo is saved locally for this session. Reconnect before final export.");
      completeCurrent({ url: preview, name: file.name });
    } finally {
      setUploadingStopId(null);
    }
  };
  const nextStop = () => {
    if (current < huntStops.length - 1) { setCurrent((n) => n + 1); setStage("playing"); window.scrollTo({ top: 0, behavior: "smooth" }); }
    else setStage("finished");
  };
  const skipStop = () => {
    if (!active) return;
    setProgress((rows) => ({ ...rows, [active.id]: { ...(rows[active.id] ?? { state: "pending", clues: 0 }), state: "skipped", skippedAt: new Date().toISOString() } }));
  };
  const finishShare = async () => {
    const text = `${teamName || "Our team"} finished ${hunt?.name ?? "a Stroll City hunt"} in Inglewood. #StrollInglewood @stroll_city`;
    if (typeof window === "undefined") return;
    await window.navigator.clipboard?.writeText(`${text} ${window.location.href}`).catch(() => undefined);
    if (typeof window.navigator.share === "function") await window.navigator.share({ title: "Stroll City postcard", text, url: window.location.href }).catch(() => undefined);
  };
  const exitAndSave = () => setStage("paused");
  const clearHunt = () => {
    if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
    setStage("setup"); setStartedAt(null); setSessionId(""); setCurrent(0); setProgress({}); setPlayers([]);
  };
  const addPlayer = () => {
    const idx = players.length + 1;
    setPlayers((rows) => [...rows, { id: `p${idx}`, name: `Player ${idx}`, role: playerRoles[idx % playerRoles.length], avatar: avatarChoices[idx % avatarChoices.length], ready: idx % 2 === 0 }]);
  };

  const progressText = `${foundOrSkipped}/${huntStops.length || (hunt?.mode === "friendly" ? 4 : 8)} found`;
  const currentCard = active ? <>
    <div className={styles.huntAppStatus}><span>{avatar} {teamName || "Sidewalk Sleuths"}</span><span>Stop {current + 1} of {huntStops.length}</span><span>{progressText}</span>{isRace && <span>{fmt(elapsed)} (+{Math.round(penalties / 60)}) = {fmt(strollSeconds)}</span>}</div>
    <div className={styles.huntPlayGrid}>
      <article className={styles.huntPhonePanel}>
        <span className={styles.lbl}>Find this mystery stop</span>
        <h2 className={styles.landH2}>Stop {current + 1}</h2>
        <p className={styles.huntStopMeta}>{active.difficulty} · {active.address ? "Search zone ready" : "Inglewood"}</p>
        <p className={`${styles.landCardP} ${styles.landRiddle}`} style={{ whiteSpace: "pre-wrap" }}>{active.riddle}</p>
        <div className={styles.huntClueStack}>{activeClues.slice(0, progress[active.id]?.clues ?? 0).map((clue, index) => <div className={styles.callout} key={`${active.id}-clue-${index}`}><b>{index === 0 ? "Give me a clue" : index === 1 ? "One more" : "Just tell me"}</b> {clue}</div>)}</div>
        <div className={styles.huntActions}>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={revealClue} disabled={(progress[active.id]?.clues ?? 0) >= 3}>{(progress[active.id]?.clues ?? 0) === 0 ? "Give me a clue" : (progress[active.id]?.clues ?? 0) === 1 ? "One more" : "Just tell me"}{isRace ? " (+ time)" : ""}</button>
          <a className={`${styles.btn} ${styles.btnGhost}`} href={mapUrl(active)} target="_blank" rel="noreferrer">Open directions</a>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setStage("help")}>Help</button>
        </div>
        <div className={styles.calloutAmber}><b>At this stop:</b> {active.challenge ?? "Photograph the doorway and include a hand, shoe, hat or face from your team."}</div>
        <div className={styles.photoUploadPanel}>
          {activePhoto ? <img className={styles.uploadedPhotoPreview} src={activePhoto} alt={`Proof for stop ${current + 1}`} /> : null}
          <div>
            <label className={`${styles.btn} ${styles.btnPrimary} ${uploadingStopId === active.id ? styles.btnDisabled : ""}`}>{uploadingStopId === active.id ? "Saving photo…" : activeSolved ? "Replace proof photo" : "I'm here — take / upload photo"}<input type="file" accept="image/*" capture="environment" disabled={uploadingStopId === active.id} onChange={(event) => { void uploadPhoto(event.target.files?.[0]); event.currentTarget.value = ""; }} /></label>
            <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => completeCurrent()} disabled={activeSolved}>Record camera checkpoint</button>
            <p className={styles.photoUploadHint}>The photo is the arrival check. GPS is never required to advance.</p>
          </div>
        </div>
        {uploadError && <div className={styles.calloutAmber}>{uploadError}</div>}
        {activeSolved && <div className={styles.huntReveal}><span className={styles.lbl}>Revealed after solve</span><h3>{active.name}</h3><p>{active.address}</p>{current < huntStops.length - 1 ? <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={nextStop}>Next riddle</button> : <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setStage("finished")}>Complete the hunt</button>}</div>}
      </article>
      <aside className={styles.huntPhonePanel}><MiniRouteMap stops={huntStops} current={current} progress={progress} cityName={cityName} /><div className={styles.huntActions}><button className={`${styles.btn} ${styles.btnGhost}`} onClick={exitAndSave}>Pause hunt</button><button className={`${styles.btn} ${styles.btnGhost}`} onClick={skipStop}>Skip (+impact)</button><Link className={`${styles.btn} ${styles.btnGhost}`} href={`/${citySlug}`}>Map home</Link></div></aside>
    </div>
  </> : null;

  return <main className={styles.landing}>
    <nav className={styles.landNav}><div className={styles.landNavIn}>
      <Link className={styles.landBrand} href="/"><img src="/brand/stroll-mark.png" alt="" /><span className={styles.landBrandName}>STROLL <span>CITY</span></span></Link>
      <div className={styles.landNavLinks}><Link href={`/${citySlug}`}>Map</Link><Link href="/business">For businesses</Link><Link href="/rules">Rules</Link></div>
      <span className={styles.landSp} />{sessionId && <button className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`} onClick={() => setStage(stage === "paused" ? "playing" : "paused")}>{stage === "paused" ? "Resume" : "Pause"}</button>}<Link className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`} href={`/${citySlug}`}>Back to map</Link>
    </div></nav>

    <div className={styles.landWrap}>
      <header className={styles.landHero}>
        <div className={styles.landHeroCard}><div className={styles.landHeroGrid}>
          <div className={styles.landHeroCopy}>
            <span className={styles.landEyebrow}><i /> {cityName} hunt app</span>
            <h1 className={styles.landH1}>A real hunt flow,<br />not a page example.</h1>
            <p className={styles.landHeroSub}>The roadmap screens are wired as an app state machine: setup branches, pre-game map, active stop loop, persistent route/progress, pause/rejoin, recovery states, final stop, postcard, sharing, and next actions.</p>
            {sessionId && <div className={styles.callout}><b>Saved on this phone.</b> Return from the Calgary map with <Link href={`/${citySlug}/hunt?resume=1`}>Continue hunt</Link>; your current stop will not reset.</div>}
            {offlineNote && <div className={styles.calloutAmber}>{offlineNote}</div>}
          </div>
          <div className={styles.landShowcase} style={{ padding: 24, height: "auto" }}><RoadmapCoverage compact /></div>
        </div></div>
      </header>

      <section className={styles.landBlk}>
        {stage === "setup" && <div className={styles.huntAppShell}>
          <div className={styles.landSecHead}><div className={styles.landSecHeadL}><span className={styles.lbl}>Phase 01–02</span><h2 className={styles.landH2}>Choose the hunt path</h2></div><p>All three branches from the folder now lead into the same playable stop loop.</p></div>
          <div className={styles.huntModeGrid}>{hunts.map((item) => <button key={item.id} className={styles.huntModeCard} aria-pressed={item.slug === selectedSlug} onClick={() => resetForMode(item.slug)}><span className={styles.lbl}>{item.mode}</span><h3>{item.name}</h3><b>{item.mode === "friendly" ? "Free" : item.mode === "race" ? "$15/team" : "$20/team"}</b><p>{productCopy[item.mode]}</p></button>)}</div>
          <div className={styles.huntModeGrid}>{(Object.keys(branchCopy) as HuntBranch[]).map((key) => <button key={key} className={styles.huntBranchCard} aria-pressed={branch === key} onClick={() => setBranch(key)}><h3>{branchCopy[key].title}</h3><p>{branchCopy[key].body}</p><small>{branchCopy[key].steps.join(" · ")}</small></button>)}</div>
          <div className={styles.huntSetupGrid}>
            <div className={styles.huntPhonePanel}>
              <span className={styles.lbl}>{branchCopy[branch].title}</span>
              <div className={styles.grid2}>
                <div className={styles.claimField}><label>{branch === "event" ? "Team / route name" : "Team name"}</label><div className={styles.ctl}><input ref={teamInputRef} value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="The Sidewalk Sleuths" /></div></div>
                <div className={styles.claimField}><label>Avatar</label><div className={styles.huntAvatarRow}>{avatarChoices.map((choice) => <button type="button" key={choice} aria-pressed={avatar === choice} onClick={() => setAvatar(choice)}>{choice}</button>)}</div></div>
                {branch !== "event" && <div className={styles.claimField}><label>Play style</label><div className={styles.huntPills}>{playStyles.map((choice) => <button type="button" key={choice} aria-pressed={playStyle === choice} onClick={() => setPlayStyle(choice)}>{choice}</button>)}</div></div>}
                {branch !== "event" && <div className={styles.claimField}><label>Your role</label><div className={styles.ctl}><select value={playerRole} onChange={(e) => setPlayerRole(e.target.value)}>{playerRoles.map((role) => <option key={role}>{role}</option>)}</select></div></div>}
                {branch === "team" && <div className={styles.claimField}><label>Devices</label><div className={styles.ctl}><select value={deviceMode} onChange={(e) => setDeviceMode(e.target.value)}><option>One shared phone</option><option>Everyone on their own phone</option></select></div></div>}
                {branch === "event" && <><div className={styles.claimField}><label>Organiser</label><div className={styles.ctl}><input value={organiserName} onChange={(e) => setOrganiserName(e.target.value)} placeholder="Organizer name" /></div></div><div className={styles.claimField}><label>Participants</label><div className={styles.ctl}><input type="number" value={participantCount} min={2} onChange={(e) => setParticipantCount(Number(e.target.value))} /></div></div><div className={styles.claimField}><label>Teams</label><div className={styles.ctl}><input type="number" value={teamCount} min={2} max={24} onChange={(e) => setTeamCount(Number(e.target.value))} /></div></div><div className={styles.claimField}><label>Route</label><div className={styles.ctl}><select value={routeStyle} onChange={(e) => setRouteStyle(e.target.value)}><option>Same route · rotated starts</option><option>Staggered start</option><option>Opposite directions</option></select></div></div><div className={styles.claimField}><label>Custom final challenge</label><div className={styles.ctl}><textarea value={customChallenge} onChange={(e) => setCustomChallenge(e.target.value)} placeholder="Optional organizer challenge" /></div></div></>}
              </div>
              {branch !== "solo" && <div className={styles.callout}><b>Invite code:</b> {inviteCode} · QR/share link ready. <button onClick={addPlayer}>Add waiting player</button></div>}
              {players.length > 0 && <div className={styles.huntPlayerList}>{players.map((p) => <span key={p.id}>{p.avatar} {p.name} · {p.role} · {p.ready ? "ready" : "waiting"}</span>)}</div>}
              <div className={styles.landHeroCta}><button className={`${styles.btn} ${styles.btnPrimary}`} onClick={openBriefing}>Review route and rules</button><Link className={`${styles.btn} ${styles.btnGhost}`} href={`/${citySlug}`}>Browse map first</Link></div>
            </div>
            <div className={styles.huntPhonePanel}><MiniRouteMap stops={huntStops} current={0} progress={progress} cityName={cityName} /><div className={styles.review}><div className={styles.revRow}><span className={styles.revKey}>Distance</span><span className={styles.revVal}>{distanceLabel(hunt?.distance_m ?? 900)}</span></div><div className={styles.revRow}><span className={styles.revKey}>Stops</span><span className={styles.revVal}>{hunt?.mode === "friendly" ? "4 random" : "8 curated"}</span></div><div className={styles.revRow}><span className={styles.revKey}>Map</span><span className={styles.revVal}>Inline + full map return</span></div></div></div>
          </div>
          <RoadmapCoverage />
        </div>}

        {stage === "briefing" && <div className={styles.huntAppShell}>
          <div className={styles.landSecHead}><div><span className={styles.lbl}>Phase 03 — universal pre-game</span><h2 className={styles.landH2}>Ready at the first stop?</h2></div><p>Map, walking directions, rules, arrival guidance, and final start live here before official gameplay begins.</p></div>
          <div className={styles.huntPlayGrid}><div className={styles.huntPhonePanel}><MiniRouteMap stops={huntStops} current={0} progress={progress} cityName={cityName} /><div className={styles.huntActions}><a className={`${styles.btn} ${styles.btnGhost}`} href={mapUrl(huntStops[0])} target="_blank" rel="noreferrer">Open in maps</a><Link className={`${styles.btn} ${styles.btnGhost}`} href={`/${citySlug}`}>Open Stroll map</Link></div></div><div className={styles.huntPhonePanel}><span className={styles.lbl}>How it works</span><h3 className={styles.landH3}>Clues, photos, points</h3><div className={styles.huntChecklist}><span>Read one riddle at a time.</span><span>Take up to three clues; Friendly and Full are untimed.</span><span>Take a proof photo at the doorway or inside.</span><span>The shop name reveals only after solving.</span><span>Your punch card fills in and unlocks the next riddle.</span></div><div className={styles.landHeroCta}><button className={`${styles.btn} ${styles.btnPrimary}`} onClick={beginHunt}>Begin official gameplay</button><button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setStage("setup")}>Back to setup</button></div></div></div>
        </div>}

        {stage === "playing" && <div className={styles.huntAppShell}>{currentCard}</div>}
        {stage === "paused" && <div className={styles.huntAppShell}><div className={styles.huntPhonePanel}><span className={styles.lbl}>Phase 06 — pause / interruption</span><h2 className={styles.landH2}>Hunt paused and saved.</h2><p className={styles.landCardP}>Return exactly to stop {current + 1}. Your route, clues, photos, players and progress are saved on this phone.</p><div className={styles.landHeroCta}><button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setStage("playing")}>Resume current stop</button><Link className={`${styles.btn} ${styles.btnGhost}`} href={`/${citySlug}`}>Open map</Link><button className={`${styles.btn} ${styles.btnGhost}`} onClick={clearHunt}>Restart setup</button></div></div></div>}
        {stage === "help" && <div className={styles.huntAppShell}><div className={styles.landSecHead}><div><span className={styles.lbl}>Phase 07 — recovery / help</span><h2 className={styles.landH2}>Nobody gets stuck.</h2></div><p>These are the interruption states from the folder, kept inside the app flow.</p></div><div className={styles.huntModeGrid}>{["Continue manually / open directions", "Photo access needed — choose from library", "Cached clue + retry connection", "You may not be at the right place", "Rejoin via team code", "Join active hunt at current stop", "Confirm skip + point impact", "Alternative clue / bypass stop"].map((item) => <div className={styles.huntBranchCard} key={item}><h3>{item}</h3><p>{item.includes("skip") ? "Skipping records impact and moves on." : item.includes("Photo") ? "The camera is the arrival check; GPS never blocks progression." : "Return to the same current stop without reset."}</p></div>)}</div><div className={styles.landHeroCta}><button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setStage("playing")}>Return to current stop</button><button className={`${styles.btn} ${styles.btnGhost}`} onClick={skipStop}>Bypass this stop</button></div></div>}
        {stage === "review" && <div className={styles.huntAppShell}><div className={styles.huntPlayGrid}><div className={styles.huntPhonePanel}><span className={styles.lbl}>Phase 05 — persistent screens</span><h2 className={styles.landH2}>Route progress</h2><div className={styles.huntChecklist}>{huntStops.map((stop, index) => <span key={stop.id}>{index + 1}. {progress[stop.id]?.state === "solved" ? "Found" : progress[stop.id]?.state === "skipped" ? "Skipped" : "Upcoming"} · {index === current ? "current stop" : `stop ${index + 1}`}</span>)}</div></div><div className={styles.huntPhonePanel}><MiniRouteMap stops={huntStops} current={current} progress={progress} cityName={cityName} /><button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setStage("playing")}>Return to current stop</button></div></div></div>}
        {stage === "finished" && <div className={styles.huntAppShell}>
          <div className={styles.landSecHead}><div><span className={styles.lbl}>Phase 08–10 — finish, memory, next action</span><h2 className={styles.landH2}>Hunt complete.</h2></div><p>Confetti moment, score summary, postcard, basket entry, sharing, rating and map return are now part of the app flow.</p></div>
          <div className={styles.huntPlayGrid}><div className={styles.huntPhonePanel}><span className={styles.lbl}>Completion moment</span><h3 className={styles.landH3}>{avatar} {teamName || "Your team"} found {solvedCount} stops</h3><div className={styles.review}><div className={styles.revRow}><span className={styles.revKey}>Route</span><span className={styles.revVal}>{huntStops.length} stops completed</span></div><div className={styles.revRow}><span className={styles.revKey}>Hints</span><span className={styles.revVal}>{huntStops.reduce((s, stop) => s + (progress[stop.id]?.clues ?? 0), 0)}</span></div><div className={styles.revRow}><span className={styles.revKey}>Score</span><span className={styles.revVal}>{isRace ? fmt(strollSeconds) : "Untimed"}</span></div></div><div className={styles.calloutAmber}><b>Basket entry.</b> Share your postcard with @stroll_city or #StrollInglewood, or use the free email route on the rules page. No purchase necessary.</div><div className={styles.landHeroCta}><button className={`${styles.btn} ${styles.btnPrimary}`} onClick={finishShare}>Share / copy caption</button><Link className={`${styles.btn} ${styles.btnGhost}`} href="/rules">Rules</Link></div></div><div className={styles.huntPhonePanel}><div className={styles.postcardArt} aria-label="Finished hunt postcard preview"><div className={styles.postcardStampBlock}>YYC</div><span className={styles.lbl}>Greetings from</span><h3>Inglewood</h3><div className={`${styles.postcardCollage} ${huntStops.length === 4 ? styles.postcardCollage4 : styles.postcardCollage8}`}>{huntStops.map((stop, index) => { const tilt = tiltFor(sessionKey, index + 20); const [a, b] = stampSwatches[index % stampSwatches.length]; const photo = progress[stop.id]?.photo; return <span key={stop.id} className={`${styles.postcardMiniStamp} ${photo ? styles.postcardMiniStampPhoto : ""}`} style={{ transform: `translate(${tilt.dx.toFixed(1)}px, ${tilt.dy.toFixed(1)}px) rotate(${tilt.rot.toFixed(2)}deg)`, background: photo ? undefined : `linear-gradient(150deg, ${a}, ${b})` }}>{photo ? <img src={photo} alt="" /> : String(index + 1).padStart(2, "0")}</span>; })}</div><div className={styles.postcardHeroFigure}><small>{isRace ? "STROLL TIME" : "INGLEWOOD"}</small><b>{isRace ? fmt(strollSeconds) : `${huntStops.length} STOPS`}</b></div><div className={styles.postcardTag}>@stroll_city<br /><b>#StrollInglewood</b></div></div><div className={styles.landHeroCta}><Link className={`${styles.btn} ${styles.btnGhost}`} href={`/${citySlug}`}>Return to Stroll map</Link><button className={`${styles.btn} ${styles.btnGhost}`} onClick={clearHunt}>Start another hunt</button></div></div></div>
        </div>}
      </section>
    </div>
  </main>;
}
