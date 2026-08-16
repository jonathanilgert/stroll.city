"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
  full: "6–9 stops · Stroll Time, clues and a postcard finish",
  race: "Rotated starts · live local leaderboard · destinations hidden",
};

function rotate<T>(rows: T[], offset: number) {
  if (!rows.length) return rows;
  const n = offset % rows.length;
  return [...rows.slice(n), ...rows.slice(0, n)];
}

export default function HuntApp({ cityName, hunts, stops }: { cityName: string; hunts: Hunt[]; stops: HuntStopLite[] }) {
  const [selectedSlug, setSelectedSlug] = useState(hunts[0]?.slug ?? "friendly-mode");
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
    return rotated.slice(0, hunt.mode === "friendly" ? 4 : hunt.mode === "race" ? 6 : 8);
  }, [hunt, stopsById, teamName]);
  const active = huntStops[current];
  const solvedCount = huntStops.filter((stop) => progress[stop.id]?.state === "solved").length;
  const finished = huntStops.length > 0 && solvedCount === huntStops.length;
  const penalties = huntStops.reduce((total, stop) => total + cluePenalty[progress[stop.id]?.clues ?? 0], 0);
  const elapsed = startedAt && now ? Math.floor((now - startedAt) / 1000) : 0;
  const strollSeconds = elapsed + penalties;

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
              <span className={styles.landEyebrow}><i /> {cityName} scavenger hunt · beta</span>
              <h1 className={styles.landH1}>Solve the street,<br />one doorway at a time.</h1>
              <p className={styles.landHeroSub}>Riddles reveal the next shop only after your team solves the current one. Proof photos stay private; the finish creates a shareable postcard.</p>
              <div className={styles.grid2}>
                <div className={styles.claimField}><label>Team name</label><div className={styles.ctl}><input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="The Sidewalk Sleuths" /></div></div>
                <div className={styles.claimField}><label>Hunt type</label><div className={styles.ctl}><select value={selectedSlug} onChange={(e) => { setSelectedSlug(e.target.value); setStartedAt(null); setProgress({}); }}>
                  {hunts.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
                </select></div></div>
              </div>
              <div className={styles.landHeroCta}><button className={`${styles.btn} ${styles.btnPrimary}`} onClick={start}>Start this hunt</button><Link className={`${styles.btn} ${styles.btnGhost}`} href={`/${cityName.toLowerCase()}`}>Browse map first</Link></div>
            </div>
            <div className={styles.landShowcase} style={{ padding: 24, height: "auto" }}>
              <span className={styles.lbl}>Products</span>
              <div className={styles.locked} style={{ marginTop: 16 }}>{hunts.map((item) => <button key={item.id} className={styles.plan} aria-pressed={item.slug === selectedSlug} onClick={() => setSelectedSlug(item.slug)}><span className={styles.planBody}><span className={styles.planTop}><span className={styles.planName}>{item.name}</span><span className={styles.planPrice}>{item.mode === "friendly" ? "Free" : item.mode === "race" ? "$99" : "$20/team"}</span></span><span className={styles.planDesc}>{productCopy[item.mode]}</span></span></button>)}</div>
            </div>
          </div></div>
        </header>

        <section className={styles.landBlk}>
          <div className={styles.landSecHead}><div className={styles.landSecHeadL}><span className={styles.lbl}>Play</span><h2 className={styles.landH2}>{hunt?.name ?? "Hunt"}</h2></div><p>{hunt?.blurb}</p></div>
          <div className={styles.landDuo}>
            <div className={styles.landBigCard}>
              {!startedAt || !active ? <p className={styles.landCardP}>Start the hunt to draw your stops. Race mode rotates the same loop so teams start apart and no destination is named while the race is running.</p> : <>
                <span className={styles.lbl}>Stop {current + 1} of {huntStops.length} · {active.difficulty}</span>
                <h3 className={styles.landH3}>{hunt?.mode === "race" ? "Mystery stop" : active.name}</h3>
                <p className={styles.landCardP} style={{ whiteSpace: "pre-wrap" }}>{active.riddle}</p>
                <div className={styles.locked}>{[active.clue_1, active.clue_2, active.clue_3].slice(0, progress[active.id]?.clues ?? 0).map((clue, index) => <div className={styles.callout} key={clue}><b>Clue {index + 1}</b> {clue}</div>)}</div>
                <div className={styles.callout}><CatIcon d="M4 7h4l2-2h4l2 2h4v12H4z" size={17} /> <span><b>Proof photo challenge:</b> {active.challenge}</span></div>
                <div className={styles.landHeroCta}><button className={`${styles.btn} ${styles.btnGhost}`} onClick={revealClue}>Reveal clue (+ penalty)</button><button className={`${styles.btn} ${styles.btnPrimary}`} onClick={solve}>Mark solved / stamp card</button></div>
              </>}
            </div>
            <div className={styles.landBigCard}>
              <span className={styles.lbl}>Punch card</span>
              <div className={styles.landStats} style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>{huntStops.map((stop, index) => <div className={styles.landStat} key={stop.id}><div className={styles.landStatV}>{progress[stop.id]?.state === "solved" ? "✓" : index + 1}</div><div className={styles.landStatK}>{progress[stop.id]?.state === "solved" ? "Stamped" : "Open"}</div></div>)}</div>
              <p className={styles.landCardP}>Stroll Time: {Math.floor(strollSeconds / 60)}m {strollSeconds % 60}s · clue penalty {Math.floor(penalties / 60)}m</p>
              {finished && <div className={styles.calloutAmber}><b>Postcard ready:</b> {teamName || "Your team"} solved {huntStops.length} stops in {Math.floor(strollSeconds / 60)} minutes. Share this finish screen to enter the Inglewood Basket draw.</div>}
              {leaderboard.length > 0 && <div className={styles.review} style={{ marginTop: 16 }}>{leaderboard.map((row, i) => <div className={styles.revRow} key={`${row.team}-${i}`}><span className={styles.revKey}>#{i + 1}</span><span className={styles.revVal}>{row.team}<br /><span className={styles.revSub}>{Math.floor(row.seconds / 60)}m {row.seconds % 60}s</span></span></div>)}</div>}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
