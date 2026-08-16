import Link from "next/link";
import styles from "./page.module.css";

const huntProducts = [
  ["Friendly Mode", "Free, always", "4 stops · no clock · different every time"],
  ["Full Hunt", "$20/team", "6–9 stops · Stroll Time · first one free"],
  ["Loop Race", "$99", "Up to 4 teams · live leaderboard"],
  ["Private events", "$199+", "Birthdays, corporate teams, schools and youth groups"],
] as const;

const filters = ["Coffee", "Vintage", "Books", "Records", "Bakery", "Gifts", "Gallery", "Pub"];

export default function LandingPage() {
  return (
    <main className={styles.landing}>
      <nav className={styles.landNav}>
        <div className={styles.landNavIn}>
          <Link className={styles.landBrand} href="/">
            <img src="/brand/stroll-mark.png" alt="" />
            <span className={styles.landBrandName}>STROLL <span>CITY</span></span>
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
                <div className={styles.landTrust}>
                  <span><b>140+</b> Inglewood businesses mapped</span>
                  <span className={styles.landTrustSep} />
                  <span><b>112</b> riddles written</span>
                  <span className={styles.landTrustSep} />
                  <span>No account to browse</span>
                </div>
              </div>

              <Link className={styles.landShowcase} href="/calgary" aria-label="Open the interactive Calgary map">
                <div className={styles.landScBar}>
                  <span className={styles.landScDots}><i /><i /><i /></span>
                  <span className={styles.landScUrl}>stroll.city/calgary</span>
                </div>
                <div className={styles.landScMap}>
                  <div className={styles.heroStaticMap} aria-hidden="true">
                    <span className={`${styles.heroRoad} ${styles.heroRoadMain}`} />
                    <span className={`${styles.heroRoad} ${styles.heroRoadRiver}`} />
                    <span className={`${styles.heroBlock} ${styles.heroBlockA}`}>FF</span>
                    <span className={`${styles.heroBlock} ${styles.heroBlockB}`}>R</span>
                    <span className={`${styles.heroBlock} ${styles.heroBlockC}`}>AB</span>
                    <span className={`${styles.heroBlock} ${styles.heroBlockD}`}>K</span>
                    <span className={`${styles.heroBlock} ${styles.heroBlockE}`}>DP</span>
                    <span className={`${styles.heroBlock} ${styles.heroBlockF}`}>N</span>
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
              <h2 className={styles.landH2}>Riddles that make people walk into shops, not past them.</h2>
            </div>
            <p>Teams solve a riddle, walk to the answer, take a private proof photo at the door, then stamp the next stop onto a punch card. At the finish, it becomes a shareable postcard.</p>
          </div>
          <div className={styles.landPlans}>
            {huntProducts.map(([name, price, copy]) => (
              <div className={styles.landPlan} key={name}>
                <div className={styles.landPlanTop}><span className={styles.landPlanName}>{name}</span></div>
                <div className={styles.landPrice}>{price}</div>
                <p className={styles.landPlanCopy}>{copy}</p>
              </div>
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
            <p style={{ color: "rgba(255,255,255,.66)", maxWidth: "44ch", marginTop: 16, fontSize: 16 }}>Open the Calgary map, pick a filter, or start with the free Friendly Mode hunt when it goes live.</p>
          </div>
          <div className={styles.landCtaActions}>
            <Link className={`${styles.btn} ${styles.btnClaim}`} href="/calgary">Explore Calgary</Link>
            <Link className={`${styles.btn} ${styles.btnGhost}`} href="/business">I own a business</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
