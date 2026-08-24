# Archived homepage business claim section

Archived on: 2026-08-24

Reason: Jonathan requested removing the large lower-page “Claim your doorway on the street” business CTA because it may confuse regular site visitors. Business owners can continue using the top-right “For businesses” tab / business route.

Source file before removal: `app/src/app/page.tsx`

## Removed homepage section

```tsx
<section className={styles.section} id="business">
  <div className={styles.bizBand} data-rise>
    <figure className={styles.bizFig}>
      <svg viewBox="0 0 600 450" preserveAspectRatio="xMidYMid slice" className={styles.figArt} aria-hidden>
        <rect width="600" height="450" fill="#CFDCFF" />
        <rect y="330" width="600" height="120" fill="#F6FBDA" />
        <rect x="24" y="150" width="150" height="180" rx="8" fill="#fff" />
        <rect x="192" y="110" width="170" height="220" rx="8" fill="#0B47E8" />
        <rect x="380" y="168" width="146" height="162" rx="8" fill="#F9BFD0" />
        <rect x="48" y="182" width="102" height="60" rx="5" fill="#DCF23C" />
        <rect x="216" y="146" width="122" height="70" rx="5" fill="#CFDCFF" opacity=".85" />
        <rect x="404" y="198" width="98" height="56" rx="5" fill="#fff" opacity=".9" />
        <rect x="80" y="268" width="38" height="62" rx="4" fill="#0736B8" />
        <rect x="256" y="248" width="42" height="82" rx="4" fill="#DCF23C" />
        <rect x="434" y="264" width="38" height="66" rx="4" fill="#0B47E8" />
        <circle cx="132" cy="372" r="16" fill="#0B47E8" />
        <circle cx="322" cy="382" r="20" fill="#14161A" opacity=".8" />
        <circle cx="486" cy="368" r="14" fill="#C2296B" />
      </svg>
    </figure>
    <div className={styles.bizCopy}>
      <span className={`${styles.eyebrow} ${styles.eyebrowLime} ${styles.mono}`}>For businesses</span>
      <h2 className={`${styles.h2} ${styles.bizH2}`}>Claim your doorway on the street</h2>
      <p className={styles.bizLead}>
        Owners keep their own hours, photos and description up to date, and can host a hunt stop at their door. Free while Inglewood is our first street.
      </p>
      <div className={styles.bizActions}>
        <Link className={`${styles.btn} ${styles.btnMd} ${styles.btnDark}`} href="/portal">Claim your shop<Arrow size={13} /></Link>
        <Link className={`${styles.btn} ${styles.btnMd} ${styles.btnBiz}`} href="/business">What owners get</Link>
      </div>
    </div>
  </div>
</section>
```
