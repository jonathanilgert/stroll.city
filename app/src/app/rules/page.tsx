import Link from "next/link";
import styles from "../page.module.css";

export default function RulesPage() {
  return (
    <main className={styles.landing}>
      <nav className={styles.landNav}><div className={styles.landNavIn}><Link className={styles.landBrand} href="/"><img src="/brand/stroll-mark.png" alt="" /><span className={styles.landBrandName}>STROLL <span>CITY</span></span></Link><div className={styles.landNavLinks}><Link href="/calgary/hunt">Hunts</Link><Link href="/events">Events</Link></div></div></nav>
      <div className={styles.landWrap}>
        <section className={styles.landBlk}>
          <div className={styles.landSecHead}><div className={styles.landSecHeadL}><span className={styles.lbl}>Contest rules</span><h1 className={styles.landH2}>Inglewood Basket draw</h1></div><p>Monthly donated-item draw, roughly $250 value. These rules are built once and reused monthly with only dates and prize contents changed.</p></div>
          <div className={styles.landDuo}>
            <div className={styles.landBigCard}><h2 className={styles.landH3}>Legal minimums</h2><div className={styles.locked}><div className={styles.callout}>Alberta residents only. No purchase necessary.</div><div className={styles.callout}>Free entry path: Friendly Mode is free forever, plus email entry to hello@stroll.city.</div><div className={styles.callout}>A skill-testing question is required before prize release.</div><div className={styles.callout}>Contest entry never subscribes a person to marketing. CASL consent is separate and unticked.</div><div className={styles.callout}>Records are retained for one year. Winner verification is manual: draw name, check public post or free-entry record, redraw if invalid.</div></div></div>
            <div className={styles.landBigCard}><h2 className={styles.landH3}>Current monthly prize</h2><p className={styles.landCardP}>Ten donated Inglewood items, approximately $250 total value. Exact prize list is published when the monthly basket opens.</p><div className={styles.calloutAmber}><b>Reminder:</b> have a contest lawyer review before the first live draw.</div><Link className={`${styles.btn} ${styles.btnPrimary}`} href="/calgary/hunt">Enter through Friendly Mode</Link></div>
          </div>
        </section>
      </div>
    </main>
  );
}
