# Business page layout archive — map preview, owners section, and how steps

- **Date archived:** 2026-08-25
- **Reason:** Jonathan annotated the business page screenshot: remove the red-marked layout pieces, archive them in case they should come back later, and move the blue-circled owner claim card into the hero area where the map preview previously sat.
- **Source file:** `app/src/app/business/page.tsx`

## Archived constants/imported behavior

The old version used MapLibre, dynamic business loading, category filters, selected markers, and `HOW_STEPS` to support the hero mini-map and the claiming steps section.

```tsx
import maplibregl from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";
import { getCity } from "../cities";
import { CAT_LABEL, CatIcon, categoryColor, type Category } from "../StrollCityApp";

const city = getCity("calgary")!;

type Business = {
  id: string;
  name: string;
  address: string;
  category: Category;
  mono: string;
  lon: number;
  lat: number;
  blurb?: string;
  logo_url?: string;
  claim_status?: "unclaimed" | "pending" | "claimed" | "rejected";
};

const CATEGORY_ORDER: Category[] = ["restaurant", "cafe", "bar", "shop", "services", "gallery"];

const HOW_STEPS = [
  { title: "Find your listing", copy: "Search Calgary’s licence data by name or address. Pick your record and the address and category come with it." },
  { title: "Confirm you can speak for it", copy: "Your name, role and work email. Add a proof note if it helps us match you — a business-domain address verifies fastest." },
  { title: "Pick a plan and publish", copy: "Start free, or add a logo marker and gallery. Confirm the email we send and your pin goes verified on the Calgary map." },
];
```

## Archived hero mini-map preview

```tsx
<div className={styles.landShowcase}>
  <div className={styles.landScBar}>
    <span className={styles.landScDots}><i /><i /><i /></span>
    <span className={styles.landScUrl}>
      <CatIcon d="M5 11h14v9H5zm3.5 0V8a3.5 3.5 0 0 1 7 0v3" size={11} strokeWidth={1.8} />
      stroll.city/calgary
    </span>
  </div>
  <div className={styles.landScMap}>
    <div ref={mapNode} className={styles.minimap} />
    <div className={styles.landChips}>
      {CATEGORY_ORDER.map((cat) => (
        <button
          key={cat}
          type="button"
          className={styles.landChip}
          aria-pressed={active.has(cat)}
          onClick={() => toggleCategory(cat)}
        >
          <i style={{ background: categoryColor(city, cat) }} />{CAT_LABEL[cat]}
        </button>
      ))}
    </div>
    <div className={`${styles.landScCard} ${selected ? styles.landScCardOn : ""}`}>
      {selected && (
        <>
          <div className={styles.landScCardTitle}>{selected.name}</div>
          <div className={styles.landScCardMeta}>
            <span className={styles.dot} style={{ background: categoryColor(city, selected.category) }} />
            {CAT_LABEL[selected.category]}
          </div>
          <div className={styles.landScCardDesc}>{selected.blurb?.trim() || `${CAT_LABEL[selected.category]} on ${selected.address}`}</div>
          <div className={styles.landScCardAddr}>{selected.address}</div>
        </>
      )}
    </div>
    <span className={styles.landScHint}>Tap a rooftop</span>
  </div>
</div>
```

## Archived owners section

```tsx
<section className={styles.landBlk} id="owners">
  <div className={styles.landSecHead}>
    <div className={styles.landSecHeadL}>
      <span className={styles.lbl}>Two sides of one map</span>
      <h2 className={styles.landH2}>Useful to walk with.<br />Worth owning a pin on.</h2>
    </div>
    <p>Most directories serve advertisers first and visitors second. Stroll keeps the map honest — and still gives owners a reason to show up.</p>
  </div>
  <div className={styles.landDuo}>
    <div className={styles.landBigCard}>
      <span className={styles.landBcIc}>
        <CatIcon d="M4 18c2.5 0 2.5-3 5-3s2.5 3 5 3 2.5-3 5-3M4 12c2.5 0 2.5-3 5-3s2.5 3 5 3 2.5-3 5-3M12 3.5v2" size={22} strokeWidth={1.6} color="#15558F" />
      </span>
      <div>
        <span className={styles.lbl}>For people out walking</span>
        <h3 className={styles.landH3}>Everything on the block, nothing invented</h3>
        <p className={styles.landCardP}>Browse by what you’re in the mood for, not by who paid. Every pin traces back to a real licence at a real address.</p>
      </div>
      <div className={styles.landTicks}>
        <div className={styles.landTick}><CatIcon d="m5 13 4.5 4.5L19 7" size={17} strokeWidth={2} color="#15558F" />Six categories, hours and highlights at a glance</div>
        <div className={styles.landTick}><CatIcon d="m5 13 4.5 4.5L19 7" size={17} strokeWidth={2} color="#15558F" />Rooftop markers snapped to building footprints</div>
        <div className={styles.landTick}><CatIcon d="m5 13 4.5 4.5L19 7" size={17} strokeWidth={2} color="#15558F" />Profiles open beside the map — you never lose your place</div>
      </div>
    </div>

    <div className={`${styles.landBigCard} ${styles.landBigCardDark}`}>
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
</section>
```

## Archived claiming steps section

```tsx
<section className={styles.landBlk} id="how">
  <div className={styles.landSecHead}>
    <div className={styles.landSecHeadL}>
      <span className={styles.lbl}>Claiming, end to end</span>
      <h2 className={styles.landH2}>Three steps, no forms<br />you’ve filled before.</h2>
    </div>
    <p>The licence register already knows your address and category. We start from that, so you only tell us the part it can’t.</p>
  </div>
  <div className={styles.landSteps}>
    {HOW_STEPS.map((step, i) => (
      <div className={styles.landStepCard} key={step.title}>
        <span className={styles.landStepN}>{i + 1}</span>
        <h3 className={styles.landH3}>{step.title}</h3>
        <p className={styles.landCardP}>{step.copy}</p>
      </div>
    ))}
  </div>
</section>
```
