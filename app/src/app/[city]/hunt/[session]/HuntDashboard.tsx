"use client";

import Link from "next/link";
import maplibregl from "maplibre-gl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, ChevronLeft, ChevronRight, Eye, MapPin, Share2 } from "lucide-react";
import styles from "../../../page.module.css";

export type DashboardStop = {
  stop_id: string;
  index: number;
  state: "pending" | "solved" | "skipped";
  clues_used: number;
  clues: string[];
  name: string;
  riddle: string;
  challenge: string;
  difficulty: string;
  photo_url: string | null;
  business_id: string | null;
};

export type DashboardSession = {
  id: string;
  hunt_name: string;
  hunt_slug: string;
  mode: "friendly" | "full" | "race";
  team_name: string;
  status: "active" | "finished";
  started_at: string;
  elapsed_seconds: number;
  penalty_seconds: number;
  solved_count: number;
  photo_count: number;
  total_stops: number;
  stops: DashboardStop[];
};

export type StopPoint = { stop_id: string; lon: number | null; lat: number | null; address: string | null };

function formatClock(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

/* Stable per-session serial, so the same walk always prints the same number. */
function serialFor(id: string) {
  const hash = [...id].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) | 0, 7);
  return String(Math.abs(hash) % 1000).padStart(3, "0");
}

