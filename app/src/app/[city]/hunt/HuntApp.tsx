"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CatIcon } from "../../StrollCityApp";
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
  lon?: number;
  lat?: number;
  address?: string;
  mono?: string;
  category?: string;
  riddle: string;
  clue_1: string;
  clue_2: string;
  clue_3: string;
  challenge?: string;
  difficulty: string;
  age_restricted: boolean;
  status: string;
};

type Progress = { state: "pending" | "solved" | "skipped"; clues: number; photo?: string; photoName?: string; solvedAt?: string };

const cluePenalty = [0, 120, 300, 600];
const productCopy = {
  friendly: "4 stops · different every time · postcard finish",
  full: "8 stops · proof photos · postcard finish",
  race: "8 stops · rotated starts · live leaderboard",
};

const stampSwatches = [
  ["#0B47E8", "#0736B8"],
  ["#F58AB4", "#C2296B"],
  ["#F5C93F", "#8A6410"],
  ["#8468E0", "#5B3FC4"],
  ["#57C07A", "#2E7D50"],
  ["#1573C6", "#12639F"],
  ["#DCF23C", "#5F7A12"],
  ["#14161A", "#55585F"],
  ["#CFDCFF", "#0B47E8"],
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
  return {
    rot: rand() * 14 - 7,
    dx: rand() * 7 - 3.5,
    dy: rand() * 7 - 3.5,
    pm: rand() * 50 - 25,
  };
}

