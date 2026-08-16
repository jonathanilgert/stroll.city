"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CAT_LABEL, CatIcon, IconExplore, type Category } from "../StrollCityApp";
import styles from "../page.module.css";

type Business = {
  id: string;
  name: string;
  address: string;
  category: Category;
  sub_category?: string;
  mono: string;
  hours?: string;
  phone?: string | null;
  website?: string | null;
  blurb?: string;
  plan_tier?: "free" | "stroll" | "stroll_plus";
  claim_status?: "unclaimed" | "pending" | "claimed" | "rejected";
  verified_by_staff?: boolean;
  last_verified_at?: string;
  offers_finisher_item?: boolean;
  finisher_item?: string;
  finisher_cap_weekly?: number;
  donates_to_basket?: boolean;
  basket_item?: string;
  notes?: string;
  walk_up?: boolean;
};

type ClaimCode = { id: string; business_id: string; code: string; expires_at: string; used_at?: string | null };
type PendingWrite = { id: string; kind: "patch" | "action"; payload: Record<string, unknown>; created_at: string };

const API = "/api/v1/calgary/admin/businesses";
const EDITABLE: Array<{ key: keyof Business; label: string; type?: "textarea" | "select" | "checkbox" | "number" }> = [
  { key: "name", label: "Name" },
  { key: "category", label: "Category", type: "select" },
  { key: "sub_category", label: "Sub-category" },
  { key: "address", label: "Address" },
  { key: "hours", label: "Hours" },
  { key: "phone", label: "Phone" },
  { key: "website", label: "Website" },
  { key: "blurb", label: "Blurb", type: "textarea" },
  { key: "walk_up", label: "Walk-up eligible", type: "checkbox" },
  { key: "offers_finisher_item", label: "Offers finisher item", type: "checkbox" },
  { key: "finisher_item", label: "Finisher item" },
  { key: "finisher_cap_weekly", label: "Weekly cap", type: "number" },
  { key: "donates_to_basket", label: "Donates to basket", type: "checkbox" },
  { key: "basket_item", label: "Basket item" },
  { key: "notes", label: "Notes for BIA evidence log", type: "textarea" },
];

const cats: Category[] = ["restaurant", "cafe", "bar", "shop", "services", "gallery"];

