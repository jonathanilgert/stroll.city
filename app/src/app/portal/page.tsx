"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import styles from "../page.module.css";

type Business = {
  id: string;
  name: string;
  address: string;
  category: string;
  mono: string;
  logo_url?: string;
  plan_tier?: "free" | "stroll" | "stroll_plus";
  claim_status?: string;
};

type ClaimResult = {
  id: string;
  business_id: string;
  plan_tier: string;
  checkout_mode: "mock" | "stripe";
  checkout_url: string | null;
  status: string;
};

const plans = [
  { id: "free", name: "Free", price: "$0", copy: "Verified pin, name/category/address, and monogram marker." },
  { id: "stroll", name: "Stroll", price: "$29/mo", copy: "Logo marker, photo gallery, curated profile, hours, links, and highlights." },
  { id: "stroll_plus", name: "Stroll+", price: "$59/mo", copy: "Everything in Stroll plus promos/events, featured placement, and analytics." },
] as const;

export default function PortalPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [businessId, setBusinessId] = useState("");
  const [plan, setPlan] = useState<(typeof plans)[number]["id"]>("stroll");
  const [claimantName, setClaimantName] = useState("");
  const [claimantEmail, setClaimantEmail] = useState("");
  const [role, setRole] = useState("Owner / manager");
  const [licenceId, setLicenceId] = useState("");
  const [logoDataUrl, setLogoDataUrl] = useState<string | undefined>();
  const [message, setMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ClaimResult | null>(null);

  useEffect(() => {
    fetch("/api/v1/calgary/businesses")
      .then((response) => response.json())
      .then((json) => {
        const rows = Array.isArray(json.data) ? json.data : [];
        setBusinesses(rows);
        const requested = new URLSearchParams(window.location.search).get("business");
        setBusinessId(rows.find((row: Business) => row.id === requested)?.id ?? rows[0]?.id ?? "");
      })
      .catch(() => setMessage("Could not load Calgary businesses from the API."));
  }, []);

  const selected = useMemo(() => businesses.find((business) => business.id === businessId), [businesses, businessId]);

  const onLogo = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Please choose an image file for the logo.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogoDataUrl(typeof reader.result === "string" ? reader.result : undefined);
    reader.readAsDataURL(file);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("Submitting claim…");
    setResult(null);
    const response = await fetch("/api/v1/calgary/claims", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        business_id: businessId,
        claimant_name: claimantName,
        claimant_email: claimantEmail,
        business_role: role,
        licence_id: licenceId,
        plan_tier: plan,
        logo_data_url: logoDataUrl,
        proof_notes: "Phase 4 test-mode portal submission from /portal.",
      }),
    });
    const json = await response.json();
    if (!response.ok) {
      setMessage(json.error ?? "Claim submission failed.");
      return;
    }
    setResult(json.data);
    setMessage("Claim saved. Reload the map to see the upgraded marker/logo in this preview.");
  };

  return (
    <main className={styles.portalPage}>
      <section className={styles.portalHeroCard}>
        <Link href="/calgary" className={styles.portalBack}>← Back to Calgary map</Link>
        <p className={styles.eyebrow}>stroll.city business portal · Phase 4</p>
        <h1>Claim a rooftop marker, upload a logo, and choose a Stroll plan.</h1>
        <p>Test-mode portal flow for Calgary/Inglewood. It writes to the Phase 4 runtime layer now and is shaped for Supabase Auth, Supabase Storage, and Stripe Checkout next.</p>
      </section>

      <form className={styles.portalForm} onSubmit={submit}>
        <label>
          Business from Calgary licence data
          <select value={businessId} onChange={(event) => setBusinessId(event.target.value)} required>
            {businesses.map((business) => <option key={business.id} value={business.id}>{business.name} · {business.address}</option>)}
          </select>
        </label>

        {selected && <div className={styles.portalSelected}><b>{selected.logo_url ? "Logo uploaded" : selected.mono}</b><span>{selected.name}</span><small>{selected.claim_status ?? "unclaimed"} · {selected.plan_tier ?? "free"}</small></div>}

        <div className={styles.portalSplit}>
          <label>Your name<input value={claimantName} onChange={(event) => setClaimantName(event.target.value)} required /></label>
          <label>Email<input type="email" value={claimantEmail} onChange={(event) => setClaimantEmail(event.target.value)} required /></label>
        </div>
        <div className={styles.portalSplit}>
          <label>Role<input value={role} onChange={(event) => setRole(event.target.value)} /></label>
          <label>Licence / proof note<input value={licenceId} onChange={(event) => setLicenceId(event.target.value)} placeholder="Optional for test mode" /></label>
        </div>

        <label>
          Logo upload
          <input type="file" accept="image/*" onChange={onLogo} />
        </label>
        {logoDataUrl && <img className={styles.portalLogoPreview} src={logoDataUrl} alt="Logo preview" />}

        <div className={styles.planGrid}>{plans.map((item) => (
          <button key={item.id} type="button" className={plan === item.id ? styles.selectedPlan : ""} onClick={() => setPlan(item.id)}>
            <b>{item.name}</b><strong>{item.price}</strong><span>{item.copy}</span>
          </button>
        ))}</div>

        <button className={styles.claimRow} type="submit">Submit test-mode claim</button>
        {message && <p className={styles.portalMessage}>{message}</p>}
        {result && <div className={styles.portalResult}><b>Claim {result.id}</b><span>Status: {result.status}</span><span>Checkout: {result.checkout_mode}{result.checkout_url ? ` · ${result.checkout_url}` : " · no checkout for Free"}</span></div>}
      </form>
    </main>
  );
}
