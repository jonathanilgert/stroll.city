"use client";

import Link from "next/link";
import { use, useState } from "react";
import styles from "../../page.module.css";

export default function RaceJoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: codeParam } = use(params);
  const code = codeParam.toUpperCase();
  const [team, setTeam] = useState("Team Sidewalk");
  const [status, setStatus] = useState("Open this on one phone per team. No account, no individual payment.");

  const join = async () => {
    const response = await fetch(`/api/v1/races/${code}/join`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ team_name: team }) });
    const json = await response.json();
    setStatus(response.ok ? `Joined ${json.data.code}. Start index ${json.data.start_index}; wait for host start.` : json.error);
  };

  return <main className={styles.landing}><nav className={styles.landNav}><div className={styles.landNavIn}><Link className={styles.landBrand} href="/"><img src="/brand/stroll-mark.png" alt="" /><span className={styles.landBrandName}>STROLL <span>CITY</span></span></Link><div className={styles.landNavLinks}><Link href="/calgary/hunt">Hunts</Link><Link href="/events">Book a race</Link></div></div></nav><div className={styles.landWrap}><section className={styles.landBlk}><div className={styles.landBigCard}><span className={styles.lbl}>Scavenger Hunt Race</span><h1 className={styles.landH2}>Join race {code}</h1><p className={styles.landCardP}>Each team starts at a rotated stop, wraps around the same loop, and shares the live leaderboard.</p><div className={styles.claimField}><label>Team name</label><div className={styles.ctl}><input value={team} onChange={(e) => setTeam(e.target.value)} /></div></div><div className={styles.landHeroCta}><button className={`${styles.btn} ${styles.btnPrimary}`} onClick={join}>Join race</button><Link className={`${styles.btn} ${styles.btnGhost}`} href="/calgary/hunt">Practice first</Link></div><p>{status}</p></div></section></div></main>;
}
