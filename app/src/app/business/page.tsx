"use client";

import Link from "next/link";
import maplibregl from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";
import { getCity } from "../cities";
import { CAT_LABEL, CatIcon, categoryColor, type Category } from "../StrollCityApp";
import styles from "../page.module.css";

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

const HOW_STEPS = [
  { title: "Find your listing", copy: "Search Calgary’s licence data by name or address. Pick your record and the address and category come with it." },
  { title: "Confirm you can speak for it", copy: "Your name, role and work email. Add a proof note if it helps us match you — a business-domain address verifies fastest." },
  { title: "Pick a plan and publish", copy: "Start free, or add a logo marker and gallery. Confirm the email we send and your pin goes verified on the Calgary map." },
];

export default function LandingPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [active, setActive] = useState<Set<Category>>(new Set(CATEGORY_ORDER));
  const [selected, setSelected] = useState<Business | null>(null);

  const mapNode = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    fetch("/api/v1/calgary/businesses")
      .then((response) => response.json())
      .then((json) => setBusinesses(Array.isArray(json.data) ? json.data : []))
      .catch(() => {});
  }, []);

  const totalCount = businesses.length;


  const showcase = useMemo(() => {
    const perCategory: Business[] = [];
    CATEGORY_ORDER.forEach((cat) => {
      // Spread picks along the strip (by longitude) instead of taking the first N in a row,
      // so the decorative preview doesn't cluster several pins on top of each other.
      const inCat = businesses.filter((b) => b.category === cat).sort((a, b) => a.lon - b.lon);
      const pick = inCat.length <= 2 ? inCat : [inCat[0], inCat[Math.floor(inCat.length / 2)], inCat[inCat.length - 1]];
      perCategory.push(...pick);
    });
    return perCategory;
  }, [businesses]);

  const visible = showcase.filter((b) => active.has(b.category));

  /* ---------------- showcase mini map ---------------- */
  useEffect(() => {
    if (!mapNode.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: mapNode.current,
      style: {
        version: 8,
        sources: {
          carto: { type: "raster", tiles: ["https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png", "https://b.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png", "https://c.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png", "https://d.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png"], tileSize: 256, attribution: "© OpenStreetMap © CARTO" },
          cartoLabels: { type: "raster", tiles: ["https://a.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png", "https://b.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png", "https://c.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png", "https://d.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png"], tileSize: 256 },
        },
        layers: [
          { id: "carto", type: "raster", source: "carto" },
          { id: "cartoLabels", type: "raster", source: "cartoLabels", paint: { "raster-opacity": 0.7 } },
        ],
      },
      center: city.center,
      zoom: 14.6,
      attributionControl: false,
      interactive: false,
    });
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !showcase.length) return;
    const bounds = new maplibregl.LngLatBounds();
    showcase.forEach((b) => bounds.extend([b.lon, b.lat]));
    map.fitBounds(bounds, { padding: { top: 40, bottom: 60, left: 30, right: 30 }, animate: false, maxZoom: 16.5 });
  }, [showcase]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    const placed: maplibregl.Point[] = [];
    visible.forEach((b) => {
      const on = selected?.id === b.id;
      const point = map.project([b.lon, b.lat]);
      if (!on && placed.some((p) => Math.hypot(p.x - point.x, p.y - point.y) < 26)) return;
      placed.push(point);
      const el = document.createElement("div");
      el.className = `${styles.landPin} ${styles.landCompact} ${on ? styles.landPinOn : ""}`;
      el.innerHTML = `<span class="${styles.landGlyph}" style="background:${categoryColor(city, b.category)}">${b.mono}</span>`;
      el.onclick = () => setSelected(b);
      markersRef.current.push(new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat([b.lon, b.lat]).addTo(map));
    });
  }, [visible, selected]);

  const toggleCategory = (cat: Category) => {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      if (selected && !next.has(selected.category)) setSelected(null);
      return next;
    });
  };

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
            <a href="#how">How claiming works</a>
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
                  <span><b>{totalCount || "—"}</b> Inglewood storefronts mapped</span>
                  <span className={styles.landTrustSep} />
                  <span><b>City of Calgary</b> open licence data</span>
                  <span className={styles.landTrustSep} />
                  <span>Free tier, always</span>
                </div>
              </div>

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
            </div>
          </div>
        </header>

        <div className={`${styles.landStats} ${styles.landStatsThree}`}>
          <div className={styles.landStat}><div className={styles.landStatV}>9 Ave SE</div><div className={styles.landStatK}>The whole strip, end to end</div></div>
          <div className={`${styles.landStat} ${styles.landStatAccent}`}><div className={styles.landStatV}>100%</div><div className={styles.landStatK}>Real building footprints, not dropped pins</div></div>
          <div className={styles.landStat}><div className={styles.landStatV}>Free</div><div className={styles.landStatK}>For Inglewood businesses until 31 March 2027</div></div>
        </div>

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
                <Link className={`${styles.btn} ${plan.hot ? styles.btnClaim : styles.btnLine}`} href="/portal">{plan.cta}</Link>
              </div>
            ))}
          </div>
        </section>



        <section className={styles.landBlk} id="switches">
          <div className={styles.landSecHead}>
            <div className={styles.landSecHeadL}>
              <span className={styles.lbl}>Optional extras</span>
              <h2 className={styles.landH2}>Two things you can switch on, if you want to.</h2>
            </div>
            <p>Neither is required. Both start off, and both are yours to change or pause whenever you like.</p>
          </div>
          <div className={styles.landDuo}>
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
              <a href="#owners">For owners</a>
              <a href="#plans">Plans</a>
            </div>
            <div className={styles.landFootCol}>
              <span className={styles.lbl}>Business</span>
              <Link href="/portal">Claim a listing</Link>
              <a href="#plans">Plans &amp; logo</a>
              <a href="#how">How claiming works</a>
            </div>
            <p className={styles.landFootNote}>Basemap © OpenStreetMap contributors © CARTO.</p>
          </div>
        </footer>
      </div>
    </main>
  );
}
