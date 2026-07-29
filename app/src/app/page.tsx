import Link from "next/link";
import { Beer, Coffee, MapPin, Palette, ShoppingBag, Sparkles, UtensilsCrossed } from "lucide-react";
import { cities } from "./cities";
import styles from "./page.module.css";

const CATEGORY_STRIP = [
  { Icon: UtensilsCrossed, label: "Restaurants", count: 44 },
  { Icon: ShoppingBag, label: "Shops", count: 55 },
  { Icon: Sparkles, label: "Studios & services", count: 44 },
  { Icon: Beer, label: "Bars & music", count: 10 },
  { Icon: Palette, label: "Arts & galleries", count: 5 },
  { Icon: Coffee, label: "Cafés & sweets", count: 4 },
];

const STATS = [
  { value: "162", label: "real Inglewood businesses mapped" },
  { value: "1 live · 4 queued", label: "Calgary neighbourhoods" },
  { value: "100%", label: "real building footprints, City of Calgary open data" },
];

export default function LandingPage() {
  return (
    <main className={styles.landing}>
      <section className={styles.landingHero}>
        <div>
          <img src="/brand/stroll-logo.png" alt="Stroll City" />
          <p className={styles.eyebrow}>Friendlier city discovery</p>
          <h1>Pick a city and start strolling.</h1>
          <p>
            Stroll turns local strips into illustrated, clickable rooftop maps — real streets, real buildings,
            and business mini-apps that keep visitors on the map.
          </p>
        </div>
        <div className={styles.cityGrid}>
          {cities.map((city) => (
            <article className={styles.landingCard} key={city.slug}>
              <span className={styles.status}>{city.status === "live" ? "Live MVP" : "Coming soon"}</span>
              <h2>{city.name}</h2>
              <p>{city.tagline}</p>
              <Link href={`/${city.slug}`}>{city.status === "live" ? "Open the map →" : "Preview the theme →"}</Link>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.categoryStrip}>
        <p className={styles.stripLabel}>What&rsquo;s mapped in Inglewood</p>
        <div className={styles.categoryRow}>
          {CATEGORY_STRIP.map(({ Icon, label, count }) => (
            <div key={label} className={styles.categoryChip}>
              <Icon size={20} aria-hidden />
              <span>{label}</span>
              <b>{count}</b>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.statsStrip}>
        {STATS.map((stat) => (
          <div key={stat.label} className={styles.statCard}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
        <div className={styles.statCard}>
          <MapPin size={22} aria-hidden />
          <span>Every business snapped to its verified licence address and real building footprint — no placeholder pins.</span>
        </div>
      </section>
    </main>
  );
}
