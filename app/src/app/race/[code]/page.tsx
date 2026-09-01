"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import styles from "../../page.module.css";

export default function RaceJoinPage({ params }: { params: Promise<{ code: string }> }) {
  const router = useRouter();
  const { code: codeParam } = use(params);
  const code = codeParam.toUpperCase();
  const [team, setTeam] = useState("Team Sidewalk");
  const [status, setStatus] = useState("Open this on one phone per team. No account, no individual payment.");

  const [busy, setBusy] = useState(false);

  /* Joining takes the phone straight to its own punch card — the team should not
     have to be told a start index and then find the hunt themselves. */
  const join = async () => {
    if (busy) return;
    setBusy(true);
    setStatus("Finding your race…");
    try {
      const response = await fetch(`/api/v1/races/${code}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_name: team }),
      });
      const json = await response.json();
      if (!response.ok || !json?.data?.hunt_url) {
        setStatus(json?.error ?? "Could not join that race. Check the code and try again.");
        setBusy(false);
        return;
      }
      router.push(json.data.hunt_url);
    } catch {
      setStatus("Could not reach the server. Check your connection and try again.");
      setBusy(false);
    }
  };

  return <main className={styles.landing}><nav className={styles.landNav}><div className={styles.landNavIn}><Link className={styles.landBrand} href="/"><img src="/brand/stroll-mark.png" alt="" /><span className={styles.landBrandName}>STROLL <span>CITY</span></span></Link><div className={styles.landNavLinks}><Link href="/calgary/hunt">Hunts</Link><Link href="/events">Book a race</Link></div></div></nav><div className={styles.landWrap}><section className={styles.landBlk}><div className={styles.landBigCard}><span className={styles.lbl}>Scavenger Hunt Race</span><h1 className={styles.landH2}>Join race {code}</h1><p className={styles.landCardP}>Each team starts at a rotated stop, wraps around the same loop, and shares the live leaderboard.</p><div className={styles.claimField}><label>Team name</label><div className={styles.ctl}><input value={team} onChange={(e) => setTeam(e.target.value)} /></div></div><div className={styles.landHeroCta}><button className={`${styles.btn} ${styles.btnPrimary}`} onClick={join} disabled={busy}>{busy ? "Joining…" : "Join race"}</button><Link className={`${styles.btn} ${styles.btnGhost}`} href="/calgary/hunt">Practice first</Link></div><p>{status}</p></div></section></div></main>;
}
