"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "../page.module.css";

const products = [
  ["group", "Group booking", "$9 per person", "Booked date, your logo on every postcard, one leaderboard, a results page to send round after. $199 minimum."],
  ["school", "School or youth group", "$4 per student", "Invoice or PO. $99 minimum."],
  ["charity", "Charity fundraiser", "$299 flat", "Any number of teams. You set the entry fee and keep all of it."],
] as const;

export default function EventsPage() {
  const [form, setForm] = useState({ product: "group", email: "", date: "", time: "13:00", groupSize: "24", audience: "adult", finishPreference: "snacks / coffee" });
  const [status, setStatus] = useState("Send the booking details and we’ll confirm the date by email within one business day.");

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
          <div className={styles.landHeroCopy}><span className={styles.landEyebrow}><i /> Group bookings</span><h1 className={styles.landH1}>Book a walkable team hunt.</h1><p className={styles.landHeroSub}>Published per-person pricing for staff days, schools, youth groups and charity fundraisers. We’ll confirm the date, venue option and payment details by email.</p><p className={styles.landCardP}><Link href="/">Walking on your own? The self-serve hunts are over here →</Link></p></div>
          <div className={styles.landShowcase} style={{ padding: 24, height: "auto" }}><span className={styles.lbl}>Price card</span><div className={styles.locked} style={{ marginTop: 16 }}>{products.map(([id, name, price, copy]) => <button key={id} className={styles.plan} aria-pressed={form.product === id} onClick={() => setForm({ ...form, product: id })}><span className={styles.planBody}><span className={styles.planTop}><span className={styles.planName}>{name}</span><span className={styles.planPrice}>{price}</span></span><span className={styles.planDesc}>{copy}</span></span></button>)}</div></div>
        </div></div></header>
        <section className={styles.landBlk}><div className={styles.landDuo} style={{ gridTemplateColumns: "minmax(0, 1fr)" }}>
          <div className={styles.landBigCard}><span className={styles.lbl}>Booking request</span><div className={styles.grid2}>
            <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            <Field label="Date" type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
            <Field label="Time" type="time" value={form.time} onChange={(v) => setForm({ ...form, time: v })} />
            <Field label="Group size" type="number" value={form.groupSize} onChange={(v) => setForm({ ...form, groupSize: v })} />
            <div className={styles.claimField}><label>Audience</label><div className={styles.ctl}><select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}><option value="family">Family</option><option value="adult">Adult</option></select></div></div>
            <Field label="Finish preference" value={form.finishPreference} onChange={(v) => setForm({ ...form, finishPreference: v })} />
          </div><div className={styles.landHeroCta}><button className={`${styles.btn} ${styles.btnPrimary}`} onClick={submit}>Send booking request</button><Link className={`${styles.btn} ${styles.btnGhost}`} href="/calgary/hunt">Try a hunt first</Link></div><p className={styles.landCardP}>{status}</p></div>
        </div></section>
      </div>
    </main>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; type?: string; onChange: (value: string) => void }) {
  return <div className={styles.claimField}><label>{label}</label><div className={styles.ctl}><input type={type} value={value} onChange={(e) => onChange(e.target.value)} /></div></div>;
}
