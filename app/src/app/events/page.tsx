"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "../page.module.css";

const products = [
  ["friendly", "Friendly Mode", "Free", "4 stops, unlimited replays, randomized"],
  ["full", "Full Hunt", "$20/team", "8 stops, postcard finish. First full hunt free per email"],
  ["race", "Loop Race", "$20/team", "2–8 teams self-serve, rotated starts, live leaderboard"],
  ["private", "Event bookings", "From $99", "Birthdays, staff days out, class trips and youth groups"],
  ["corporate", "Corporate", "$499", "Up to 10 teams, custom riddles, branded postcards, facilitation"],
  ["school", "School / youth non-profit", "$99", "Up to 8 teams, history route"],
  ["charity", "Charity fundraiser", "$299 flat", "Unlimited teams; charity keeps entry fees"],
] as const;

export default function EventsPage() {
  const [form, setForm] = useState({ product: "private", email: "", date: "", time: "13:00", groupSize: "12", audience: "family", finishPreference: "snacks / coffee" });
  const [status, setStatus] = useState("Request a date and we’ll confirm the details by email.");

  const submit = async () => {
    setStatus("Sending request…");
    const response = await fetch("/api/v1/calgary/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, groupSize: Number(form.groupSize) }) });
    const json = await response.json();
    if (!response.ok) return setStatus(json.error ?? "Booking failed");
    setStatus(`${json.data.label}: request received. We’ll confirm by email.`);
  };

  return (
    <main className={styles.landing}>
      <nav className={styles.landNav}><div className={styles.landNavIn}>
        <Link className={styles.landBrand} href="/"><img src="/brand/stroll-mark.png" alt="" /><span className={styles.landBrandName}>Stroll <span>city</span></span></Link>
        <div className={styles.landNavLinks}><Link href="/calgary/hunt">Hunts</Link><Link href="/rules">Contest rules</Link><Link href="/business">For businesses</Link></div>
      </div></nav>
      <div className={styles.landWrap}>
        <header className={styles.landHero}><div className={styles.landHeroCard}><div className={styles.landHeroGrid}>
          <div className={styles.landHeroCopy}><span className={styles.landEyebrow}><i /> Private & corporate hunts</span><h1 className={styles.landH1}>Book a walkable team hunt.</h1><p className={styles.landHeroSub}>Pick the product, date, group size and finish preference. We’ll confirm the route, timing and payment details with you directly.</p></div>
          <div className={styles.landShowcase} style={{ padding: 24, height: "auto" }}><span className={styles.lbl}>Price card</span><div className={styles.locked} style={{ marginTop: 16 }}>{products.map(([id, name, price, copy]) => <button key={id} className={styles.plan} aria-pressed={form.product === id} onClick={() => setForm({ ...form, product: id })}><span className={styles.planBody}><span className={styles.planTop}><span className={styles.planName}>{name}</span><span className={styles.planPrice}>{price}</span></span><span className={styles.planDesc}>{copy}</span></span></button>)}</div></div>
        </div></div></header>
        <section className={styles.landBlk}><div className={styles.landDuo}>
          <div className={styles.landBigCard}><span className={styles.lbl}>Booking request</span><div className={styles.grid2}>
            <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            <Field label="Date" type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
            <Field label="Time" type="time" value={form.time} onChange={(v) => setForm({ ...form, time: v })} />
            <Field label="Group size" type="number" value={form.groupSize} onChange={(v) => setForm({ ...form, groupSize: v })} />
            <div className={styles.claimField}><label>Audience</label><div className={styles.ctl}><select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}><option value="family">Family</option><option value="adult">Adult</option></select></div></div>
            <Field label="Finish preference" value={form.finishPreference} onChange={(v) => setForm({ ...form, finishPreference: v })} />
          </div><div className={styles.landHeroCta}><button className={`${styles.btn} ${styles.btnPrimary}`} onClick={submit}>Send booking request</button><Link className={`${styles.btn} ${styles.btnGhost}`} href="/calgary/hunt">Try a hunt first</Link></div><p className={styles.landCardP}>{status}</p></div>
          <div className={styles.landBigCard}><span className={styles.lbl}>Before first paid booking</span><div className={styles.locked}><div className={styles.callout}>Commercial general liability insurance and a signed waiver.</div><div className={styles.callout}>Youth supervision and consent remain the booking organisation&apos;s responsibility.</div><div className={styles.callout}>Weather/cancellation policy: free reschedule with 24 hours notice, full refund if stroll.city cancels, no refund for no-shows.</div><div className={styles.callout}>GST registration once revenue crosses $30K rolling threshold.</div></div></div>
        </div></section>
      </div>
    </main>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; type?: string; onChange: (value: string) => void }) {
  return <div className={styles.claimField}><label>{label}</label><div className={styles.ctl}><input type={type} value={value} onChange={(e) => onChange(e.target.value)} /></div></div>;
}
