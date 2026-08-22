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
  name: string;
  riddle: string;
  clue_1: string;
  clue_2: string;
  clue_3: string;
  challenge: string;
  difficulty: string;
  age_restricted: boolean;
  status: string;
};

type Progress = { state: "pending" | "solved" | "skipped"; clues: number; photo?: string; solvedAt?: string };

const cluePenalty = [0, 120, 300, 600];
const productCopy = {
  friendly: "4 stops · no clock · different every time",
  full: "8 stops · no clock · postcard finish",
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
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(0);
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState<Record<string, Progress>>({});
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
  const finished = huntStops.length > 0 && solvedCount === huntStops.length;
  const isRace = hunt?.mode === "race";
  const penalties = isRace ? huntStops.reduce((total, stop) => total + cluePenalty[progress[stop.id]?.clues ?? 0], 0) : 0;
  const elapsed = startedAt && now ? Math.floor((now - startedAt) / 1000) : 0;
  const strollSeconds = isRace ? elapsed + penalties : elapsed;
  const sessionKey = `${hunt?.id ?? "hunt"}-${teamName || "guest"}`;
  const datePostmark = new Intl.DateTimeFormat("en-CA", { day: "2-digit", month: "short" }).format(new Date()).toUpperCase().replace(".", "");
  const activeClues = active ? [active.clue_1, active.clue_2, active.clue_3].filter(Boolean) : [];

  const start = () => {
    const started = Date.now();
    setStartedAt(started);
    setNow(started);
    setCurrent(0);
    setProgress(Object.fromEntries(huntStops.map((stop) => [stop.id, { state: "pending", clues: 0 }])));
  };

  const revealClue = () => {
    if (!active) return;
    setProgress((rows) => ({ ...rows, [active.id]: { ...(rows[active.id] ?? { state: "pending", clues: 0 }), clues: Math.min(3, (rows[active.id]?.clues ?? 0) + 1) } }));
  };

  const solve = () => {
    if (!active) return;
    setProgress((rows) => ({ ...rows, [active.id]: { ...(rows[active.id] ?? { state: "pending", clues: 0 }), state: "solved", solvedAt: new Date().toISOString() } }));
    if (current < huntStops.length - 1) setCurrent((n) => n + 1);
    else {
      const next = [{ team: teamName || "Anonymous team", seconds: strollSeconds }, ...leaderboard].sort((a, b) => a.seconds - b.seconds).slice(0, 8);
      setLeaderboard(next);
      localStorage.setItem("stroll-hunt-board", JSON.stringify(next));
    }
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
              <div className={styles.grid2}>
                <div className={styles.claimField}><label>Team name</label><div className={styles.ctl}><input ref={teamInputRef} value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="The Sidewalk Sleuths" /></div></div>
                <div className={styles.claimField}><label>Hunt type</label><div className={styles.ctl}><select value={selectedSlug} onChange={(e) => { setSelectedSlug(e.target.value); setStartedAt(null); setProgress({}); }}>
                  {hunts.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
                </select></div></div>
              </div>
              <div className={styles.landHeroCta}><button className={`${styles.btn} ${styles.btnPrimary}`} onClick={start}>Start this hunt</button><Link className={`${styles.btn} ${styles.btnGhost}`} href={`/${cityName.toLowerCase()}`}>Browse map first</Link></div>
            </div>
            <div className={styles.landShowcase} style={{ padding: 24, height: "auto" }}>
              <span className={styles.lbl}>Products</span>
              <div className={styles.locked} style={{ marginTop: 16 }}>{hunts.map((item) => <button key={item.id} className={styles.plan} aria-pressed={item.slug === selectedSlug} onClick={() => setSelectedSlug(item.slug)}><span className={styles.planBody}><span className={styles.planTop}><span className={styles.planName}>{item.name}</span><span className={styles.planPrice}>{item.mode === "friendly" ? "Free" : item.mode === "race" ? "$20/team" : "$20/team"}</span></span><span className={styles.planDesc}>{productCopy[item.mode]}</span></span></button>)}</div>
            </div>
          </div></div>
        </header>

        <section className={styles.landBlk}>
          <div className={styles.landSecHead}><div className={styles.landSecHeadL}><span className={styles.lbl}>Play</span><h2 className={styles.landH2}>{hunt?.name ?? "Hunt"}</h2></div><p>{hunt?.blurb}</p></div>
          <div className={styles.landDuo}>
            <div className={styles.landBigCard}>
              {!startedAt || !active ? <p className={styles.landCardP}>Start the hunt to draw your stops. Loop Race rotates the same 8-stop route so teams start apart and no destination is named while the race is running.</p> : <>
                <span className={styles.lbl}>Stop {current + 1} of {huntStops.length} · {active.difficulty}</span>
                <h3 className={styles.landH3}>Mystery stop</h3>
                <p className={styles.landCardP} style={{ whiteSpace: "pre-wrap" }}>{active.riddle}</p>
                <div className={styles.locked}>{activeClues.slice(0, progress[active.id]?.clues ?? 0).map((clue, index) => <div className={styles.callout} key={`${active.id}-clue-${index}`}><b>Clue {index + 1}</b> {clue}</div>)}</div>
                <div className={styles.callout}><CatIcon d="M4 7h4l2-2h4l2 2h4v12H4z" size={17} /> <span><b>{(progress[active.id]?.clues ?? 0) >= 3 ? "Proof photo challenge:" : "Proof photo locked:"}</b> {(progress[active.id]?.clues ?? 0) >= 3 ? active.challenge : "Reveal the final clue when you want the shop and photo prompt shown."}</span></div>
                <div className={styles.landHeroCta}><button className={`${styles.btn} ${styles.btnGhost}`} onClick={revealClue}>Reveal clue{isRace ? " (+ penalty)" : ""}</button><button className={`${styles.btn} ${styles.btnPrimary}`} onClick={solve}>Mark solved</button></div>
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
                      const next = startedAt && index === current && !solved;
                      const tilt = tiltFor(sessionKey, index);
                      const [a, b] = stampSwatches[index % stampSwatches.length];
                      return (
                        <div className={`${styles.punchSlot} ${next ? styles.punchSlotNext : ""}`} key={stop.id}>
                          <div className={styles.punchWell}><span>{index + 1}</span></div>
                          {solved && (
                            <div className={styles.punchStamp} style={{ transform: `translate(${tilt.dx.toFixed(1)}px, ${tilt.dy.toFixed(1)}px) rotate(${tilt.rot.toFixed(2)}deg)` }}>
                              <div className={styles.punchStampPaper}>
                                <div className={styles.punchStampPhoto} style={{ background: `linear-gradient(150deg, ${a}, ${b})` }}>
                                  <span>{stop.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span>
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
              {finished && <div className={styles.calloutAmber}><b>Postcard ready:</b> {teamName || "Your team"} solved {huntStops.length} stops. Your finish also opens Inglewood Basket entry, with the CASL consent kept separate and optional. <Link href="/rules">Read the Basket rules</Link>.</div>}
              {finished && (
                <div className={styles.postcardArt} aria-label="Finished hunt postcard preview">
                  <div className={styles.postcardStampBlock}>YYC</div>
                  <span className={styles.lbl}>Greetings from</span>
                  <h3>Inglewood</h3>
                  <div className={`${styles.postcardCollage} ${huntStops.length === 4 ? styles.postcardCollage4 : styles.postcardCollage8}`}>
                    {huntStops.map((stop, index) => {
                      const tilt = tiltFor(sessionKey, index + 20);
                      const [a, b] = stampSwatches[index % stampSwatches.length];
                      return <span key={stop.id} className={styles.postcardMiniStamp} style={{ transform: `translate(${tilt.dx.toFixed(1)}px, ${tilt.dy.toFixed(1)}px) rotate(${tilt.rot.toFixed(2)}deg)`, background: `linear-gradient(150deg, ${a}, ${b})` }}>{String(index + 1).padStart(2, "0")}</span>;
                    })}
                  </div>
                  <div className={styles.postcardHeroFigure}><small>{isRace ? "STROLL TIME" : "INGLEWOOD"}</small><b>{isRace ? fmt(strollSeconds) : `${huntStops.length} STOPS`}</b></div>
                  <div className={styles.postcardTag}>@stroll_city<br /><b>#StrollInglewood</b></div>
                </div>
              )}
              {leaderboard.length > 0 && isRace && <div className={styles.review} style={{ marginTop: 16 }}>{leaderboard.map((row, i) => <div className={styles.revRow} key={`${row.team}-${i}`}><span className={styles.revKey}>#{i + 1}</span><span className={styles.revVal}>{row.team}<br /><span className={styles.revSub}>{Math.floor(row.seconds / 60)}m {row.seconds % 60}s</span></span></div>)}</div>}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
