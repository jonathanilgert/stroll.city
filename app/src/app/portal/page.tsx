"use client";

import Link from "next/link";
import maplibregl from "maplibre-gl";
import { ChangeEvent, DragEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { getCity } from "../cities";
import { CAT_LABEL, CatIcon, IconAdd, IconExplore, categoryColor, type Category } from "../StrollCityApp";
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
  logo_url?: string;
  plan_tier?: "free" | "stroll" | "stroll_plus";
  claim_status?: "unclaimed" | "pending" | "claimed" | "rejected";
};

type ClaimResult = {
  id: string;
  business_id: string;
  plan_tier: string;
  checkout_mode: "mock" | "stripe";
  checkout_url: string | null;
  status: string;
};

const PLANS = [
  { id: "free", name: "Free", price: "$0", suffix: "", tag: null, copy: "Verified pin, name/category/address, and monogram marker.", logo: false, gallery: false, promos: false },
  { id: "stroll", name: "Stroll", price: "$29", suffix: "/mo", tag: "Most claimed", copy: "Logo marker, photo gallery, curated profile, hours, links, and highlights.", logo: true, gallery: true, promos: false },
  { id: "stroll_plus", name: "Stroll+", price: "$59", suffix: "/mo", tag: null, copy: "Everything in Stroll plus promos/events, featured placement, and analytics.", logo: true, gallery: true, promos: true },
] as const;
type PlanId = (typeof PLANS)[number]["id"];

const ROLES = ["Owner", "Co-owner or partner", "General manager", "Staff member, authorised", "Agency or representative"];

const STEP_LABELS = ["Your business", "Verify ownership", "Plan & review"];

const emailOk = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