export default function HuntDashboard({
  citySlug, cityName, center, session: initial, points,
}: {
  citySlug: string;
  cityName: string;
  center: [number, number];
  session: DashboardSession;
  points: StopPoint[];
}) {
  const [session, setSession] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());

  const mapNode = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const pointsById = useMemo(() => new Map(points.map((point) => [point.stop_id, point])), [points]);
  const current = session.stops.find((stop) => stop.state !== "solved") ?? null;
  const finished = session.status === "finished";
  const isRace = session.mode === "race";

  useEffect(() => {
    if (finished) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [finished]);
  const elapsed = Math.floor((now - new Date(session.started_at).getTime()) / 1000);

  /* Every mutation returns the whole session, so the client never has to guess what
     the server decided — including whether that solve finished the walk. */
  const post = useCallback(async (url: string, init: RequestInit) => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(url, init);
      const payload = await response.json().catch(() => null) as { ok?: boolean; data?: DashboardSession; error?: string } | null;
      if (!response.ok || !payload?.ok || !payload.data) {
        setError(payload?.error ?? "That didn't save. Please try again.");
        return null;
      }
      setSession(payload.data);
      return payload.data;
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      return null;
    } finally {
      setBusy(false);
    }
  }, []);

  const revealClue = () => {
    if (!current) return;
    void post(`/api/v1/${citySlug}/sessions/${session.id}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stop_id: current.stop_id, action: "clue_revealed", clues_used: current.clues_used + 1, elapsed_seconds: elapsed }),
    });
  };

  const solveStop = () => {
    if (!current) return;
    void post(`/api/v1/${citySlug}/sessions/${session.id}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stop_id: current.stop_id, action: "stop_solved", elapsed_seconds: elapsed }),
    });
  };

  const uploadPhoto = async (file: File | undefined) => {
    if (!current || !file) return;
    if (!file.type.startsWith("image/")) { setError("Please choose a photo file."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("Please choose a photo under 10MB."); return; }
    const form = new FormData();
    form.append("photo", file);
    form.append("stop_id", current.stop_id);
    form.append("team_name", session.team_name);
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/v1/${citySlug}/sessions/${session.id}/photos`, { method: "POST", body: form });
      const payload = await response.json().catch(() => null) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !payload?.ok) {
        setError(payload?.error ?? "Photo upload did not finish. Please try again.");
        return;
      }
      /* The upload endpoint returns the photo, not the walk — read the session back
         so the punch card and postcard agree with what is on disk. */
      const fresh = await fetch(`/api/v1/${citySlug}/sessions/${session.id}`).then((r) => r.json()).catch(() => null);
      if (fresh?.ok && fresh.data) setSession(fresh.data);
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    const url = `${window.location.origin}/api/v1/${citySlug}/sessions/${session.id}/postcard?format=svg`;
    const text = `${session.team_name} is walking ${session.hunt_name} in ${cityName}. #StrollInglewood`;
    if (typeof navigator.share === "function") {
      await navigator.share({ title: "Stroll City postcard", text, url }).catch(() => undefined);
      return;
    }
    await navigator.clipboard?.writeText(`${text} ${url}`).catch(() => undefined);
  };

  /* ---------------- map: solved stops only ---------------- */
  useEffect(() => {
    if (!mapNode.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: mapNode.current,
      style: {
        version: 8,
        sources: {
          carto: {
            type: "raster",
            tiles: ["a", "b", "c", "d"].map((s) => `https://${s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png`),
            tileSize: 256,
            attribution: "© OpenStreetMap © CARTO",
          },
          cartoLabels: {
            type: "raster",
            tiles: ["a", "b", "c", "d"].map((s) => `https://${s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png`),
            tileSize: 256,
          },
        },
        layers: [
          { id: "carto", type: "raster", source: "carto" },
          { id: "cartoLabels", type: "raster", source: "cartoLabels", paint: { "raster-opacity": 0.7 } },
        ],
      },
      center,
      zoom: 14.4,
      attributionControl: false,
    });
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, [center]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
    /* Solved stops only: a pin on an unsolved stop would answer the riddle. */
    const solved = session.stops.filter((stop) => stop.state === "solved");
    const bounds = new maplibregl.LngLatBounds();
    solved.forEach((stop) => {
      const point = pointsById.get(stop.stop_id);
      if (!point?.lon || !point?.lat) return;
      const el = document.createElement("div");
      el.className = styles.hdPin;
      el.textContent = String(stop.index + 1);
      el.title = stop.name;
      markersRef.current.push(new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat([point.lon, point.lat]).addTo(map));
      bounds.extend([point.lon, point.lat]);
    });
    if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 70, maxZoom: 16, duration: 500 });
  }, [session.stops, pointsById]);

  const title = finished
    ? `${session.team_name} walked ${session.hunt_name}.`
    : session.photo_count === 0
      ? "Solve the first stop and the postcard starts filling in."
      : `Solve this stop and the ${["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth"][session.photo_count] ?? "next"} postcard mark fills in.`;

  return (
    <main className={styles.hdShell}>
      <header className={styles.hdHead}>
        <Link className={styles.hdBack} href={`/${citySlug}`} title="Back to the map"><ChevronLeft size={16} /></Link>
        <span className={styles.hdHeadText}>
          <span className={styles.hdHuntName}>{session.hunt_name}</span>
          <span className={styles.hdTeam}>{session.team_name} · {session.solved_count}/{session.total_stops} solved · {session.photo_count} photo{session.photo_count === 1 ? "" : "s"}</span>
        </span>
        <span className={styles.hdPips} aria-hidden>
          {session.stops.map((stop) => (
            <span
              key={stop.stop_id}
              className={`${styles.hdPip} ${stop.state === "solved" ? styles.hdPipOn : stop.stop_id === current?.stop_id ? styles.hdPipNow : ""}`}
            />
          ))}
        </span>
        {isRace && <span className={styles.hdClock}>{formatClock(elapsed + session.penalty_seconds)}</span>}
      </header>

      <div className={styles.hdBody}>
        <section className={styles.hdPanel}>
          {current ? (
            <>
              <span className={styles.hdStep}>Stop {current.index + 1} of {session.total_stops} · {current.difficulty}</span>
              <p className={styles.hdRiddle}>{current.riddle}</p>

              {current.clues.length > 0 && (
                <div className={styles.hdClues}>
                  {current.clues.map((clue, i) => (
                    <span className={styles.hdClue} key={clue}>
                      <span className={styles.hdClueN}>{i + 1}</span>
                      <span>{clue}</span>
                    </span>
                  ))}
                </div>
              )}

              {error && <p className={styles.hdError}>{error}</p>}

              <div className={styles.hdActions}>
                <button className={`${styles.btn} ${styles.btnGhost}`} onClick={revealClue} disabled={busy || current.clues_used >= 3}>
                  <Eye size={15} />
                  {current.clues_used >= 3 ? "No clues left" : `Reveal clue ${current.clues_used + 1}`}
                  {isRace && current.clues_used < 3 && <span className={styles.optional}>+{[2, 5, 10][current.clues_used]}m</span>}
                </button>
                <label className={`${styles.btn} ${styles.btnGhost} ${styles.hdUpload}`}>
                  <Camera size={15} />
                  {current.photo_url ? "Replace photo" : "Photo at the door"}
                  <input type="file" accept="image/*" capture="environment" onChange={(event) => void uploadPhoto(event.target.files?.[0])} disabled={busy} />
                </label>
                <button className={`${styles.btn} ${styles.huntCta}`} onClick={solveStop} disabled={busy}>
                  I found it <ChevronRight size={15} />
                </button>
              </div>
              <p className={styles.hdNote}>{current.challenge}</p>
            </>
          ) : (
            <>
              <span className={styles.hdStep}>Hunt complete</span>
              <p className={styles.hdRiddle}>Four doors, four photos. Your postcard is ready to send.</p>
              {error && <p className={styles.hdError}>{error}</p>}
              <div className={styles.hdActions}>
                <button className={`${styles.btn} ${styles.huntCta}`} onClick={share}><Share2 size={15} /> Share the postcard</button>
                <Link className={`${styles.btn} ${styles.btnGhost}`} href={`/${citySlug}`}>Back to the map</Link>
              </div>
            </>
          )}

          <div className={styles.hdStops}>
            {session.stops.map((stop) => {
              const solved = stop.state === "solved";
              return (
                <div
                  key={stop.stop_id}
                  className={`${styles.hdStopRow} ${solved ? styles.hdStopDone : ""}`}
                  aria-current={stop.stop_id === current?.stop_id}
                >
                  <span className={styles.hdStopN}>{stop.index + 1}</span>
                  {/* An unsolved stop never shows its name — that is the answer. */}
                  <span className={`${styles.hdStopName} ${solved ? "" : styles.hdStopHidden}`}>
                    {solved ? stop.name : stop.stop_id === current?.stop_id ? "Solving now" : "Still to come"}
                  </span>
                  {stop.photo_url && <MapPin size={13} color="var(--ink-3)" />}
                </div>
              );
            })}
          </div>
        </section>

        <section className={styles.hdCardWrap}>
          <div className={styles.pcard}>
            <div className={styles.pcardInner}>
              <span className={styles.pcardStamp} aria-hidden><MapPin size={14} /></span>
              <span className={styles.pcardSpine} aria-hidden />
              <span className={styles.pcardVert}>INGLEWOOD</span>
              <div className={styles.pcardTop}>
                <span>{finished ? "Postcard complete" : "Postcard in progress"}</span>
                <span className={styles.pcardSerial}>No. {serialFor(session.id)}</span>
              </div>
              <h1 className={styles.pcardTitle}>{title}</h1>
              <div className={styles.pcardSlots}>
                {session.stops.map((stop, i) => (
                  <figure className={`${styles.pcardSlot} ${stop.photo_url ? styles.pcardSlotFilled : ""}`} key={stop.stop_id}>
                    {stop.photo_url ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element -- runtime upload, not a build-time asset */}
                        <img src={stop.photo_url} alt={stop.name} />
                        <figcaption className={styles.pcardFound}>FOUND</figcaption>
                      </>
                    ) : (
                      <span className={styles.pcardSlotN}>{i + 1}</span>
                    )}
                  </figure>
                ))}
              </div>
              <p className={styles.pcardFoot}>
                {finished
                  ? "Every slot is filled. Share it, or keep it — the postcard stays at this link."
                  : "The next postcard photo slot fills in after this riddle is completed."}
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className={styles.hdMapRow}>
        <div className={styles.hdMap}>
          <div ref={mapNode} className={styles.hdMapCanvas} />
          <span className={styles.hdMapHint}>
            {session.solved_count === 0
              ? "Stops appear here as you find them"
              : `${session.solved_count} of ${session.total_stops} found`}
          </span>
        </div>
      </div>
    </main>
  );
}
