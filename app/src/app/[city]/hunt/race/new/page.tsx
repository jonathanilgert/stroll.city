"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CatIcon } from "../../../../StrollCityApp";
import styles from "../../../../page.module.css";

export default function RaceSetupPage() {
  const [teams, setTeams] = useState(2);
  const [hostName, setHostName] = useState("");
  const [raceName, setRaceName] = useState("Inglewood Loop Race");
  const code = useMemo(() => {
    const seed = `${hostName || "host"}-${raceName || "race"}`.toUpperCase().replace(/[^A-Z0-9]+/g, "").slice(0, 5);
    return `RACE-${seed || "TEAM"}`;
  }, [hostName, raceName]);
  const total = teams * 20;

  return (
    <main className={styles.landing}>
      <nav className={styles.landNav}>
        <div className={styles.landNavIn}>
          <Link className={styles.landBrand} href="/"><img src="/brand/stroll-mark.png" alt="" /><span className={styles.landBrandName}>Stroll <span>city</span></span></Link>
          <div className={styles.landNavLinks}><Link href="/calgary/hunt">Hunts</Link><Link href="/events">Events</Link></div>
          <span className={styles.landSp} />
          <Link className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`} href="/calgary/hunt">Back to hunts</Link>
        </div>
      </nav>

      <div className={styles.landWrap}>
        <header className={styles.landHero}>
          <div className={styles.landHeroCard}>
            <div className={styles.landHeroGrid}>
              <div className={styles.landHeroCopy}>
                <span className={styles.landEyebrow}><i /> Loop Race</span>
                <h1 className={styles.landH1}>Race the scavenger hunt, from different doors.</h1>
                <p className={styles.landHeroSub}>Choose a team count, share one link, and every team gets a rotated start around the loop with the same $20/team price as a Full Hunt. The host pays once for everyone.</p>
              </div>
              <div className={styles.landShowcase} style={{ padding: 24, height: "auto" }}>
                <span className={styles.lbl}>Set up race</span>
                <div className={styles.raceCalc} style={{ marginTop: 18 }}>
                  <div className={styles.claimField}><label>Race name</label><div className={styles.ctl}><input value={raceName} onChange={(e) => setRaceName(e.target.value)} /></div></div>
                  <div className={styles.claimField}><label>Host name</label><div className={styles.ctl}><input value={hostName} onChange={(e) => setHostName(e.target.value)} placeholder="Your name" /></div></div>
                  <div className={styles.claimField}>
                    <label>Teams</label>
                    <div className={styles.raceTeams}>
                      <button type="button" onClick={() => setTeams((n) => Math.max(2, n - 1))}>−</button>
                      <span className={styles.racePrice}>{teams}</span>
                      <button type="button" onClick={() => setTeams((n) => Math.min(8, n + 1))}>+</button>
                    </div>
                    <span className={styles.helper}>Self-serve supports 2–8 teams. For more than 8, book an event.</span>
                  </div>
                  <div className={styles.callout}><span className={styles.racePrice}>{teams} teams × $20 = ${total}</span></div>
                  <div className={styles.callout}><b>First-hunt credit applies to Full Hunts, not race bookings.</b></div>
                  <div className={styles.review}>
                    <div className={styles.revRow}><span className={styles.revKey}>Code</span><span className={styles.revVal}>{code}</span></div>
                    <div className={styles.revRow}><span className={styles.revKey}>Share link</span><span className={styles.revVal}>stroll.city/race/{code.toLowerCase()}</span></div>
                  </div>
                  <Link className={`${styles.btn} ${styles.btnPrimary}`} href={`/race/${code.toLowerCase()}`}>Open race lobby <CatIcon d="M5 12h13m-7-7 7 7-7 7" size={15} strokeWidth={1.8} color="#fff" /></Link>
                </div>
              </div>
            </div>
          </div>
        </header>
      </div>
    </main>
  );
}