export default function PortalPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [picked, setPicked] = useState<Business | null>(null);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [cursor, setCursor] = useState(-1);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [claimantName, setClaimantName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [proofNote, setProofNote] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [plan, setPlan] = useState<PlanId>("stroll");
  const [logoDataUrl, setLogoDataUrl] = useState<string | undefined>();
  const [logoName, setLogoName] = useState<string | undefined>();
  const [dragOver, setDragOver] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ClaimResult | null>(null);

  const mapNode = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    fetch("/api/v1/calgary/businesses")
      .then((response) => response.json())
      .then((json) => setBusinesses(Array.isArray(json.data) ? json.data : []))
      .catch(() => setLoadError("Could not load Calgary businesses from the API."));
  }, []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(event.target as Node)) setSearchOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  /* ---------------- mini map preview ---------------- */
  useEffect(() => {
    if (!mapNode.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: mapNode.current,
      style: {
        version: 8,
        sources: {
          carto: { type: "raster", tiles: ["https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png", "https://b.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png", "https://c.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png", "https://d.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png"], tileSize: 256, attribution: "© OpenStreetMap © CARTO" },
          cartoLabels: { type: "raster", tiles: ["https://a.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png", "https://b.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png", "https://c.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png", "https://d.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png"], tileSize: 256, opacity: 0.7 } as never,
        },
        layers: [
          { id: "carto", type: "raster", source: "carto" },
          { id: "cartoLabels", type: "raster", source: "cartoLabels", paint: { "raster-opacity": 0.7 } },
        ],
      },
      center: city.center,
      zoom: 14.5,
      attributionControl: false,
      interactive: false,
    });
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markerRef.current?.remove();
    markerRef.current = null;
    if (!picked) return;
    const el = document.createElement("div");
    el.className = `${styles.pin} ${styles.pinActive}`;
    const color = categoryColor(city, picked.category);
    const glyphInner = logoDataUrl && PLANS.find((p) => p.id === plan)?.logo
      ? `<img src="${logoDataUrl}" alt="" />`
      : picked.mono;
    el.innerHTML = `<span class="${styles.glyph}" style="background:${color}">${glyphInner}</span><span class="${styles.label}">${picked.name}</span>`;
    markerRef.current = new maplibregl.Marker({ element: el, anchor: "left" }).setLngLat([picked.lon, picked.lat]).addTo(map);
    map.flyTo({ center: [picked.lon, picked.lat], zoom: 16, duration: 600 });
  }, [picked, plan, logoDataUrl]);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return businesses.filter((b) => `${b.name} ${b.address}`.toLowerCase().includes(needle)).slice(0, 7);
  }, [query, businesses]);

  const claimable = (b: Business) => !b.claim_status || b.claim_status === "unclaimed";

  const choose = (business: Business) => {
    setPicked(business);
    setQuery("");
    setSearchOpen(false);
    setCursor(-1);
  };

  const onSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const rows = matches.filter(claimable);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!rows.length) return;
      setCursor((c) => (c + (event.key === "ArrowDown" ? 1 : -1) + rows.length) % rows.length);
    } else if (event.key === "Enter" && cursor > -1 && rows[cursor]) {
      event.preventDefault();
      choose(rows[cursor]);
    } else if (event.key === "Escape") {
      setSearchOpen(false);
    }
  };

  const fieldValid = (id: "name" | "role" | "email") => {
    if (id === "name") return !!claimantName.trim();
    if (id === "role") return !!role;
    return emailOk(email);
  };
  const showErr = (id: "name" | "role" | "email") => touched[id] && !fieldValid(id);

  const stepValid = (s: number) => {
    if (s === 1) return !!picked;
    if (s === 2) return fieldValid("name") && fieldValid("role") && fieldValid("email");
    return true;
  };

  const readLogoFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setMessage("Please choose an image file for the logo.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogoDataUrl(typeof reader.result === "string" ? reader.result : undefined);
    reader.readAsDataURL(file);
    setLogoName(file.name);
  };
  const onLogoInput = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) readLogoFile(file);
  };
  const onLogoDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) readLogoFile(file);
  };

  const goNext = () => {
    if (step < 3) {
      if (!stepValid(step)) {
        setTouched((t) => ({ ...t, name: true, role: true, email: true }));
        return;
      }
      setStep((s) => (s < 3 ? ((s + 1) as 1 | 2 | 3) : s));
    } else {
      submit();
    }
  };

  const submit = async () => {
    if (!picked) return;
    setSubmitting(true);
    setMessage("Submitting claim…");
    setResult(null);
    try {
      const response = await fetch("/api/v1/calgary/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: picked.id,
          claimant_name: claimantName,
          claimant_email: email,
          business_role: role,
          proof_notes: proofNote,
          plan_tier: plan,
          logo_data_url: PLANS.find((p) => p.id === plan)?.logo ? logoDataUrl : undefined,
          logo_name: logoName,
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        setMessage(json.error ?? "Claim submission failed.");
        setSubmitting(false);
        return;
      }
      setResult(json.data);
      setMessage(null);
    } catch {
      setMessage("Claim submission failed. Check your connection and try again.");
    }
    setSubmitting(false);
  };

  const reset = () => {
    setStep(1);
    setPicked(null);
    setClaimantName("");
    setRole("");
    setEmail("");
    setProofNote("");
    setTouched({});
    setPlan("stroll");
    setLogoDataUrl(undefined);
    setLogoName(undefined);
    setResult(null);
    setMessage(null);
  };

  const activePlan = PLANS.find((p) => p.id === plan)!;
  const done = !!result;

  return (
    <main className={styles.shell}>
      <nav className={styles.rail}>
        <img className={styles.railLogo} src="/brand/stroll-mark.png" alt="Stroll City" />
        <Link className={styles.railBtn} title="Back to Calgary map" href="/calgary"><IconExplore /></Link>
        <span className={`${styles.railBtn} ${styles.railOn}`} title="Claim a business"><IconAdd /></span>
      </nav>

      <div className={styles.portalMain}>
        <section className={styles.formCol}>
          <div className={styles.fHead}>
            <div className={styles.claimEyebrow}>
              <span className={styles.testBadge}>Test mode</span>
              <span>stroll.city business portal · Phase 4</span>
            </div>
            {!done ? (
              <>
                <h1 className={styles.claimTitle}>{picked ? `Claim your rooftop marker at ${picked.address}.` : "Claim your rooftop marker in Inglewood."}</h1>
                <p className={styles.claimSub}>Find your listing in Calgary’s licence data, confirm you’re the owner, and pick a plan. Three short steps — about two minutes.</p>
                <div className={styles.stepper}>
                  {STEP_LABELS.map((label, i) => {
                    const n = i + 1;
                    return (
                      <div key={label} className={styles.stepGroup}>
                        <div className={`${styles.step} ${step === n ? styles.stepOn : ""} ${step > n ? styles.stepDone : ""}`}>
                          <span className={styles.stepDot}>{step > n ? <CatIcon d="m5 13 4.5 4.5L19 7" size={12} strokeWidth={2.4} /> : n}</span>
                          <span className={styles.stepText}>{label}</span>
                        </div>
                        {n < 3 && <span className={styles.stepLine} />}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <h1 className={styles.claimTitle}>You’re one click from a verified pin.</h1>
                <p className={styles.claimSub}>We keep the record in test mode until you confirm by email.</p>
              </>
            )}
          </div>

          <div className={styles.fBody}>
            {!done && step === 1 && (
              <div className={styles.pane}>
                <div>
                  <h2 className={styles.paneH2}>Which business are you claiming?</h2>
                  <p className={styles.paneHint}>Search Calgary’s open business data. Picking your real record is what makes the pin verified — you won’t have to retype the address.</p>
                </div>

                <div className={styles.searchWrap} ref={searchWrapRef}>
                  <label className={styles.claimFieldLabel} htmlFor="bizSearch">Business name or address</label>
                  <div className={styles.ctl}>
                    <CatIcon d="M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm10.5 18.5-4-4" color="var(--ink-3)" size={16} strokeWidth={1.7} />
                    <input
                      id="bizSearch"
                      ref={searchInputRef}
                      type="text"
                      placeholder="e.g. Recordland, or 1208 9 Ave SE"
                      autoComplete="off"
                      value={query}
                      onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); setCursor(-1); }}
                      onFocus={() => query && setSearchOpen(true)}
                      onKeyDown={onSearchKeyDown}
                    />
                  </div>
                  {searchOpen && query.trim() && (
                    <div className={styles.searchResults}>
                      {!matches.length && <div className={styles.resEmpty}>No listing matches “{query}”. Try a shorter name or the street address.</div>}
                      {matches.map((b) => {
                        const takeable = claimable(b);
                        const idxAmongTakeable = matches.filter(claimable).indexOf(b);
                        return (
                          <button
                            key={b.id}
                            type="button"
                            disabled={!takeable}
                            className={`${styles.res} ${takeable && idxAmongTakeable === cursor ? styles.resCursor : ""}`}
                            onClick={() => takeable && choose(b)}
                          >
                            <span className={styles.resTile} style={{ background: categoryColor(city, b.category) }}>{b.mono}</span>
                            <span className={styles.resBody}>
                              <span className={styles.resName}>{b.name}</span>
                              <span className={styles.resMeta}>{CAT_LABEL[b.category]} · {b.address}</span>
                            </span>
                            {!takeable && <span className={styles.resTaken}>Already claimed</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <span className={styles.helper}>{businesses.length ? `${businesses.length} Calgary records are live.` : loadError ?? "Loading Calgary records…"}</span>
                </div>

                {picked && (
                  <div className={styles.picked}>
                    <div className={styles.pickedHead}>
                      <span className={styles.pickedTile} style={{ background: categoryColor(city, picked.category) }}>
                        {picked.logo_url ? <img src={picked.logo_url} alt="" /> : picked.mono}
                      </span>
                      <span className={styles.pickedBody}>
                        <span className={styles.pickedName}>{picked.name}</span>
                        <span className={styles.pickedMeta}>{CAT_LABEL[picked.category]} · {picked.address}, Calgary AB</span>
                      </span>
                      <button type="button" className={styles.swap} onClick={() => setPicked(null)}>Not this one</button>
                    </div>
                    <div className={styles.verifiedRow}>
                      <CatIcon d="m5 13 4.5 4.5L19 7" size={14} strokeWidth={2} color="var(--ok)" />
                      Address and location come straight from Calgary’s open data — nothing to retype.
                    </div>
                  </div>
                )}
              </div>
            )}

            {!done && step === 2 && (
              <div className={styles.pane}>
                <div>
                  <h2 className={styles.paneH2}>Confirm you can speak for this business</h2>
                  <p className={styles.paneHint}>A person, not a company, claims a listing. We check your details before the pin goes live.</p>
                </div>

                <div className={styles.grid2}>
                  <div className={`${styles.claimField} ${showErr("name") ? styles.claimFieldErr : ""}`}>
                    <label htmlFor="yourName">Your name <span className={styles.req}>*</span></label>
                    <div className={styles.ctl}><input id="yourName" value={claimantName} onChange={(e) => setClaimantName(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, name: true }))} placeholder="First and last name" autoComplete="name" /></div>
                    <span className={styles.errMsg}>Add the name we should verify.</span>
                  </div>
                  <div className={`${styles.claimField} ${showErr("role") ? styles.claimFieldErr : ""}`}>
                    <label htmlFor="role">Your role <span className={styles.req}>*</span></label>
                    <div className={styles.ctl}>
                      <select id="role" value={role} onChange={(e) => setRole(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, role: true }))}>
                        <option value="">Select a role</option>
                        {ROLES.map((r) => <option key={r}>{r}</option>)}
                      </select>
                    </div>
                    <span className={styles.errMsg}>Tell us how you’re connected to the business.</span>
                  </div>
                </div>

                <div className={`${styles.claimField} ${showErr("email") ? styles.claimFieldErr : ""}`}>
                  <label htmlFor="email">Work email <span className={styles.req}>*</span></label>
                  <div className={styles.ctl}><input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, email: true }))} placeholder="you@yourbusiness.ca" autoComplete="email" /></div>
                  <span className={styles.helper}>A business-domain address verifies fastest. Personal addresses are fine — they just take a manual check.</span>
                  <span className={styles.errMsg}>That email doesn’t look right.</span>
                </div>

                <div className={styles.claimField}>
                  <label htmlFor="proof">Proof note <span className={styles.optional}>— optional</span></label>
                  <textarea id="proof" className={styles.ctl} value={proofNote} onChange={(e) => setProofNote(e.target.value)} placeholder="Anything that helps us match you to the business — a business phone, licence number, or a link to a staff page." />
                </div>

                <div className={styles.callout}>
                  <CatIcon d="M3.5 5.5h17v13h-17zM4 7l8 6 8-6" size={17} color="var(--ink-2)" strokeWidth={1.6} />
                  <span><b>Nothing publishes without your say-so.</b> We email a confirmation link first; your pin only changes once you click it.</span>
                </div>
              </div>
            )}

            {!done && step === 3 && picked && (
              <div className={styles.pane}>
                <div>
                  <h2 className={styles.paneH2}>Pick a plan</h2>
                  <p className={styles.paneHint}>Start free and upgrade whenever. Watch the preview on the right — it shows exactly what each plan changes on the map.</p>
                </div>

                <div className={styles.plans}>
                  {PLANS.map((p) => (
                    <button key={p.id} type="button" className={styles.plan} aria-pressed={plan === p.id} onClick={() => setPlan(p.id)}>
                      <span className={styles.radio} />
                      <span className={styles.planBody}>
                        <span className={styles.planTop}>
                          <span className={styles.planName}>{p.name}</span>
                          {p.tag && <span className={styles.tagpill}>{p.tag}</span>}
                          <span className={styles.planPrice}>{p.price}{p.suffix && <small>{p.suffix}</small>}</span>
                        </span>
                        <span className={styles.planDesc}>{p.copy}</span>
                      </span>
                    </button>
                  ))}
                </div>

                {activePlan.logo && (
                  <div className={styles.claimField}>
                    <label>Logo for your marker</label>
                    <div className={styles.logoRow}>
                      <div
                        className={`${styles.logoSlot} ${dragOver ? styles.logoSlotOver : ""}`}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={onLogoDrop}
                        onClick={() => document.getElementById("logoFile")?.click()}
                      >
                        {logoDataUrl ? <img className={styles.logoPreview} src={logoDataUrl} alt="Logo preview" /> : <span className={styles.logoPlaceholder}>Drop logo</span>}
                        <input id="logoFile" type="file" accept="image/*" hidden onChange={onLogoInput} />
                      </div>
                      <span className={styles.helper}>Square works best — a 512px PNG or SVG with a transparent background. Drop it here and the marker on the right updates.<br /><br />You can skip this now and add it from your dashboard later.</span>
                    </div>
                  </div>
                )}

                <div>
                  <div className={styles.lbl} style={{ marginBottom: 9 }}>Review</div>
                  <div className={styles.review}>
                    <div className={styles.revRow}>
                      <span className={styles.revKey}>Business</span>
                      <span className={styles.revVal}>{picked.name}<br /><span className={styles.revSub}>{CAT_LABEL[picked.category]} · {picked.address}</span></span>
                      <button type="button" className={styles.edit} onClick={() => setStep(1)}>Edit</button>
                    </div>
                    <div className={styles.revRow}>
                      <span className={styles.revKey}>Claimed by</span>
                      <span className={styles.revVal}>{claimantName || "—"}{role && <><br /><span className={styles.revSub}>{role}</span></>}</span>
                      <button type="button" className={styles.edit} onClick={() => setStep(2)}>Edit</button>
                    </div>
                    <div className={styles.revRow}>
                      <span className={styles.revKey}>Email</span>
                      <span className={styles.revVal}>{email || "—"}</span>
                      <button type="button" className={styles.edit} onClick={() => setStep(2)}>Edit</button>
                    </div>
                    <div className={styles.revRow}>
                      <span className={styles.revKey}>Plan</span>
                      <span className={styles.revVal}>{activePlan.name} · {activePlan.price}{activePlan.suffix}{activePlan.logo && <><br /><span className={styles.revSub}>{logoDataUrl ? "Logo marker ready" : "No logo yet — add it any time"}</span></>}</span>
                    </div>
                  </div>
                </div>

                <div className={`${styles.callout} ${styles.calloutAmber}`}>
                  <CatIcon d="M12 3l8 3.5v5c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10v-5L12 3Zm-3 9 2 2 4-4" size={17} color="var(--amber)" strokeWidth={1.7} />
                  <span><b>Test mode.</b> No card is charged and no payment details are collected. Paid plans move to Stripe Checkout when Phase 5 ships.</span>
                </div>

                {message && <p className={styles.portalMessage}>{message}</p>}
              </div>
            )}

            {done && result && (
              <div className={styles.doneWrap}>
                <div className={styles.tick}><CatIcon d="m5 13 4.5 4.5L19 7" size={26} strokeWidth={1.8} color="var(--ok)" /></div>
                <div>
                  <h2 className={styles.doneTitle}>Claim submitted for {picked?.name}</h2>
                  <p className={styles.paneHint}>We’ve sent a confirmation link to <b style={{ fontWeight: 500, color: "var(--ink)" }}>{email}</b>. Here’s what happens next.</p>
                </div>
                <div className={styles.timeline}>
                  <div className={`${styles.tl} ${styles.tlNow}`}>
                    <span className={styles.railC}><span className={styles.tdot}>1</span><span className={styles.tline} /></span>
                    <span className={styles.tb}><span className={styles.tt}>Confirm your email</span><span className={styles.td}>The link expires in 24 hours. Nothing changes on the map until you click it.</span></span>
                  </div>
                  <div className={styles.tl}>
                    <span className={styles.railC}><span className={styles.tdot}>2</span><span className={styles.tline} /></span>
                    <span className={styles.tb}><span className={styles.tt}>We match you to the record</span><span className={styles.td}>Usually same day for business-domain emails, up to two working days otherwise.</span></span>
                  </div>
                  <div className={styles.tl}>
                    <span className={styles.railC}><span className={styles.tdot}>3</span></span>
                    <span className={styles.tb}><span className={styles.tt}>Your pin goes verified</span><span className={styles.td}>You get a dashboard for hours, photos, links and events — and your marker updates on the Calgary map.{result.checkout_mode === "stripe" && result.checkout_url ? " Your checkout link is ready whenever you want to finish setting up billing." : ""}</span></span>
                  </div>
                </div>
                <div className={styles.callout}>
                  <CatIcon d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-9v5m0-8h0" size={17} color="var(--ink-2)" strokeWidth={1.6} />
                  <span>Spotted a mistake? Reply to that email and we’ll fix the record before anything publishes.</span>
                </div>
                <p className={styles.claimRef}>Claim reference: {result.id}</p>
              </div>
            )}
          </div>

          <div className={styles.fFoot}>
            {!done && step > 1 && (
              <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}>
                <CatIcon d="M19 12H6m6-7-7 7 7 7" size={15} strokeWidth={1.8} /> Back
              </button>
            )}
            {!done && <span className={styles.prog}>Step {step} of 3</span>}
            <span className={styles.spacer} />
            {!done ? (
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} disabled={!stepValid(step) || submitting} onClick={goNext}>
                {step < 3 ? <>Continue <CatIcon d="M5 12h13m-7-7 7 7-7 7" size={15} strokeWidth={1.8} color="#fff" /></> : submitting ? "Submitting…" : <>Submit test-mode claim <CatIcon d="m5 13 4.5 4.5L19 7" size={15} strokeWidth={1.8} color="#fff" /></>}
              </button>
            ) : (
              <>
                <Link className={`${styles.btn} ${styles.btnGhost}`} href="/calgary"><CatIcon d="M19 12H6m6-7-7 7 7 7" size={15} strokeWidth={1.8} /> Back to the Calgary map</Link>
                <span className={styles.spacer} />
                <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={reset}>Claim another business</button>
              </>
            )}
          </div>
        </section>

        <aside className={styles.aside}>
          <div className={styles.pcard}>
            <div className={styles.pcardHead}>
              <h3>Live preview</h3>
              <span className={styles.lbl}>On the map</span>
            </div>
            <div className={styles.mapMini}><div ref={mapNode} className={styles.minimap} /></div>
            {!picked ? (
              <div className={styles.emptyPrev}>Pick your business and this shows the marker and profile card exactly as visitors will see them.</div>
            ) : (
              <div className={styles.prevBody}>
                <div>
                  <div className={styles.prevTitle}>{picked.name}</div>
                  <div className={styles.prevSub}>
                    <span className={styles.pill} style={{ color: categoryColor(city, picked.category), borderColor: `${categoryColor(city, picked.category)}33`, background: `${categoryColor(city, picked.category)}10` }}>{CAT_LABEL[picked.category]}</span>
                    <span className={`${styles.pill} ${styles.pillOk}`}>✓ Verified</span>
                    <span>{picked.address}</span>
                  </div>
                </div>
                <div className={styles.locked}>
                  <LockRow on text="Verified pin, name, category, address" />
                  <LockRow on={activePlan.logo && !!logoDataUrl} text={activePlan.logo ? `Logo marker${logoDataUrl ? "" : " — drop a logo below"}` : "Logo marker"} />
                  <LockRow on={activePlan.gallery} text="Photos, hours, links, highlights" />
                  <LockRow on={activePlan.promos} text="Promos, events, featured placement" />
                </div>
                {claimantName && <div className={styles.managedBy}>Managed by {claimantName}{role ? ` · ${role}` : ""}</div>}
              </div>
            )}
          </div>

          <div className={styles.helpCard}>
            <b>Can’t find your listing?</b>
            New businesses take a few weeks to reach Calgary’s open-data release. Try searching a nearby street address instead.
          </div>
        </aside>
      </div>
    </main>
  );
}

function LockRow({ on, text }: { on: boolean; text: string }) {
  return (
    <div className={`${styles.lockRow} ${on ? styles.lockRowOn : ""}`}>
      <span className={styles.lockIc}>
        {on ? <CatIcon d="m5 13 4.5 4.5L19 7" size={12} strokeWidth={2.2} /> : <CatIcon d="M5 11h14v9H5zm3.5 0V8a3.5 3.5 0 0 1 7 0v3" size={11} strokeWidth={2} />}
      </span>
      {text}
    </div>
  );
}
