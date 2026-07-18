import Link from "next/link";
import { cities, themeStyle } from "./cities";
import styles from "./page.module.css";

export default function LandingPage() {
  return (
    <main className={styles.landing} style={themeStyle(cities[0].theme)}>
      <div className={styles.landingPaper} />
      <section className={styles.landingHero}>
        <div>
          <p className={styles.eyebrow}>Friendlier city discovery</p>
          <h1>Pick a city and start strolling.</h1>
          <p>
            Stroll turns local strips into illustrated, clickable rooftop maps — real streets, real buildings,
            and business mini-apps that keep visitors on the map.
          </p>
        </div>
        <div className={styles.cityGrid}>
          {cities.map((city) => (
            <article className={styles.landingCard} key={city.slug} style={themeStyle(city.theme)}>
              <span className={styles.status}>{city.status === "live" ? "Live MVP" : "Coming soon"}</span>
              <h2>{city.name}</h2>
              <p>{city.tagline}</p>
              <Link href={`/${city.slug}`}>{city.status === "live" ? "Open the map →" : "Preview the theme →"}</Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
