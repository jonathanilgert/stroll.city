import Link from "next/link";
import styles from "../page.module.css";

const sections = [
  {
    title: "1. Eligibility",
    body: [
      "Open to residents of Alberta who are 18 years of age or older at the time of entry. Employees of stroll.city and their immediate families are not eligible. Businesses donating prize items may not enter.",
      "Anyone of any age can play a stroll.city hunt. The draw is the only part of the product restricted by age.",
    ],
  },
  {
    title: "2. Entry period",
    body: ["Each draw runs from 12:00 a.m. MT on the first day of the month to 11:59 p.m. MT on the last day of that month."],
  },
  {
    title: "3. How to enter — two ways, both free",
    body: [
      "Complete and share. Complete any stroll.city scavenger hunt, including the free Friendly Mode hunt, then share your finished postcard publicly on Instagram or Facebook tagging @stroll_city or using #StrollInglewood, and tell us in the app that you’ve shared it. One entry per completed hunt.",
      "Free entry by email. No hunt and no social account required. Email hello@stroll.city with the subject “Inglewood Basket” and your full name, and you will receive one entry for that month. Limit one per person per month. Entries by this method have the same chance of winning as any other.",
      "No purchase is necessary and purchasing does not improve your chance of winning. Paid hunts are not required to enter. Entering the draw is not required to play a hunt.",
    ],
  },
  {
    title: "4. Prize",
    body: ["One (1) prize per month: a basket of goods donated by participating Inglewood businesses, approximate retail value around $250 CAD. Each donating business contributes a single item; no individual business donates the full value of the basket. The exact contents vary month to month and are listed on the entry screen. The prize is not transferable and cannot be exchanged for cash. No substitutions except by the sponsor, who may substitute a prize of equal or greater value."],
  },
  { title: "5. Odds", body: ["Odds of winning depend on the number of eligible entries received during the entry period."] },
  {
    title: "6. Draw",
    body: ["One entrant is selected at random within seven (7) days of the end of the entry period. If the selected entry was made by sharing, the sponsor will confirm the shared post is publicly visible; if it cannot be confirmed, that entry is void and another entrant is drawn. Shares are checked only for the entrant who is drawn."],
  },
  {
    title: "7. Skill-testing question",
    body: ["Before the prize is awarded, the selected entrant must correctly answer, unaided, a mathematical skill-testing question, within seven (7) days of being contacted. If they do not respond, do not answer correctly, or decline the prize, the entry is void and another entrant is drawn."],
  },
  {
    title: "8. Notification and collection",
    body: ["The winner is contacted using the email address associated with their entry. Prize items are collected in person from the donating businesses in Inglewood, Calgary, within 30 days of notification, using a collection sheet provided by the sponsor. Unclaimed prizes after 30 days are forfeited."],
  },
  {
    title: "9. Photos and content",
    body: ["Entrants who share a postcard grant stroll.city a non-exclusive, royalty-free licence to reproduce that shared postcard and its caption for promotional purposes, with credit to the entrant’s social handle where practical. This applies only to content the entrant has already made public. Photos taken during a hunt remain private and are never published unless the entrant separately opts in."],
  },
  {
    title: "10. Privacy",
    body: ["Entry information is used only to run this draw and is deleted twelve (12) months after the draw closes. Entering does not subscribe you to any mailing list. Marketing email is sent only to people who have separately given express consent."],
  },
  {
    title: "11. General",
    body: ["The sponsor may amend, suspend or cancel the draw where required by law or if it cannot be run as planned. By entering, entrants agree to these rules and to the sponsor’s decisions, which are final. Void where prohibited. This draw is open to Alberta residents only and is not open to residents of Quebec."],
  },
];

export default function RulesPage() {
  return (
    <main className={styles.landing}>
      <nav className={styles.landNav}><div className={styles.landNavIn}><Link className={styles.landBrand} href="/"><img src="/brand/stroll-mark.png" alt="" /><span className={styles.landBrandName}>STROLL <span>CITY</span></span></Link><div className={styles.landNavLinks}><Link href="/calgary/hunt">Hunts</Link><Link href="/events">Events</Link></div><span className={styles.landSp} /><Link className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`} href="/calgary/hunt?type=friendly">Enter through Friendly Mode</Link></div></nav>
      <div className={styles.landWrap}>
        <section className={styles.landBlk}>
          <div className={styles.landSecHead}>
            <div className={styles.landSecHeadL}>
              <span className={styles.lbl}>Sponsor: stroll.city, Calgary, Alberta · hello@stroll.city</span>
              <h1 className={styles.landH2}>Inglewood Basket Monthly Draw — Official Rules</h1>
            </div>
            <p>One rules page for the monthly Inglewood Basket draw. Friendly Mode is free, sharing is optional, and there is also a no-hunt email entry route.</p>
          </div>
          <div className={styles.landBigCard} style={{ maxWidth: 860, margin: "0 auto" }}>
            {sections.map((section) => (
              <section key={section.title} style={{ marginBottom: 24 }}>
                <h2 className={styles.landH3}>{section.title}</h2>
                {section.body.map((paragraph) => <p className={styles.landCardP} key={paragraph}>{paragraph}</p>)}
              </section>
            ))}
            <p className={styles.lbl}>Last updated: 21 August 2026</p>
            <div className={styles.landHeroCta}><Link className={`${styles.btn} ${styles.btnPrimary}`} href="/calgary/hunt?type=friendly">Start Friendly Mode</Link><Link className={`${styles.btn} ${styles.btnGhost}`} href="/">Back to stroll.city</Link></div>
          </div>
        </section>
      </div>
    </main>
  );
}
