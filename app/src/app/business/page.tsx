"use client";

import Link from "next/link";
import { CatIcon } from "../StrollCityApp";
import styles from "../page.module.css";

const STOREFRONT_COUNT = 162;

const LANDING_PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    suffix: "",
    hot: false,
    copy: "Stay on the map, correctly.",
    feats: ["Verified pin on your real building, not a dot on the street", "Name, category and address — corrected by you", "Monogram marker", "Eligible to be a scavenger hunt stop", "Your own riddle, if you'd like one written"],
    cta: "Claim for free",
  },
  {
    id: "stroll",
    name: "Stroll",
    price: "$29",
    suffix: "/mo",
    hot: true,
    copy: "Everything in Free, plus the parts you control.",
    feats: ["Your logo as the map marker", "Photo gallery", "A full profile with hours, phone, website, socials and description", "Highlights", "Deals and promos you publish yourself", "Events posted straight onto the Calgary map", "Offer a finisher item", "Donate to the Inglewood Basket", "Five free hunt codes a month", "Your numbers: door visits, profile opens, filters, deals claimed and redeemed", "Edit anything, any time"],
    cta: "Choose Stroll",
  },
] as const;

export default function LandingPage() {
  return (
    <main className={styles.landing}>
      <nav className={styles.landNav}>
        <div className={styles.landNavIn}>
          <a className={styles.landBrand} href="#top">
            <img src="/brand/stroll-mark.png" alt="" />
            <span className={styles.landBrandName}>Stroll <span>city</span></span>
          </a>
          <div className={styles.landNavLinks}>
            <Link href="/">For strollers →</Link>
            <a href="#plans">Free vs Stroll</a>
          </div>
          <span className={styles.landSp} />
          <Link className={`${styles.btn} ${styles.btnLine} ${styles.btnSm} ${styles.landNavSecondary}`} href="/calgary">Open map</Link>
          <Link className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`} href="/portal">Claim your business — free</Link>
        </div>
      </nav>

      <div className={styles.landWrap} id="top">
        <header className={styles.landHero} id="map">
          <div className={styles.landHeroCard}>
            <div className={styles.landHeroGrid}>
              <div className={styles.landHeroCopy}>
                <span className={styles.landEyebrow}><i /> Free until 31 March 2027 · Inglewood</span>
                <h1 className={styles.landH1}>Your shop,<br />on the map of <em>your street</em>.</h1>
                <p className={styles.landHeroSub}>stroll.city maps 9 Ave the way people actually walk it: every shop on its real building, with scavenger hunts that send teams to the door. Claiming keeps your details correct; Stroll membership adds your logo, photos, deals and hunt-finish perks.</p>
                <div className={styles.landHeroCta}>
                  <Link className={`${styles.btn} ${styles.btnPrimary}`} href="/portal">
                    Claim your business — free
                    <CatIcon d="M5 12h13m-7-7 7 7-7 7" size={16} strokeWidth={1.8} color="#fff" />
                  </Link>
                  <a className={`${styles.btn} ${styles.btnGhost}`} href="#plans">See what membership adds</a>
                </div>
                <div className={styles.landTrust}>
                  <span><b>{STOREFRONT_COUNT}</b> Inglewood storefronts mapped</span>
                  <span className={styles.landTrustSep} />
                  <span><b>City of Calgary</b> open licence data</span>
                  <span className={styles.landTrustSep} />
                  <span>Free tier, always</span>
                </div>
              </div>

              <div className={`${styles.landBigCard} ${styles.landBigCardDark} ${styles.landHeroClaimCard}`}>
                <span className={`${styles.landBcIc} ${styles.landBcIcDark}`}>
                  <CatIcon d="M12 3l8 3.5v5c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10v-5L12 3Zm-3 9 2 2 4-4" size={22} strokeWidth={1.6} color="#fff" />
                </span>
                <div>
                  <span className={styles.lbl} style={{ color: "rgba(255,255,255,.5)" }}>For owners</span>
                  <h3 className={styles.landH3} style={{ color: "#fff" }}>Your pin, your words, two minutes to claim</h3>
                  <p className={styles.landCardP} style={{ color: "rgba(255,255,255,.68)" }}>Search your licence record, confirm you can speak for the business, and take the marker. The free tier keeps you visible for nothing.</p>
                </div>
                <div className={styles.landTicks}>
                  <div className={styles.landTick} style={{ color: "rgba(255,255,255,.78)" }}><CatIcon d="m5 13 4.5 4.5L19 7" size={17} strokeWidth={2} color="var(--accent-ink)" />Verified badge, logo marker and a curated profile</div>
                  <div className={styles.landTick} style={{ color: "rgba(255,255,255,.78)" }}><CatIcon d="m5 13 4.5 4.5L19 7" size={17} strokeWidth={2} color="var(--accent-ink)" />Publish hours, photos, links, promos and events yourself</div>
                  <div className={styles.landTick} style={{ color: "rgba(255,255,255,.78)" }}><CatIcon d="m5 13 4.5 4.5L19 7" size={17} strokeWidth={2} color="var(--accent-ink)" />Nothing publishes until you confirm by email</div>
                </div>
                <Link className={`${styles.btn} ${styles.btnClaim}`} href="/portal" style={{ alignSelf: "flex-start" }}>
                  Start a claim
                  <CatIcon d="M5 12h13m-7-7 7 7-7 7" size={16} strokeWidth={1.8} />
                </Link>
              </div>
            </div>
          </div>
        </header>

        <div className={`${styles.landStats} ${styles.landStatsThree}`}>
          <div className={styles.landStat}><div className={styles.landStatV}>9 Ave SE</div><div className={styles.landStatK}>The whole strip, end to end</div></div>
          <div className={`${styles.landStat} ${styles.landStatAccent}`}><div className={styles.landStatV}>100%</div><div className={styles.landStatK}>Real building footprints, not dropped pins</div></div>
          <div className={styles.landStat}><div className={styles.landStatV}>Free</div><div className={styles.landStatK}>For Inglewood businesses until 31 March 2027</div></div>
        </div>

        <section className={styles.landBlk} id="plans">
          <div className={styles.landSecHead}>
            <div className={styles.landSecHeadL}>
              <span className={styles.lbl}>Plans</span>
              <h2 className={styles.landH2}>Free keeps you on the map.<br />Paid makes it yours.</h2>
            </div>
            <p>Free for Inglewood businesses until 31 March 2027. No card needed to start, and nothing publishes until you say so.</p>
          </div>
          <div className={`${styles.landPlans} ${styles.landPlansTwo}`}>
            {LANDING_PLANS.map((plan) => (
              <div className={`${styles.landPlan} ${plan.hot ? styles.landPlanHot : ""}`} key={plan.id}>
                <div className={styles.landPlanTop}>
                  <span className={styles.landPlanName}>{plan.name}</span>
                  {plan.hot && <span className={styles.landHotpill}>Most claimed</span>}
                </div>
                <div className={styles.landPrice}>{plan.price}{plan.suffix && <small>{plan.suffix}</small>}</div>
                <p className={styles.landPlanCopy}>{plan.copy}</p>
                <div className={styles.landFeat}>
                  {plan.feats.map((feat) => (
                    <div key={feat}><CatIcon d="m5 13 4.5 4.5L19 7" size={16} strokeWidth={2} color={plan.hot ? "var(--accent-ink)" : "#15558F"} />{feat}</div>
                  ))}
                </div>
                <Link className={`${styles.btn} ${plan.hot ? styles.btnPrimary : styles.btnLine}`} href="/portal">{plan.cta}</Link>
              </div>
            ))}
          </div>
        </section>



        <section className={styles.landBlk} id="switches">
          <div className={styles.landSecHead}>
            <div className={styles.landSecHeadL}>
              <span className={styles.lbl}>Optional extras</span>
              <h2 className={styles.landH2}>Three things you can switch on, if you want to.</h2>
            </div>
            <p>None of them is required. They all start off, and they&apos;re all yours to change or pause whenever you like.</p>
          </div>
          <div className={`${styles.landDuo} ${styles.landTrio}`}>
            <div className={styles.landBigCard}>
              <span className={styles.lbl}>Put my shop in the pool</span>
              <h3 className={styles.landH3}>Be the final stop</h3>
              <p className={styles.landCardP}>Every hunt ends somewhere. Switch this on and your shop goes into the pool for the final stop — the one where a team finishes, celebrates, and takes the photo that becomes their postcard. Offer something free, something with a purchase, or a discount, then set a weekly cap so it can never run away from you.</p>
            </div>
            <div className={styles.landBigCard}>
              <span className={styles.lbl}>Add me to a basket</span>
              <h3 className={styles.landH3}>Join the Inglewood Basket</h3>
              <p className={styles.landCardP}>Ten shops each put one item into a basket, and we draw one winner a month. Your part is a single item off your own shelf — a candle, a book, a bag of beans, a gift card. Ten of those together come to around $250, which is what makes the basket worth entering. You choose the item and which months you&apos;re in.</p>
            </div>
            <div className={styles.landBigCard}>
              <span className={styles.lbl}>Host a group finish</span>
              <h3 className={styles.landH3}>Host the group afterwards</h3>
              <p className={styles.landCardP}>Groups book walks for staff days, birthdays and fundraisers — thirty or forty people who need somewhere to land when it&apos;s over. Switch this on and tell us the biggest group you can take and the hours you&apos;d actually want them. You pick the days, you pick how many a month. No money passes through Stroll — the group pays you directly.</p>
            </div>
          </div>
        </section>

        <section className={styles.landCta}>
          <span className={styles.landRing} /><span className={styles.landRing2} />
          <div style={{ position: "relative", zIndex: 2 }}>
            <span className={styles.lbl} style={{ color: "rgba(255,255,255,.5)" }}>Inglewood businesses</span>
            <h2 className={styles.landH2} style={{ color: "#fff", marginTop: 14 }}>Take the pin above your door.</h2>
            <p style={{ color: "rgba(255,255,255,.66)", maxWidth: "44ch", marginTop: 16, fontSize: 16 }}>Two minutes, no card, nothing published until you say so. Inglewood businesses can claim a verified pin and decide what publishes.</p>
          </div>
          <div className={styles.landCtaActions}>
            <Link className={`${styles.btn} ${styles.btnClaim}`} href="/portal">
              Claim your business
              <CatIcon d="M5 12h13m-7-7 7 7-7 7" size={16} strokeWidth={1.8} />
            </Link>
            <Link className={`${styles.btn} ${styles.btnGhost}`} href="/calgary">See the map first</Link>
          </div>
        </section>

        <footer className={styles.landFooter}>
          <div className={styles.landFootIn}>
            <div className={styles.landFootCol} style={{ minWidth: 200 }}>
              <a className={styles.landBrand} href="#top" style={{ marginBottom: 6 }}>
                <img src="/brand/stroll-mark.png" alt="" />
                <span className={styles.landBrandName}>Stroll <span>city</span></span>
              </a>
              <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>Friendlier city maps.<br />Calgary · Blue Sky City</span>
            </div>
            <div className={styles.landFootCol}>
              <span className={styles.lbl}>Explore</span>
              <Link href="/calgary">Calgary map</Link>
              <a href="#plans">Plans</a>
            </div>
            <div className={styles.landFootCol}>
              <span className={styles.lbl}>Business</span>
              <Link href="/portal">Claim a listing</Link>
              <a href="#plans">Plans &amp; logo</a>
            </div>
            <p className={styles.landFootNote}>Basemap © OpenStreetMap contributors © CARTO.</p>
          </div>
        </footer>
      </div>
    </main>
  );
}
