"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CAT_BLURB, CAT_ICON, CAT_LABEL, CatIcon, allCategories, type Category } from "./StrollCityApp";
import styles from "./page.module.css";

const categoryColors: Record<Category, string> = {
  restaurant: "#b4703f",
  cafe: "#9a8236",
  bar: "#7e5f86",
  shop: "#3e7a6c",
  services: "#5a707e",
  gallery: "#a0607c",
};
const counts: Record<Category, number> = {
  restaurant: 29,
  cafe: 12,
  bar: 8,
  shop: 63,
  services: 47,
  gallery: 3,
};
const wash = (hex: string) => `linear-gradient(145deg, ${hex}26, ${hex}10)`;

const huntProducts = [
  {
    name: "Friendly Mode",
    price: "Free",
    note: "always",
    copy: "4 stops · a different four every time · postcard finish",
    button: "Start now →",
    href: "/calgary/hunt?type=friendly",
    label: "Start a free Friendly Mode hunt",
  },
  {
    name: "Full Hunt",
    price: "$20/team",
    note: "your first one’s free",
    copy: "8 stops · something waiting at the last one · postcard finish",
    button: "Start a hunt →",
    href: "/calgary/hunt?type=full",
    label: "Start a Full Hunt",
  },
  {
    name: "Loop Race",
    price: "$20/team",
    note: "2 teams and up",
    copy: "8 stops · rotated starts · live leaderboard",
    button: "Set up a race →",
    href: "/calgary/hunt/race/new",
    label: "Set up a Loop Race",
  },
  {
    name: "Event bookings",
    price: "From $99",
    note: "per booking",
    copy: "Book the street for a birthday, a staff day out, a class trip or a youth group",
    button: "Book an event →",
    href: "/events",
    label: "Book a Stroll event",
  },
] as const;

export default function LandingPage() {
  const [selected, setSelected] = useState<Set<Category>>(new Set());
  const toggle = (category: Category) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };
  const filterHref = useMemo(() => {
    if (!selected.size) return "/calgary";
    const cat = allCategories.filter((category) => selected.has(category)).join(",");
    return `/calgary?cat=${cat}`;
  }, [selected]);
  const filterCta = selected.size ? `Show ${selected.size} ${selected.size === 1 ? "category" : "categories"} on the map →` : "Open the map →";

  return (
    <main className={styles.landing}>
      <nav className={styles.landNav}>
        <div className={styles.landNavIn}>
          <Link className={styles.landBrand} href="/">
            <img src="/brand/stroll-mark.png" alt="" />
            <span className={styles.landBrandName}>Stroll <span>city</span></span>
          </Link>
          <div className={styles.landNavLinks}>
            <a href="#filter">Filters</a>
            <a href="#hunt">Scavenger hunts</a>
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
                  <Link className={`${styles.btn} ${styles.btnGhost}`} href="/calgary/hunt?type=friendly">Start a free hunt</Link>
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
                  <div className={styles.heroStaticMap} aria-hidden="true"><img src="/brand/stroll-main-map.jpg" alt="" /></div>
                  <span className={styles.landScHint}>Open the interactive map →</span>
                </div>
              </Link>
            </div>
          </div>
        </header>

        <section className={styles.landBlk} id="filter">
          <div className={styles.landSecHead}>
            <div className={styles.landSecHeadL}>
              <span className={styles.lbl}>Curate your own experience</span>
              <h2 className={styles.landH2}>Filter the street by mood.</h2>
            </div>
            <p>No route generator. No account. Pick what you’re in the mood for, watch everything else fade back, and decide where to stroll.</p>
          </div>
          <div className={styles.landCategoryGrid}>
            {allCategories.map((category) => {
              const on = selected.has(category);
              const color = categoryColors[category];
              return (
                <button key={category} className={`${styles.catcard} ${on ? styles.catcardOn : ""}`} onClick={() => toggle(category)} aria-pressed={on}>
                  <span className={styles.catCheck} style={on ? { background: color } : undefined}>{on ? "✓" : ""}</span>
                  <span className={styles.ccTile} style={{ background: wash(color), color }}><CatIcon d={CAT_ICON[category]} size={20} color={color} /></span>
                  <span className={styles.ccBody}><span className={styles.ccName}>{CAT_LABEL[category]}</span><span className={styles.ccMeta} style={{ color }}>{CAT_BLURB[category]}</span></span>
                  <span className={`${styles.ccN} ${styles.num}`}>{counts[category]}</span>
                </button>
              );
            })}
          </div>
          <div className={styles.landFilterActions}>
            <button className={styles.catControl} onClick={() => setSelected(new Set(allCategories))}>All</button>
            <button className={styles.catControl} onClick={() => setSelected(new Set())}>None</button>
            <Link className={`${styles.btn} ${styles.btnPrimary}`} href={filterHref}>{filterCta}</Link>
          </div>
        </section>

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
                <div className={styles.tierPrice}>{product.price}<span className={styles.tierNote}>{product.note}</span></div>
                <p className={styles.landPlanCopy}>{product.copy}</p>
                <span className={styles.landPlanButton}>{product.button}</span>
              </Link>
            ))}
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
