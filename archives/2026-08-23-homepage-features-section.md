# Archived homepage Features section

Archived on: 2026-08-23

Reason: Jonathan requested removing this homepage section because it added noise and distracted from the riddle-hunt promotion. This file preserves the removed JSX/data so the section can be referred back to or restored later.

Source file before removal: `app/src/app/page.tsx`

## Supporting data

```tsx
const FEATURE_CARDS = [
  { title: "Loop Race", copy: "Same eight stops, rotated starts, live leaderboard.", href: "/calgary/hunt/race/new" },
  { title: "Event bookings", copy: "Birthdays, staff days, class trips, youth groups.", href: "/events" },
  { title: "Claim your doorway", copy: "Owners update hours and photos in minutes.", href: "/portal" },
  { title: "How it works", copy: "The rules of the hunt, in one short page.", href: "/rules" },
];
```

## Removed homepage section

```tsx
<section className={styles.section} id="features">
  <div className={styles.sectionIn}>
    <div className={`${styles.head} ${styles.headNarrow}`} data-rise>
      <span className={`${styles.eyebrow} ${styles.eyebrowLime} ${styles.mono}`}>Features</span>
      <h2 className={styles.h2}>Everything the street needs, nothing it doesn’t</h2>
    </div>

    <div className={styles.featTop} data-rise>
      <div className={styles.featBig}>
        <span className={`${styles.eyebrow} ${styles.eyebrowMuted} ${styles.mono} ${styles.eyebrowFlush}`}>Mood filters</span>
        <strong className={styles.featTitle}>Six moods instead of forty categories</strong>
        <p className={styles.featCopy}>
          Shops, restaurants, studios, cafés, bars, arts. Every place carries one, so nothing lands in the wrong drawer.
        </p>
        <div className={styles.featChips}>
          {MOODS.map((mood) => (
            <span className={styles.featChip} key={mood.id}>
              <i style={{ background: mood.color }} />
              {mood.label}
            </span>
          ))}
        </div>
      </div>

      <div className={styles.featHuntCard}>
        <span className={`${styles.eyebrow} ${styles.mono} ${styles.eyebrowFlush}`}>Scavenger hunts</span>
        <strong className={styles.featTitle}>Four free stops, clues when you need them</strong>
        <p className={styles.featHuntCopy}>Riddle first, three clues after. The last clue names the shop so the walk keeps moving.</p>
        <a className={`${styles.btn} ${styles.btnSm} ${styles.btnPaper} ${styles.featCta}`} href="#hunt">
          Try the hunt<Arrow size={13} />
        </a>
      </div>
    </div>

    <div className={styles.featSmalls} data-rise>
      {FEATURE_CARDS.map((card) => (
        <Link className={styles.featSmall} key={card.title} href={card.href}>
          <strong className={styles.featSmallTitle}>{card.title}</strong>
          <p className={styles.featSmallCopy}>{card.copy}</p>
        </Link>
      ))}
    </div>
  </div>
</section>
```