export default function AdminPage() {
  const [token, setToken] = useState(() => typeof window === "undefined" ? "" : localStorage.getItem("stroll-admin-token") ?? "");
  const [actor, setActor] = useState(() => typeof window === "undefined" ? "Jonathan" : localStorage.getItem("stroll-admin-actor") ?? "Jonathan");
  const [query, setQuery] = useState("");
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [pickedId, setPickedId] = useState<string>("");
  const [draft, setDraft] = useState<Partial<Business>>({});
  const [codes, setCodes] = useState<ClaimCode[]>([]);
  const [pending, setPending] = useState<PendingWrite[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("stroll-admin-pending") ?? "[]") as PendingWrite[]; }
    catch { return []; }
  });
  const [status, setStatus] = useState("Load the staff list to begin.");
  const [saving, setSaving] = useState(false);

  const picked = businesses.find((business) => business.id === pickedId) ?? null;
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const rows = needle ? businesses.filter((b) => `${b.name} ${b.address} ${b.category} ${b.sub_category ?? ""}`.toLowerCase().includes(needle)) : businesses;
    return rows.slice(0, 80);
  }, [businesses, query]);

  useEffect(() => {
    localStorage.setItem("stroll-admin-token", token);
    localStorage.setItem("stroll-admin-actor", actor);
  }, [token, actor]);

  useEffect(() => {
    localStorage.setItem("stroll-admin-pending", JSON.stringify(pending));
  }, [pending]);

  const headers = () => ({
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : { "x-stroll-admin-preview": "1" }),
    "x-stroll-actor": actor,
  });

  const load = async () => {
    setStatus("Loading staff view…");
    try {
      const response = await fetch(`${API}?q=${encodeURIComponent(query)}`, { headers: headers() });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Admin API failed");
      setBusinesses(json.data.businesses ?? []);
      setCodes(json.data.claimCodes ?? []);
      if (!pickedId && json.data.businesses?.[0]) choose(json.data.businesses[0]);
      setStatus(`${json.count} businesses loaded. ${pending.length} offline write${pending.length === 1 ? "" : "s"} waiting.`);
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : "Could not load staff view.");
    }
  };

  const choose = (business: Business) => {
    setPickedId(business.id);
    setDraft({
      name: business.name,
      category: business.category,
      sub_category: business.sub_category ?? "",
      address: business.address,
      hours: business.hours ?? "",
      phone: business.phone ?? "",
      website: business.website ?? "",
      blurb: business.blurb ?? "",
      walk_up: business.walk_up ?? true,
      offers_finisher_item: Boolean(business.offers_finisher_item),
      finisher_item: business.finisher_item ?? "",
      finisher_cap_weekly: business.finisher_cap_weekly ?? 10,
      donates_to_basket: Boolean(business.donates_to_basket),
      basket_item: business.basket_item ?? "",
      notes: business.notes ?? "",
    });
  };

  const enqueue = (write: Omit<PendingWrite, "id" | "created_at">) => {
    const row = { ...write, id: `pending_${Date.now()}`, created_at: new Date().toISOString() };
    setPending((rows) => [row, ...rows]);
    setStatus("No connection — saved locally. Tap Sync pending when signal returns.");
  };

  const request = async (method: "PATCH" | "POST", payload: Record<string, unknown>) => {
    const response = await fetch(API, { method, headers: headers(), body: JSON.stringify(payload) });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(json.error ?? `${method} failed`);
    return json.data;
  };

  const save = async () => {
    if (!picked) return;
    setSaving(true);
    const payload = { business_id: picked.id, patch: draft as Record<string, unknown> };
    try {
      const updated = await request("PATCH", payload) as Business;
      setBusinesses((rows) => rows.map((row) => row.id === picked.id ? { ...row, ...updated } : row));
      setStatus("Saved live. The map/API will pick up the runtime overlay immediately.");
    } catch (caught) {
      if (!navigator.onLine) enqueue({ kind: "patch", payload });
      else setStatus(caught instanceof Error ? caught.message : "Save failed.");
    }
    setSaving(false);
  };

  const action = async (actionName: string, extra: Record<string, unknown> = {}) => {
    if (!picked) return;
    const payload = { action: actionName, business_id: picked.id, note: draft.notes, ...extra };
    try {
      const data = await request("POST", payload);
      if (actionName === "generate_claim_code") setCodes((rows) => [data as ClaimCode, ...rows]);
      if (actionName === "verify_in_person") setBusinesses((rows) => rows.map((row) => row.id === picked.id ? { ...row, ...(data as Business) } : row));
      setStatus(actionName === "welcome_email" ? "Welcome email event logged for follow-up." : "Action saved live.");
    } catch (caught) {
      if (!navigator.onLine) enqueue({ kind: "action", payload });
      else setStatus(caught instanceof Error ? caught.message : "Action failed.");
    }
  };

  const syncPending = async () => {
    const rows = [...pending].reverse();
    setStatus(`Syncing ${rows.length} pending write${rows.length === 1 ? "" : "s"}…`);
    const remaining: PendingWrite[] = [];
    for (const row of rows) {
      try { await request(row.kind === "patch" ? "PATCH" : "POST", row.payload); }
      catch { remaining.unshift(row); }
    }
    setPending(remaining);
    await load();
    setStatus(remaining.length ? `${remaining.length} write(s) still pending.` : "All pending writes synced.");
  };

  const currentCodes = picked ? codes.filter((code) => code.business_id === picked.id) : [];

  return (
    <main className={styles.shell}>
      <nav className={styles.rail}>
        <img className={styles.railLogo} src="/brand/stroll-mark.png" alt="Stroll City" />
        <Link className={styles.railBtn} title="Back to Calgary map" href="/calgary"><IconExplore /></Link>
        <Link className={styles.railBtn} title="Business portal" href="/portal"><CatIcon d="M5 11h14v9H5zm3.5 0V8a3.5 3.5 0 0 1 7 0v3" /></Link>
      </nav>

      <div className={styles.portalMain}>
        <section className={styles.formCol}>
          <div className={styles.fHead}>
            <div className={styles.claimEyebrow}><span className={styles.testBadge}>Staff</span><span>9 Ave tablet admin · V3</span></div>
            <h1 className={styles.claimTitle}>Admin walk desk for Inglewood onboarding.</h1>
            <p className={styles.claimSub}>Search, edit live records, verify in person, generate handwritten claim codes, and queue notes for the BIA evidence log. Writes are queued locally when signal drops.</p>
            <div className={styles.grid2} style={{ marginTop: 18 }}>
              <div className={styles.claimField}><label>Staff token</label><div className={styles.ctl}><input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Bearer token; blank uses local preview in dev" /></div></div>
              <div className={styles.claimField}><label>Actor</label><div className={styles.ctl}><input value={actor} onChange={(e) => setActor(e.target.value)} /></div></div>
            </div>
          </div>

          <div className={styles.fBody}>
            <div className={styles.pane}>
              <div className={styles.grid2}>
                <div className={styles.claimField}><label>Search name / address / category</label><div className={styles.ctl}><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Recordland or 9 Ave SE" /></div></div>
                <div style={{ display: "flex", alignItems: "end", gap: 10 }}>
                  <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={load}>Load / refresh</button>
                  <button className={`${styles.btn} ${styles.btnGhost}`} disabled={!pending.length} onClick={syncPending}>Sync pending ({pending.length})</button>
                </div>
              </div>

              <div className={styles.grid2} style={{ alignItems: "start" }}>
                <div className={styles.review} style={{ maxHeight: 480, overflow: "auto" }}>
                  {visible.map((business) => (
                    <button key={business.id} className={styles.res} style={{ borderRadius: 0, background: picked?.id === business.id ? "var(--mint)" : undefined }} onClick={() => choose(business)}>
                      <span className={styles.resTile}>{business.mono}</span>
                      <span className={styles.resBody}><span className={styles.resName}>{business.name}</span><span className={styles.resMeta}>{business.address} · {CAT_LABEL[business.category]} · {business.claim_status ?? "unclaimed"}</span></span>
                      {business.verified_by_staff && <span className={styles.resTaken}>verified</span>}
                    </button>
                  ))}
                </div>

                <div className={styles.pane}>
                  {!picked ? <p className={styles.paneHint}>Choose a business to edit.</p> : (
                    <>
                      <div className={styles.picked}><div className={styles.pickedHead}><span className={styles.pickedTile}>{picked.mono}</span><span className={styles.pickedBody}><span className={styles.pickedName}>{picked.name}</span><span className={styles.pickedMeta}>{picked.address}</span></span></div></div>
                      {EDITABLE.map((field) => <EditField key={String(field.key)} field={field} value={draft[field.key]} setDraft={setDraft} />)}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.fFoot}>
            <span className={styles.prog}>{status}</span><span className={styles.spacer} />
            {picked && <>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => action("welcome_email", { email: draft.website ? undefined : "manual follow-up" })}>Log welcome email</button>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => action("generate_claim_code")}>Generate claim code</button>
              <button className={`${styles.btn} ${styles.btnLine}`} onClick={() => action("verify_in_person")}>Verified in person</button>
              <button className={`${styles.btn} ${styles.btnPrimary}`} disabled={saving} onClick={save}>{saving ? "Saving…" : "Save live"}</button>
            </>}
          </div>
        </section>

        <aside className={styles.aside}>
          <div className={styles.pcard}>
            <div className={styles.pcardHead}><h3>Status chips</h3><span className={styles.lbl}>Selected</span></div>
            <div className={styles.prevBody}>{picked ? <>
              <div className={styles.prevTitle}>{picked.name}</div>
              <div className={styles.prevSub}><span className={styles.pill}>{picked.claim_status ?? "unclaimed"}</span><span className={styles.pill}>{picked.plan_tier ?? "free"}</span><span className={styles.pill}>{picked.offers_finisher_item ? "finisher item" : "no finisher"}</span><span className={styles.pill}>{picked.last_verified_at ? `verified ${picked.last_verified_at.slice(0, 10)}` : "not verified"}</span></div>
              <div className={styles.locked}>
                <LockRow on={Boolean(picked.verified_by_staff)} text="Verified in person" />
                <LockRow on={Boolean(picked.offers_finisher_item)} text="Has finisher item" />
                <LockRow on={Boolean(picked.donates_to_basket)} text="Basket donor" />
                <LockRow on={currentCodes.some((code) => !code.used_at)} text="Active claim code" />
              </div>
              {currentCodes.length > 0 && <div className={styles.review}>{currentCodes.map((code) => <div className={styles.revRow} key={code.id}><span className={styles.revKey}>Claim code</span><span className={styles.revVal}><b>{code.code}</b><br /><span className={styles.revSub}>Expires {code.expires_at.slice(0, 10)}</span></span></div>)}</div>}
            </> : <div className={styles.emptyPrev}>Pick a business to see claim status and generated codes.</div>}</div>
          </div>
          <div className={styles.helpCard}><b>Offline tolerance</b> If 9 Ave signal drops, edits are stored in this browser&apos;s local queue. Keep the tab open and tap Sync pending when service returns.</div>
        </aside>
      </div>
    </main>
  );
}

