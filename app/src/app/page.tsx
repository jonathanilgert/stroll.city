import Link from "next/link";
import styles from "./page.module.css";

const huntProducts = [
  {
    name: "Friendly Mode",
    price: "Free, always",
    copy: "4 stops · no clock · a different four every time",
    button: "Start now →",
    href: "/calgary/hunt?type=friendly",
    label: "Start a free Friendly Mode hunt",
  },
  {
    name: "Full Scavenger Hunt",
    price: "$20/team",
    copy: "6–9 stops · timed with Stroll Time · your first one's free",
    button: "Start a hunt →",
    href: "/calgary/hunt?type=full",
    label: "Start a Full Scavenger Hunt",
  },
  {
    name: "Scavenger Hunt Race",
    price: "$20/team · 2 teams and up",
    copy: "Rotated starts, live leaderboard, one link to share",
    button: "Set up a race →",
    href: "/calgary/hunt/race/new",
    label: "Set up a Scavenger Hunt Race",
  },
  {
    name: "Event bookings",
    price: "From $99",
    copy: "Book the street for a birthday, a staff day out, a class trip or a youth group",
    button: "Book an event →",
    href: "/events",
    label: "Book a Stroll event",
  },
] as const;

const filters = ["Coffee", "Vintage", "Books", "Records", "Bakery", "Gifts", "Gallery", "Pub"];

export default function LandingPage() {
  return (
    <main className={styles.landing}>
      <nav className={styles.landNav}>
        <div className={styles.landNavIn}>
          <Link className={styles.landBrand} href="/">
            <img src="/brand/stroll-mark.png" alt="" />
            <span className={styles.landBrandName}>Stroll <span>city</span></span>
          </Link>
          <div className={styles.landNavLinks}>
            <a href="#hunt">Scavenger hunts</a>
            <a href="#filter">Filters</a>
            <Link href="/business">For businesses →</Link>
          </div>
          <span className={styles.landSp} />
          <Link className={`${styles.btn} ${styles.btnLine} ${styles.btnSm} ${styles.landNavSecondary}`} href="/business">For businesses</Link>
          <Link className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`} href="/calgary">Explore the Calgary map</Link>
        </div>
      </nav>

      <div className={styles.landWrap} id="top">
        <header className={styles.landHero}>
          <div className={styles.landHeroCard}>
            <div className={styles.landHeroGrid}>
              <div className={styles.landHeroCopy}>
                <span className={styles.landEyebrow}><i /> Calgary · Inglewood first</span>
                <h1 className={styles.landH1}>The city map that<br />looks like the <em>walk</em>.</h1>
                <p className={styles.landHeroSub}>stroll.city maps walkable shopping streets the way people actually experience them: every business on its real building, a filter for whatever you feel like, and scavenger hunts that get you through the door.</p>
                <div className={styles.landHeroCta}>
                  <Link className={`${styles.btn} ${styles.btnPrimary}`} href="/calgary">Explore the Calgary map →</Link>
                  <Link className={`${styles.btn} ${styles.btnGhost}`} href="/calgary/hunt">Start a scavenger hunt</Link>
                </div>
                <div className={`${styles.landTrust} ${styles.landTrustClaims}`}>
                  <span>Every business on its real building</span>
                  <span className={styles.landTrustSep} />
                  <span>Free to browse</span>
                  <span className={styles.landTrustSep} />
                  <span>No account, no app</span>
                </div>
              </div>

              <Link className={styles.landShowcase} href="/calgary" aria-label="Open the interactive Calgary map">
                <div className={styles.landScBar}>
                  <span className={styles.landScDots}><i /><i /><i /></span>
                  <span className={styles.landScUrl}>stroll.city/calgary</span>
                </div>
                <div className={styles.landScMap}>
                  <div className={styles.heroStaticMap} aria-hidden="true">
                    <img src="/brand/stroll-main-map.jpg" alt="" />
                  </div>
                  <span className={styles.landScHint}>Open the interactive map →</span>
                </div>
              </Link>
            </div>
          </div>
        </header>

        <section className={styles.landBlk} id="hunt">
          <div className={styles.landSecHead}>
            <div className={styles.landSecHeadL}>
              <span className={styles.lbl}>The scavenger hunt</span>
              <h2 className={styles.landH2}>A riddle. A doorway. Then the next riddle.</h2>
            </div>
            <p>Your team gets a riddle. Work out which shop it points at, walk there, take a photo at the door — and the next riddle unlocks. The punch card fills itself in on screen. Nothing to print, nothing to carry, no one to track down. At the finish, your photos become a postcard.</p>
          </div>
          <div className={styles.landPlans}>
            {huntProducts.map((product) => (
              <Link className={`${styles.landPlan} ${styles.landPlanLink}`} key={product.name} href={product.href} aria-label={product.label}>
                <div className={styles.landPlanTop}><span className={styles.landPlanName}>{product.name}</span></div>
                <div className={styles.landPrice}>{product.price}</div>
                <p className={styles.landPlanCopy}>{product.copy}</p>
                <span className={styles.landPlanButton}>{product.button}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.landBlk} id="filter">
          <div className={styles.landSecHead}>
            <div className={styles.landSecHeadL}>
              <span className={styles.lbl}>Curate your own experience</span>
              <h2 className={styles.landH2}>Filter the street by mood.</h2>
            </div>
            <p>No route generator. No account. Pick what you’re in the mood for, watch everything else fade back, and decide where to stroll.</p>
          </div>
          <div className={styles.landChips} style={{ position: "static", overflow: "visible", flexWrap: "wrap" }}>
            {filters.map((filter) => <span className={styles.landChip} key={filter}><i />{filter}</span>)}
          </div>
        </section>

        <section className={styles.landCta}>
          <span className={styles.landRing} /><span className={styles.landRing2} />
          <div style={{ position: "relative", zIndex: 2 }}>
            <span className={styles.lbl} style={{ color: "rgba(255,255,255,.5)" }}>Start with the map</span>
            <h2 className={styles.landH2} style={{ color: "#fff", marginTop: 14 }}>Inglewood is ready to walk.</h2>
            <p style={{ color: "rgba(255,255,255,.66)", maxWidth: "44ch", marginTop: 16, fontSize: 16 }}>Open the Calgary map, pick a filter, or start the free Friendly Mode hunt right now. No account, no card, no app.</p>
          </div>
          <div className={styles.landCtaActions}>
            <Link className={`${styles.btn} ${styles.btnClaim}`} href="/calgary">Explore Calgary</Link>
            <Link className={`${styles.btn} ${styles.btnGhost}`} href="/calgary/hunt?type=friendly">Start a free hunt</Link>
            <Link className={`${styles.btn} ${styles.btnGhost}`} href="/business">I own a business</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
