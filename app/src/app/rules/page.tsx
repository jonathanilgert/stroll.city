import Link from "next/link";
import styles from "../page.module.css";

export default function RulesPage() {
  return (
    <main className={styles.landing}>
      <nav className={styles.landNav}><div className={styles.landNavIn}><Link className={styles.landBrand} href="/"><img src="/brand/stroll-mark.png" alt="" /><span className={styles.landBrandName}>STROLL <span>CITY</span></span></Link><div className={styles.landNavLinks}><Link href="/calgary/hunt">Hunts</Link><Link href="/events">Events</Link></div><span className={styles.landSp} /><Link className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`} href="/calgary/hunt?type=friendly">Enter through Friendly Mode</Link></div></nav>
      <div className={styles.landWrap}>
        <section className={styles.landBlk}>
          <div className={styles.landSecHead}><div className={styles.landSecHeadL}><span className={styles.lbl}>Contest rules</span><h1 className={styles.landH2}>Inglewood Basket draw rules</h1></div><p>The monthly Stroll City Inglewood Basket draw is a no-purchase-necessary local prize draw for eligible Alberta participants.</p></div>
          <div className={styles.landDuo}>
            <div className={styles.landBigCard}>
              <h2 className={styles.landH3}>Who can enter</h2>
              <div className={styles.locked}>
                <div className={styles.callout}>You must be an Alberta resident and the age of majority in Alberta at the time you enter.</div>
                <div className={styles.callout}>No purchase is necessary. Friendly Mode is free, and there is also a free email entry route.</div>
                <div className={styles.callout}>Employees, contractors, participating prize suppliers, and immediate family or household members of those groups are not eligible to win.</div>
              </div>
              <h2 className={styles.landH3}>How to enter without purchase</h2>
              <p className={styles.landCardP}>There are two free ways to enter while a draw is open:</p>
              <div className={styles.locked}>
                <div className={styles.callout}>Complete Friendly Mode on stroll.city, make your postcard, then share it with <b>#StrollInglewood</b> and tag <b>@stroll_city</b> while the draw is open. Finishing the hunt creates the postcard; sharing it is what enters the draw.</div>
                <div className={styles.callout}>Email <a href="mailto:hello@stroll.city">hello@stroll.city</a> with the subject line “Inglewood Basket Entry” and include your full name, Alberta city/town, and email address. One free email entry per person per draw period.</div>
              </div>
            </div>
            <div className={styles.landBigCard}>
              <h2 className={styles.landH3}>Prize and draw</h2>
              <p className={styles.landCardP}>The Inglewood Basket is a collection of donated Inglewood items, with the exact prize contents and approximate retail value published for each monthly draw before entries close.</p>
              <div className={styles.locked}>
                <div className={styles.callout}>Unless a monthly post says otherwise, there is one prize basket and one winner per draw period.</div>
                <div className={styles.callout}>A potential winner is selected by random draw from eligible entries after the entry period closes.</div>
                <div className={styles.callout}>The potential winner will be contacted using the email address provided with the entry and must respond within the stated claim window.</div>
              </div>
              <div className={styles.calloutAmber}><b>Skill-testing question:</b> Before the prize is released, the selected entrant must correctly answer a time-limited mathematical skill-testing question without mechanical or other assistance. If they do not answer correctly, cannot be reached, or are otherwise ineligible, another entrant may be drawn.</div>
            </div>
          </div>
        </section>

        <section className={styles.landBlk}>
          <div className={styles.landDuo}>
            <div className={styles.landBigCard}>
              <h2 className={styles.landH3}>Consent and privacy</h2>
              <p className={styles.landCardP}>Contest entry does not subscribe you to marketing. Any marketing consent must be separate, optional, and not pre-checked.</p>
              <div className={styles.locked}>
                <div className={styles.callout}>Entry information is used to administer the draw, verify eligibility, contact a potential winner, and keep required contest records.</div>
                <div className={styles.callout}>Stroll City may publish the winner’s first name, city, and/or a winner announcement after the prize is awarded.</div>
                <div className={styles.callout}>Contest records are retained for one year unless a longer period is legally required.</div>
              </div>
            </div>
            <div className={styles.landBigCard}>
              <h2 className={styles.landH3}>General conditions</h2>
              <div className={styles.locked}>
                <div className={styles.callout}>The prize must be accepted as awarded and is not transferable or redeemable for cash unless Stroll City chooses to substitute a prize of equal or greater value.</div>
                <div className={styles.callout}>Stroll City may cancel, suspend, or amend a draw if fraud, technical failure, supplier changes, or another issue affects the integrity or availability of the draw.</div>
                <div className={styles.callout}>By entering, participants agree to these rules and to the decisions made in administering the draw, which are final where permitted by law.</div>
              </div>
              <Link className={`${styles.btn} ${styles.btnPrimary}`} href="/calgary/hunt?type=friendly">Start Friendly Mode</Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