function EditField({ field, value, setDraft }: { field: { key: keyof Business; label: string; type?: "textarea" | "select" | "checkbox" | "number" }; value: unknown; setDraft: React.Dispatch<React.SetStateAction<Partial<Business>>> }) {
  const set = (next: unknown) => setDraft((draft) => ({ ...draft, [field.key]: next }));
  if (field.type === "checkbox") return <label className={styles.lockRow}><input type="checkbox" checked={Boolean(value)} onChange={(e) => set(e.target.checked)} /> {field.label}</label>;
  if (field.type === "textarea") return <div className={styles.claimField}><label>{field.label}</label><textarea className={styles.ctl} value={String(value ?? "")} onChange={(e) => set(e.target.value)} /></div>;
  if (field.type === "select") return <div className={styles.claimField}><label>{field.label}</label><div className={styles.ctl}><select value={String(value ?? "shop")} onChange={(e) => set(e.target.value)}>{cats.map((cat) => <option key={cat} value={cat}>{CAT_LABEL[cat]}</option>)}</select></div></div>;
  return <div className={styles.claimField}><label>{field.label}</label><div className={styles.ctl}><input type={field.type === "number" ? "number" : "text"} value={String(value ?? "")} onChange={(e) => set(field.type === "number" ? Number(e.target.value) : e.target.value)} /></div></div>;
}

function LockRow({ on, text }: { on: boolean; text: string }) {
  return <div className={`${styles.lockRow} ${on ? styles.lockRowOn : ""}`}><span className={styles.lockIc}>{on ? <CatIcon d="m5 13 4.5 4.5L19 7" size={12} strokeWidth={2.2} /> : <CatIcon d="M5 11h14v9H5zm3.5 0V8a3.5 3.5 0 0 1 7 0v3" size={11} strokeWidth={2} />}</span>{text}</div>;
}