function fmt(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

function mapLink(stop: HuntStopLite | undefined) {
  if (!stop?.lat || !stop?.lon) return "#";
  return `https://www.google.com/maps/search/?api=1&query=${stop.lat},${stop.lon}`;
}

function HuntMiniMap({ stops, current, solvedCount }: { stops: HuntStopLite[]; current: number; solvedCount: number }) {
  const plotted = stops.filter((stop) => typeof stop.lon === "number" && typeof stop.lat === "number");
  if (!plotted.length) {
    return <div className={styles.huntMapEmpty}>Map coordinates are loading. Use the Calgary map link while we reconnect the route.</div>;
  }
  const lons = plotted.map((stop) => stop.lon as number);
  const lats = plotted.map((stop) => stop.lat as number);
  const minLon = Math.min(...lons), maxLon = Math.max(...lons);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const pad = 11;
  const point = (stop: HuntStopLite) => {
    const x = pad + (((stop.lon as number) - minLon) / Math.max(0.0001, maxLon - minLon)) * (100 - pad * 2);
    const y = pad + ((maxLat - (stop.lat as number)) / Math.max(0.0001, maxLat - minLat)) * (100 - pad * 2);
    return { x, y };
  };
  const route = plotted.map((stop) => point(stop)).map((pt) => `${pt.x.toFixed(2)},${pt.y.toFixed(2)}`).join(" ");
  return (
    <div className={styles.huntMapCard} aria-label="Hunt route map">
      <div className={styles.huntMapTop}><b>Live route map</b><span>{solvedCount}/{stops.length} stops solved</span></div>
      <svg className={styles.huntMapSvg} viewBox="0 0 100 100" role="img" aria-label="Map of this hunt route">
        <defs><linearGradient id="huntMapRoute" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#0B47E8" /><stop offset="1" stopColor="#DCF23C" /></linearGradient></defs>
        <rect x="0" y="0" width="100" height="100" rx="12" />
        <path d="M8 28 C26 18 37 35 55 25 S79 18 92 30" />
        <path d="M12 68 C29 54 40 72 58 62 S78 55 90 72" />
        {plotted.length > 1 && <polyline points={route} />}
        {stops.map((stop, index) => {
          if (typeof stop.lon !== "number" || typeof stop.lat !== "number") return null;
          const pt = point(stop);
          const solved = index < current || index < solvedCount;
          const activePin = index === current;
          return <g key={stop.id} className={`${styles.huntMapPin} ${activePin ? styles.huntMapPinActive : ""} ${solved ? styles.huntMapPinSolved : ""}`} transform={`translate(${pt.x.toFixed(2)} ${pt.y.toFixed(2)})`}><circle r={activePin ? 5.6 : 4.4} /><text y="1.8">{index + 1}</text></g>;
        })}
      </svg>
      <div className={styles.huntMapLegend}><span><i /> Current stop</span><span><i /> Completed</span><span>Open map for walking directions.</span></div>
    </div>
  );
}

function rotate<T>(rows: T[], offset: number) {
  if (!rows.length) return rows;
  const n = offset % rows.length;
  return [...rows.slice(n), ...rows.slice(0, n)];
}

export default function HuntApp({ cityName, hunts, stops }: { cityName: string; hunts: Hunt[]; stops: HuntStopLite[] }) {
  const [selectedSlug, setSelectedSlug] = useState(() => {
    if (typeof window === "undefined") return hunts[0]?.slug ?? "friendly-mode";
    const type = new URLSearchParams(window.location.search).get("type");
    return hunts.find((item) => item.mode === type)?.slug ?? hunts[0]?.slug ?? "friendly-mode";
  });
  const teamInputRef = useRef<HTMLInputElement>(null);
  const [teamName, setTeamName] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [screen, setScreen] = useState<"setup" | "briefing" | "play" | "paused" | "trouble" | "finish" | "memory">("setup");
  const [now, setNow] = useState<number>(0);
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState<Record<string, Progress>>({});
  const [uploadingStopId, setUploadingStopId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [playMood, setPlayMood] = useState("Relaxed");
  const [playerRole, setPlayerRole] = useState("Explorer");
  const [avatarEmoji, setAvatarEmoji] = useState("🧭");
  const [deviceMode, setDeviceMode] = useState<"one" | "everyone">("one");
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [teamCount, setTeamCount] = useState(2);
  const [feedback, setFeedback] = useState("");
  const [leaderboard, setLeaderboard] = useState<Array<{ team: string; seconds: number }>>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("stroll-hunt-board") ?? "[]"); } catch { return []; }
  });

  const hunt = hunts.find((item) => item.slug === selectedSlug) ?? hunts[0];
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const type = params.get("type");
    if (hunts.some((item) => item.mode === type)) window.setTimeout(() => teamInputRef.current?.focus(), 60);
  }, [hunts]);

  useEffect(() => {
    if (!startedAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [startedAt]);
  const stopsById = useMemo(() => new Map(stops.map((stop) => [stop.id, stop])), [stops]);
  const huntStops = useMemo(() => {
    if (!hunt) return [];
    const raw = hunt.stop_ids.map((id) => stopsById.get(id)).filter(Boolean) as HuntStopLite[];
    const sessionOffset = teamName ? [...teamName].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) : 0;
    const rotated = hunt.mode === "race" ? rotate(raw, sessionOffset) : raw;
    return rotated.slice(0, hunt.mode === "friendly" ? 4 : 8);
  }, [hunt, stopsById, teamName]);
  const active = huntStops[current];
  const solvedCount = huntStops.filter((stop) => progress[stop.id]?.state === "solved").length;
  const isRace = hunt?.mode === "race";
  const penalties = isRace ? huntStops.reduce((total, stop) => total + cluePenalty[progress[stop.id]?.clues ?? 0], 0) : 0;
  const elapsed = startedAt && now ? Math.floor((now - startedAt) / 1000) : 0;
  const strollSeconds = isRace ? elapsed + penalties : elapsed;
  const sessionKey = `${hunt?.id ?? "hunt"}-${teamName || "guest"}`;
  const datePostmark = new Intl.DateTimeFormat("en-CA", { day: "2-digit", month: "short" }).format(new Date()).toUpperCase().replace(".", "");
  const activeClues = active ? [active.clue_1, active.clue_2, active.clue_3].filter(Boolean) : [];
  const activeSolved = active ? progress[active.id]?.state === "solved" : false;
  const activePhoto = active ? progress[active.id]?.photo : undefined;
  const allPhotosUploaded = huntStops.length > 0 && huntStops.every((stop) => Boolean(progress[stop.id]?.photo));
  const finished = huntStops.length > 0 && solvedCount === huntStops.length && allPhotosUploaded;
  const citySlug = cityName.toLowerCase();
  const inviteCode = sessionId ? sessionId.replace("session_", "").slice(-6).toUpperCase() : "READY";
  const routeDistance = hunt?.distance_m ? `${(hunt.distance_m / 1000).toFixed(1)} km` : "Walkable loop";
  const completedStops = huntStops.filter((stop) => progress[stop.id]?.state === "solved");
  const upcomingStops = huntStops.slice(Math.min(current + 1, huntStops.length));

  const start = () => {
    const started = Date.now();
    const nextSessionId = `session_${started.toString(36)}`;
    setSessionId(nextSessionId);
    setStartedAt(started);
    setNow(started);
    setCurrent(0);
    setScreen("briefing");
    setUploadError("");
    setProgress(Object.fromEntries(huntStops.map((stop) => [stop.id, { state: "pending", clues: 0 }])));
    void fetch(`/api/v1/${citySlug}/hunts/${hunt?.slug ?? selectedSlug}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team_name: teamName || "Anonymous team", mode: hunt?.mode }),
    }).catch(() => undefined);
  };

  const revealClue = () => {
    if (!active) return;
    setProgress((rows) => ({ ...rows, [active.id]: { ...(rows[active.id] ?? { state: "pending", clues: 0 }), clues: Math.min(3, (rows[active.id]?.clues ?? 0) + 1) } }));
  };

  const solve = () => {
    if (!active) return;
    const wasSolved = progress[active.id]?.state === "solved";
    setProgress((rows) => ({ ...rows, [active.id]: { ...(rows[active.id] ?? { state: "pending", clues: 0 }), state: "solved", solvedAt: rows[active.id]?.solvedAt ?? new Date().toISOString() } }));
    if (!wasSolved && current === huntStops.length - 1) {
      const next = [{ team: teamName || "Anonymous team", seconds: strollSeconds }, ...leaderboard].sort((a, b) => a.seconds - b.seconds).slice(0, 8);
      setLeaderboard(next);
      localStorage.setItem("stroll-hunt-board", JSON.stringify(next));
    }
  };

  const nextStop = () => {
    if (current < huntStops.length - 1) {
      setCurrent((n) => n + 1);
      setScreen("play");
    }
  };

  const exitHunt = () => {
    setStartedAt(null);
    setScreen("setup");
    setCurrent(0);
    setProgress({});
    setUploadError("");
  };

  const uploadPhoto = async (file: File | undefined) => {
    if (!active || !file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("Please choose a photo file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Please choose a photo under 10MB.");
      return;
    }
    const currentSessionId = sessionId || `session_${Date.now().toString(36)}`;
    if (!sessionId) setSessionId(currentSessionId);
    setUploadingStopId(active.id);
    setUploadError("");
    const form = new FormData();
    form.append("photo", file);
    form.append("stop_id", active.id);
    form.append("team_name", teamName || "Anonymous team");
    const response = await fetch(`/api/v1/${citySlug}/sessions/${encodeURIComponent(currentSessionId)}/photos`, { method: "POST", body: form });
    const payload = await response.json().catch(() => null) as { ok?: boolean; data?: { url?: string; file_name?: string }; error?: string } | null;
    setUploadingStopId(null);
    if (!response.ok || !payload?.ok || !payload.data?.url) {
      setUploadError(payload?.error ?? "Photo upload did not finish. Please try again.");
      return;
    }
    setProgress((rows) => ({
      ...rows,
      [active.id]: { ...(rows[active.id] ?? { state: "solved", clues: 0 }), state: "solved", photo: payload.data?.url, photoName: file.name, solvedAt: rows[active.id]?.solvedAt ?? new Date().toISOString() },
    }));
    if (current === huntStops.length - 1) setScreen("finish");
  };

  const sharePostcard = async () => {
    const text = `${teamName || "Our team"} finished ${hunt?.name ?? "a Stroll City hunt"} in Inglewood. #StrollInglewood @stroll_city`;
    if (typeof window === "undefined") return;
    const url = window.location.href;
    const nav = window.navigator;
    if (typeof nav.share === "function") {
      await nav.share({ title: "Stroll City postcard", text, url });
      return;
    }
    await nav.clipboard?.writeText(`${text} ${url}`);
  };

  return (
    <main className={styles.landing}>
      <nav className={styles.landNav}><div className={styles.landNavIn}>
        <Link className={styles.landBrand} href="/"><img src="/brand/stroll-mark.png" alt="" /><span className={styles.landBrandName}>STROLL <span>CITY</span></span></Link>
        <div className={styles.landNavLinks}><Link href={`/${cityName.toLowerCase()}`}>Map</Link><Link href="/business">For businesses</Link></div>
        <span className={styles.landSp} /><Link className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`} href={`/${cityName.toLowerCase()}`}>Back to map</Link>
      </div></nav>

      <div className={styles.landWrap}>
        <header className={styles.landHero}>
          <div className={styles.landHeroCard}><div className={styles.landHeroGrid}>
            <div className={styles.landHeroCopy}>
              <span className={styles.landEyebrow}><i /> {cityName} scavenger hunt</span>
              <h1 className={styles.landH1}>Solve the street,<br />one doorway at a time.</h1>
              <p className={styles.landHeroSub}>Riddles reveal the next shop only after your team solves the current one. Proof photos stay private; the finish creates a shareable postcard.</p>
              {!startedAt ? <>
                <div className={styles.grid2}>
                  <div className={styles.claimField}><label>Team name</label><div className={styles.ctl}><input ref={teamInputRef} value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="The Sidewalk Sleuths" /></div></div>
                  <div className={styles.claimField}><label>Hunt type</label><div className={styles.ctl}><select value={selectedSlug} onChange={(e) => { setSelectedSlug(e.target.value); setStartedAt(null); setScreen("setup"); setProgress({}); }}>
                    {hunts.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
                  </select></div></div>
                </div>
                <div className={styles.huntSetupGrid}>
                  <div className={styles.claimField}><label>Nickname or avatar</label><div className={styles.avatarPick}>{["🧭", "📷", "🕵️", "🦊"].map((emoji) => <button key={emoji} type="button" aria-pressed={avatarEmoji === emoji} onClick={() => setAvatarEmoji(emoji)}>{emoji}</button>)}</div></div>
                  <div className={styles.claimField}><label>Play style</label><div className={styles.segmentedMini}>{["Relaxed", "Competitive", "Family-friendly"].map((mood) => <button key={mood} type="button" aria-pressed={playMood === mood} onClick={() => setPlayMood(mood)}>{mood}</button>)}</div></div>
                  <div className={styles.claimField}><label>Your role</label><div className={styles.segmentedMini}>{["Explorer", "Photographer", "Trivia hunter"].map((role) => <button key={role} type="button" aria-pressed={playerRole === role} onClick={() => setPlayerRole(role)}>{role}</button>)}</div></div>
                  <div className={styles.claimField}><label>Devices</label><div className={styles.segmentedMini}><button type="button" aria-pressed={deviceMode === "one"} onClick={() => setDeviceMode("one")}>One device</button><button type="button" aria-pressed={deviceMode === "everyone"} onClick={() => setDeviceMode("everyone")}>Everyone joins</button></div></div>
                </div>
                {isRace && <div className={styles.raceSetupStrip}><span>Teams</span><button type="button" onClick={() => setTeamCount((n) => Math.max(2, n - 1))}>−</button><b>{teamCount}</b><button type="button" onClick={() => setTeamCount((n) => Math.min(8, n + 1))}>+</button><em>{teamCount} teams × $20 = ${teamCount * 20}</em></div>}
                {hunt?.mode === "race" && <div className={styles.grid2}><div className={styles.claimField}><label>Event name</label><div className={styles.ctl}><input value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="Friday loop race" /></div></div><div className={styles.claimField}><label>Date</label><div className={styles.ctl}><input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} /></div></div></div>}
                <div className={styles.landHeroCta}><button className={`${styles.btn} ${styles.btnPrimary}`} onClick={start}>Start this hunt</button><Link className={`${styles.btn} ${styles.btnGhost}`} href={`/${cityName.toLowerCase()}`}>Browse map first</Link></div>
              </> : <>
                <div className={styles.huntNowBar}>
                  <div><b>{avatarEmoji} {teamName || "Your team"}</b><span>{hunt?.name} · stop {current + 1} of {huntStops.length} · invite {inviteCode}</span></div>
                  <div><b>{isRace ? fmt(strollSeconds) : `${solvedCount}/${huntStops.length}`}</b><span>{isRace ? "Stroll Time" : "Stops solved"}</span></div>
                </div>
                <div className={styles.huntScreenRail} aria-label="Hunt screen roadmap">
                  {[["briefing", "Briefing"], ["play", "Current stop"], ["paused", "Pause"], ["trouble", "Help"], ["finish", "Finish"], ["memory", "Memories"]].map(([key, label]) => <button key={key} type="button" aria-current={screen === key ? "step" : undefined} onClick={() => setScreen(key as typeof screen)}>{label}</button>)}
                </div>
                <div className={styles.landHeroCta}><button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setScreen("play")}>Return to current stop</button><button className={`${styles.btn} ${styles.btnGhost}`} onClick={exitHunt}>Restart setup</button></div>
              </>}
            </div>
            <div className={styles.landShowcase} style={{ padding: 24, height: "auto" }}>
              <span className={styles.lbl}>Products</span>
              <div className={styles.locked} style={{ marginTop: 16 }}>{hunts.map((item) => <button key={item.id} className={styles.plan} aria-pressed={item.slug === selectedSlug} onClick={() => setSelectedSlug(item.slug)}><span className={styles.planBody}><span className={styles.planTop}><span className={styles.planName}>{item.name}</span><span className={styles.planPrice}>{item.mode === "friendly" ? "Free" : item.mode === "race" ? "$15/team" : "$20/team"}</span></span><span className={styles.planDesc}>{productCopy[item.mode]}</span></span></button>)}</div>
            </div>
          </div></div>
        </header>

        <section className={styles.landBlk}>
          <div className={styles.landSecHead}><div className={styles.landSecHeadL}><span className={styles.lbl}>Play</span><h2 className={styles.landH2}>{hunt?.name ?? "Hunt"}</h2></div><p>{hunt?.blurb}</p></div>
          <div className={styles.landDuo}>
            <div className={styles.landBigCard}>
              {!startedAt || !active ? <>
                <span className={styles.lbl}>Branch A · solo, team or event</span>
                <h3 className={styles.landH3}>Start with the smallest useful setup.</h3>
                <p className={styles.landCardP}>Pick a nickname, avatar, play style and device mode. Race hosts can set teams, date and event name before the shared invite code appears.</p>
                <div className={styles.huntInfoGrid}>
                  <div><b>{avatarEmoji} {teamName || "Your team"}</b><span>{playMood} · {playerRole}</span></div>
                  <div><b>{deviceMode === "one" ? "One shared device" : "Everyone on their own device"}</b><span>Invite code and QR unlock after start.</span></div>
                  <div><b>{isRace ? `${teamCount} teams` : `${hunt?.mode === "friendly" ? 4 : 8} stops`}</b><span>{isRace ? "Same route · staggered starts." : "Map, distance and directions included."}</span></div>
                </div>
              </> : screen === "briefing" ? <>
                <span className={styles.lbl}>Universal pre-game</span>
                <h3 className={styles.landH3}>Get everyone to the first doorway before the game starts.</h3>
                <div className={styles.huntRouteCard}><b>First-stop directions</b><span>{routeDistance} · walking directions · open in maps</span><Link href={mapLink(active)} target="_blank">Open map to stop 1 →</Link></div>
                <HuntMiniMap stops={huntStops} current={0} solvedCount={solvedCount} />
                <div className={styles.huntInfoGrid}>
                  <div><b>You&apos;re close</b><span>Location prompts switch from “keep walking” to “you&apos;ve arrived”.</span></div>
                  <div><b>Photos and clues</b><span>{isRace ? "Clues add race time; photos prove the stop." : "Clues are free; photos build your postcard."}</span></div>
                  <div><b>Invite {inviteCode}</b><span>{deviceMode === "everyone" ? "Joined players appear in the waiting state." : "Perfect for people sharing one phone."}</span></div>
                </div>
                <div className={styles.landHeroCta}><button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setScreen("play")}>Begin official gameplay</button><button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setScreen("setup")}>Adjust setup</button></div>
              </> : screen === "paused" ? <>
                <span className={styles.lbl}>Pause and interruption</span>
                <h3 className={styles.landH3}>Your hunt is saved right here.</h3>
                <p className={styles.landCardP}>Timer and progress stop while paused. Resume returns exactly to stop {current + 1}, with the same clues, photos and active hunt card.</p>
                <div className={styles.huntInfoGrid}><div><b>Active hunt card</b><span>{hunt?.name} · {solvedCount}/{huntStops.length} solved.</span></div><div><b>Progress saved</b><span>Current stop, photos and clues stay attached to this session.</span></div></div>
                <div className={styles.landHeroCta}><button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setScreen("play")}>Resume hunt</button><button className={`${styles.btn} ${styles.btnGhost}`} onClick={exitHunt}>Exit and clear progress</button></div>
              </> : screen === "trouble" ? <>
                <span className={styles.lbl}>Help if the street gets messy</span>
                <h3 className={styles.landH3}>Keep walking without losing the game.</h3>
                <div className={styles.troubleGrid}>{["Continue manually or open directions", "Explain why photo access is needed", "Cached clue and retry connection", "You may not be at the right place", "Rejoin via team code", "Confirm skip and point impact", "Alternative clue or bypass stop"].map((item) => <div key={item}>{item}</div>)}</div>
                <div className={styles.landHeroCta}><button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setScreen("play")}>Back to current stop</button><button className={`${styles.btn} ${styles.btnGhost}`} onClick={revealClue}>Show another clue</button></div>
              </> : screen === "finish" || screen === "memory" ? <>
                <span className={styles.lbl}>{screen === "finish" ? "Final stop" : "Memory and retention"}</span>
                <h3 className={styles.landH3}>{screen === "finish" ? "Complete the hunt, then make it worth remembering." : "Your route, photos and postcard live here."}</h3>
                <div className={styles.finishStats}><div><b>{solvedCount}/{huntStops.length}</b><span>Stops solved</span></div><div><b>{isRace ? fmt(strollSeconds) : "No clock"}</b><span>{isRace ? "Stroll Time" : "Walk at your pace"}</span></div><div><b>{activeClues.length}</b><span>Hints available</span></div></div>
                {screen === "memory" && <><div className={styles.memoryStrip}>{completedStops.map((stop) => <span key={stop.id}>{stop.name}</span>)}</div><textarea className={styles.ctl} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Quick rating or note for next time" /></>}
                <div className={styles.landHeroCta}><button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setScreen("memory")}>View photos and postcard</button><Link className={`${styles.btn} ${styles.btnGhost}`} href={`/${citySlug}`}>Another Calgary neighbourhood</Link></div>
              </> : <>
                <span className={styles.lbl}>Stop {current + 1} of {huntStops.length} · {active.difficulty}</span>
                <h3 className={styles.landH3}>{activeSolved ? active.name : "Find this mystery stop"}</h3>
                <div className={styles.huntPlayGrid}>
                  <div>
                    <p className={`${styles.landCardP} ${styles.landRiddle}`} style={{ whiteSpace: "pre-wrap" }}>{active.riddle}</p>
                    <div className={styles.locked}>{activeClues.slice(0, progress[active.id]?.clues ?? 0).map((clue, index) => <div className={styles.callout} key={`${active.id}-clue-${index}`}><b>Clue {index + 1}</b> {clue}</div>)}</div>
                  </div>
                  <div className={styles.huntMapColumn}>
                    <HuntMiniMap stops={huntStops} current={current} solvedCount={solvedCount} />
                    <div className={styles.huntRouteCard}><b>{activeSolved ? active.name : "Current search zone"}</b><span>{active.address ?? "Inglewood business district"}</span><Link href={mapLink(active)} target="_blank">Open map / directions →</Link></div>
                  </div>
                </div>
                {activeSolved && <div className={styles.callout}><CatIcon d="M4 7h4l2-2h4l2 2h4v12H4z" size={17} /> <span><b>Photo to take:</b> {active.challenge ?? "Photograph the doorway from the sidewalk before moving on."}</span></div>}
                {activeSolved && (
                  <div className={styles.photoUploadPanel}>
                    {activePhoto ? <img className={styles.uploadedPhotoPreview} src={activePhoto} alt={`Uploaded proof for ${active.name}`} /> : null}
                    <div>
                      <label className={`${styles.btn} ${styles.btnGhost} ${uploadingStopId === active.id ? styles.btnDisabled : ""}`}>
                        {uploadingStopId === active.id ? "Uploading photo…" : activePhoto ? "Replace postcard photo" : "Upload photo to postcard"}
                        <input type="file" accept="image/*" capture="environment" disabled={uploadingStopId === active.id} onChange={(event) => { void uploadPhoto(event.target.files?.[0]); event.currentTarget.value = ""; }} />
                      </label>
                      <p className={styles.photoUploadHint}>{activePhoto ? "This stop will use your uploaded photo on the finished postcard." : "Upload the photo you just took so the final postcard is authentically yours."}</p>
                    </div>
                  </div>
                )}
                {uploadError && <div className={styles.calloutAmber}>{uploadError}</div>}
                <div className={styles.landHeroCta}>
                  <button className={`${styles.btn} ${styles.btnGhost}`} onClick={revealClue} disabled={(progress[active.id]?.clues ?? 0) >= 3}>Reveal clue{isRace ? " (+ penalty)" : ""}</button>
                  <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setScreen("trouble")}>Need help</button>
                  <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setScreen("paused")}>Pause</button>
                  {activeSolved && current < huntStops.length - 1 ? <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={nextStop} disabled={!activePhoto || uploadingStopId === active.id}>Photo uploaded — next stop</button> : <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={solve} disabled={activeSolved && !activePhoto}>{activeSolved ? (activePhoto ? "Postcard photo uploaded" : "Upload photo to finish stop") : "Mark solved"}</button>}
                </div>
              </>}
            </div>
            <div className={styles.landBigCard}>
              <span className={styles.lbl}>Punch card</span>
              <div className={`${styles.cardstock} ${styles.punchcard}`}>
                <div className={styles.punchStub}>
                  <span className={styles.punchMark}><CatIcon d="M11.6 21l1.7-5.6-2.6-2.2.9-4.4-3.1 1.5-1.2 3M13.3 8.8l2.6 2.3 3.1.6M10.7 13.2 7.9 21" size={14} strokeWidth={1.7} color="var(--accent-ink)" /></span>
                  <span className={styles.punchVert}>{hunt?.name ?? "Stroll hunt"}</span>
                  <span className={styles.punchSerial}>No. {String(hash32(sessionKey) % 100000).padStart(5, "0")}</span>
                </div>
                <div className={styles.punchBody}>
                  <div className={styles.punchTop}>
                    <div>
                      <h3 className={styles.punchTitle}>{hunt?.name ?? "Stroll hunt"}</h3>
                      <p className={styles.punchMeta}>{cityName} · {huntStops.length || (hunt?.mode === "friendly" ? 4 : 8)} stops</p>
                    </div>
                    {isRace && <div className={styles.punchClock}>
                      <span>{fmt(elapsed)}</span>{penalties > 0 && <span className={styles.punchPenalty}> (+{Math.round(penalties / 60)})</span>}
                      <small>Stroll Time {fmt(strollSeconds)}</small>
                    </div>}
                  </div>
                  <div className={styles.punchSlots}>
                    {huntStops.map((stop, index) => {
                      const solved = progress[stop.id]?.state === "solved";
                      const photo = progress[stop.id]?.photo;
                      const next = startedAt && index === current && !solved;
                      const tilt = tiltFor(sessionKey, index);
                      const [a, b] = stampSwatches[index % stampSwatches.length];
                      return (
                        <div className={`${styles.punchSlot} ${next ? styles.punchSlotNext : ""}`} key={stop.id}>
                          <div className={styles.punchWell}><span>{index + 1}</span></div>
                          {solved && (
                            <div className={styles.punchStamp} style={{ transform: `translate(${tilt.dx.toFixed(1)}px, ${tilt.dy.toFixed(1)}px) rotate(${tilt.rot.toFixed(2)}deg)` }}>
                              <div className={styles.punchStampPaper}>
                                <div className={`${styles.punchStampPhoto} ${photo ? styles.punchStampPhotoUploaded : ""}`} style={photo ? undefined : { background: `linear-gradient(150deg, ${a}, ${b})` }}>
                                  {photo ? <img src={photo} alt="" /> : <span>{stop.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span>}
                                </div>
                                <span className={styles.punchDenom}>{String(index + 1).padStart(2, "0")}</span>
                              </div>
                              <div className={styles.punchPostmark} style={{ transform: `rotate(${tilt.pm.toFixed(1)}deg)` }}>
                                <span>Inglewood</span><b>{datePostmark}</b><span>YYC</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className={styles.punchFoot}>
                    <span>{solvedCount} of {huntStops.length || (hunt?.mode === "friendly" ? 4 : 8)} solved</span>
                    <span>Photos stay private · #StrollInglewood</span>
                  </div>
                </div>
              </div>
              {startedAt && <div className={styles.huntDashboard}>
                <div><b>Completed</b><span>{completedStops.length ? completedStops.map((stop) => stop.name).join(" · ") : "No stops found yet"}</span></div>
                <div><b>Upcoming</b><span>{upcomingStops.length ? `${upcomingStops.length} stops left` : "Final screen ready"}</span></div>
                <div><b>{deviceMode === "everyone" ? "Players" : "Device"}</b><span>{deviceMode === "everyone" ? `${teamName || "Leader"}, photographer, trivia hunter` : "Shared phone mode"}</span></div>
                <div><b>Photos</b><span>{huntStops.filter((stop) => progress[stop.id]?.photo).length} captured so far</span></div>
              </div>}
              {solvedCount === huntStops.length && !allPhotosUploaded && <div className={styles.calloutAmber}><b>Almost there.</b> Upload the remaining stop photos and your postcard will be built from the pictures your team actually took.</div>}
              {finished && <div className={styles.calloutAmber}><b>Win the Inglewood Basket.</b> Share your postcard publicly tagging <b>@stroll_city</b> or <b>#StrollInglewood</b> and you’re entered in this month’s draw — a basket donated by ten Inglewood businesses, worth around $250. Entering is optional; the hunt is free either way. One entry per completed hunt. No purchase necessary. Alberta residents 18+. Winner answers a skill-testing question. <Link href="/rules">Full rules →</Link></div>}
              {finished && (
                <div className={styles.postcardArt} aria-label="Finished hunt postcard preview">
                  <div className={styles.postcardStampBlock}>YYC</div>
                  <span className={styles.lbl}>Greetings from</span>
                  <h3>Inglewood</h3>
                  <div className={`${styles.postcardCollage} ${huntStops.length === 4 ? styles.postcardCollage4 : styles.postcardCollage8}`}>
                    {huntStops.map((stop, index) => {
                      const tilt = tiltFor(sessionKey, index + 20);
                      const [a, b] = stampSwatches[index % stampSwatches.length];
                      const photo = progress[stop.id]?.photo;
                      return <span key={stop.id} className={`${styles.postcardMiniStamp} ${photo ? styles.postcardMiniStampPhoto : ""}`} style={{ transform: `translate(${tilt.dx.toFixed(1)}px, ${tilt.dy.toFixed(1)}px) rotate(${tilt.rot.toFixed(2)}deg)`, background: photo ? undefined : `linear-gradient(150deg, ${a}, ${b})` }}>{photo ? <img src={photo} alt="" /> : String(index + 1).padStart(2, "0")}</span>;
                    })}
                  </div>
                  <div className={styles.postcardHeroFigure}><small>{isRace ? "STROLL TIME" : "INGLEWOOD"}</small><b>{isRace ? fmt(strollSeconds) : `${huntStops.length} STOPS`}</b></div>
                  <div className={styles.postcardTag}>@stroll_city<br /><b>#StrollInglewood</b></div>
                </div>
              )}
              {finished && <div className={styles.landHeroCta}><button className={`${styles.btn} ${styles.btnPrimary}`} onClick={sharePostcard}>Share postcard to enter</button><Link className={`${styles.btn} ${styles.btnGhost}`} href="/rules">Basket rules</Link></div>}
              {leaderboard.length > 0 && isRace && <div className={styles.review} style={{ marginTop: 16 }}>{leaderboard.map((row, i) => <div className={styles.revRow} key={`${row.team}-${i}`}><span className={styles.revKey}>#{i + 1}</span><span className={styles.revVal}>{row.team}<br /><span className={styles.revSub}>{Math.floor(row.seconds / 60)}m {row.seconds % 60}s</span></span></div>)}</div>}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
