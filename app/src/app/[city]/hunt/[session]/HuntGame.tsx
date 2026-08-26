"use client";

import Link from "next/link";
import maplibregl from "maplibre-gl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Camera, Check, ChevronLeft, ChevronRight, Clock, Info, Lightbulb, Sparkles } from "lucide-react";
import styles from "../hunt.module.css";

export type GameStop = {
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
};

export type GameSession = {
  id: string;
  hunt_name: string;
  mode: "friendly" | "full" | "race";
  team_name: string;
  group_id: string | null;
  status: "active" | "finished";
  started_at: string;
  elapsed_seconds: number;
  penalty_seconds: number;
  solved_count: number;
  photo_count: number;
  total_stops: number;
  stops: GameStop[];
};

export type StopPoint = {
  stop_id: string;
  exact: { lon: number; lat: number } | null;
  area: { lon: number; lat: number; radius: number } | null;
  street: string | null;
};

/* Each stop carries its own tint, cycling through the brand accents like the design. */
const TINTS = [
  { pin: "#0B47E8", bg: "#E9EFFF", border: "#CBD9FF", ink: "#0B47E8" },
  { pin: "#A3376A", bg: "#FDEDF3", border: "#F7DBE5", ink: "#A3376A" },
  { pin: "#3D6B2A", bg: "#EDF5E9", border: "#D8E8D0", ink: "#3D6B2A" },
  { pin: "#8A6410", bg: "#FDF6E4", border: "#F5E7C0", ink: "#8A6410" },
];

const MODE_LABEL: Record<GameSession["mode"], string> = {
  friendly: "Friendly Mode",
  full: "Full Hunt",
  race: "Loop Race",
};

function formatClock(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  return h ? `${h}h ${String(m).padStart(2, "0")}m` : `${m} min`;
}

function metresBetween(a: { lon: number; lat: number }, b: { lon: number; lat: number }) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

function compassFrom(a: { lon: number; lat: number }, b: { lon: number; lat: number }) {
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const deg = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  return ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"][Math.round(deg / 45) % 8];
}

/* A ring of points around a centre — the search area, drawn as a real polygon so it
   scales with the map instead of being a fixed-size dot. */
function circlePolygon(centre: { lon: number; lat: number }, radiusM: number) {
  const points: [number, number][] = [];
  const latR = radiusM / 111320;
  const lonR = radiusM / (111320 * Math.cos((centre.lat * Math.PI) / 180));
  for (let i = 0; i <= 48; i += 1) {
    const angle = (i / 48) * Math.PI * 2;
    points.push([centre.lon + lonR * Math.cos(angle), centre.lat + latR * Math.sin(angle)]);
  }
  return points;
}

export default function HuntGame({
  citySlug, center, session: initial, points,
}: {
  citySlug: string;
  center: [number, number];
  session: GameSession;
  points: StopPoint[];
}) {
  const [session, setSession] = useState(initial);
  const [viewing, setViewing] = useState<number | null>(null);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [here, setHere] = useState<{ lon: number; lat: number } | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [guess, setGuess] = useState("");
  const [verdict, setVerdict] = useState<"idle" | "wrong" | "right">("idle");
  const [now, setNow] = useState(() => Date.now());

  const mapNode = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const hereMarker = useRef<maplibregl.Marker | null>(null);
  const stopMarker = useRef<maplibregl.Marker | null>(null);

  const pointsById = useMemo(() => new Map(points.map((point) => [point.stop_id, point])), [points]);
  const done = session.status === "finished";
  /* A stop is done when it is both answered and photographed. Tracking "not solved"
     here would move the cursor the moment the riddle was answered, skipping straight
     to the next one and letting the photo — the proof you were there — go unasked. */
  const currentIndex = session.stops.findIndex((stop) => stop.state !== "solved" || !stop.photo_url);
  const cursor = currentIndex === -1 ? session.total_stops - 1 : currentIndex;
  const viewIndex = Math.min(viewing ?? cursor, session.total_stops - 1);
  const stop = session.stops[viewIndex];
  const point = stop ? pointsById.get(stop.stop_id) : undefined;
  const tint = TINTS[viewIndex % TINTS.length];
  /* You are "on" a stop if it is the furthest one you have reached — browsing back
     through finished stops must not offer the camera again as if it were live. */
  const isCurrent = viewIndex >= cursor && !done;
  const hasPhoto = Boolean(stop?.photo_url);
  const isRevealed = Boolean(stop && (revealed[stop.stop_id] || stop.state === "solved"));

  useEffect(() => {
    if (done) return;
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, [done]);
  const elapsed = Math.floor((now - new Date(session.started_at).getTime()) / 1000);

  /* Live location. Denied is a normal answer, not an error state: the hunt works
     without it, you just lose the arrow and the distance. */
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      /* Deferred rather than set inline: a synchronous setState in an effect body
         cascades a second render before the first has painted. */
      const timer = window.setTimeout(() => setLocationDenied(true), 0);
      return () => window.clearTimeout(timer);
    }
    const watch = navigator.geolocation.watchPosition(
      (position) => {
        setHere({ lon: position.coords.longitude, lat: position.coords.latitude });
        setLocationDenied(false);
      },
      () => setLocationDenied(true),
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, []);

  const target = point?.exact ?? point?.area ?? null;
  const distance = here && target ? metresBetween(here, target) : null;
  const heading = here && target ? compassFrom(here, target) : null;

  const post = useCallback(async (body: Record<string, unknown>) => {
    if (!stop) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/v1/${citySlug}/sessions/${session.id}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stop_id: stop.stop_id, elapsed_seconds: elapsed, ...body }),
      });
      const payload = await response.json().catch(() => null) as { ok?: boolean; data?: GameSession; error?: string } | null;
      if (!response.ok || !payload?.ok || !payload.data) {
        setError(payload?.error ?? "That didn't save. Please try again.");
        return;
      }
      setSession(payload.data);
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }, [citySlug, elapsed, session.id, stop]);

  const uploadPhoto = async (file: File | undefined) => {
    if (!stop || !file) return;
    if (!file.type.startsWith("image/")) { setError("Please choose a photo file."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("Please choose a photo under 10MB."); return; }
    const form = new FormData();
    form.append("photo", file);
    form.append("stop_id", stop.stop_id);
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
      const fresh = await fetch(`/api/v1/${citySlug}/sessions/${session.id}`).then((r) => r.json()).catch(() => null);
      if (fresh?.ok && fresh.data) {
        setSession(fresh.data);
        /* The stop is complete now, but moving on is the player's call — that is what
           the button at the bottom is for. */
        setViewing(viewIndex);
      }
    } finally {
      setBusy(false);
    }
  };

  /* Changing which stop you are looking at clears the guess box — done here rather
     than in an effect, which would cascade a second render on every move. */
  const showStop = (index: number) => {
    setViewing(index);
    setGuess("");
    setVerdict("idle");
  };

  const submitGuess = async () => {
    if (!stop || !guess.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/v1/${citySlug}/sessions/${session.id}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stop_id: stop.stop_id, guess: guess.trim() }),
      });
      const payload = await response.json().catch(() => null) as
        { ok?: boolean; data?: { correct?: boolean; session?: GameSession }; error?: string } | null;
      if (!response.ok || !payload?.ok || !payload.data?.session) {
        setError(payload?.error ?? "Could not check that. Please try again.");
        return;
      }
      setSession(payload.data.session);
      setVerdict(payload.data.correct ? "right" : "wrong");
      if (payload.data.correct) {
        setGuess("");
        /* Stay on this stop: solving it is only half of it, the photo is the rest. */
        setViewing(viewIndex);
      }
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const takeClue = () => post({ action: "clue_revealed", clues_used: (stop?.clues_used ?? 0) + 1 });

  /* The photo is the proof, so it is also what marks the stop solved. */
  const advance = async () => {
    if (done || !stop || !hasPhoto) return;
    if (stop.state !== "solved") await post({ action: "stop_solved" });
    /* Step forward by one. Handing the view back to "first incomplete" used to throw
       you backwards onto a stop you had already walked past. */
    setViewing(Math.min(viewIndex + 1, session.total_stops - 1));
    setGuess("");
    setVerdict("idle");
  };

  /* ---------------- map ---------------- */
  useEffect(() => {
    if (!mapNode.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: mapNode.current,
      style: {
        version: 8,
        sources: {
          carto: {
            type: "raster",
            tiles: ["a", "b", "c", "d"].map((s) => `https://${s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png`),
            tileSize: 256,
            /* CARTO serves "API key required" placeholders above z17. Cap the source so
               MapLibre overzooms clean z17 tiles instead of asking for branded ones. */
            maxzoom: 17,
            attribution: "© OpenStreetMap © CARTO",
          },
        },
        layers: [{ id: "carto", type: "raster", source: "carto" }],
      },
      center,
      zoom: 15.4,
      attributionControl: false,
    });
    mapRef.current = map;
    map.on("load", () => {
      map.addSource("area", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({ id: "area-fill", type: "fill", source: "area", paint: { "fill-color": "#0B47E8", "fill-opacity": 0.1 } });
      map.addLayer({ id: "area-line", type: "line", source: "area", paint: { "line-color": "#0B47E8", "line-width": 2, "line-dasharray": [2, 2], "line-opacity": 0.7 } });
      map.addSource("route", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({ id: "route-line", type: "line", source: "route", layout: { "line-cap": "round" }, paint: { "line-color": "#0B47E8", "line-width": 4, "line-dasharray": [1.6, 1.6], "line-opacity": 0.85 } });
    });
    return () => { map.remove(); mapRef.current = null; };
  }, [center]);

  const fitView = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const bounds = new maplibregl.LngLatBounds();
    if (here) bounds.extend([here.lon, here.lat]);
    if (target) bounds.extend([target.lon, target.lat]);
    if (bounds.isEmpty()) { map.easeTo({ center, zoom: 15.4 }); return; }
    map.fitBounds(bounds, { padding: { top: 70, bottom: 40, left: 50, right: 50 }, maxZoom: 16.6, duration: 600 });
  }, [center, here, target]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const paint = () => {
      const area = map.getSource("area") as maplibregl.GeoJSONSource | undefined;
      const route = map.getSource("route") as maplibregl.GeoJSONSource | undefined;
      if (!area || !route) return;
      area.setData({
        type: "FeatureCollection",
        features: point?.area
          ? [{ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [circlePolygon(point.area, point.area.radius)] } }]
          : [],
      });
      route.setData({
        type: "FeatureCollection",
        features: here && target
          ? [{ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [[here.lon, here.lat], [target.lon, target.lat]] } }]
          : [],
      });

      hereMarker.current?.remove();
      hereMarker.current = null;
      if (here) {
        const el = document.createElement("span");
        el.className = styles.hereDot;
        hereMarker.current = new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat([here.lon, here.lat]).addTo(map);
      }

      stopMarker.current?.remove();
      stopMarker.current = null;
      /* Only a solved stop gets a pin; an unsolved one is the dashed circle. */
      if (point?.exact) {
        const el = document.createElement("span");
        el.className = styles.stopPin;
        el.style.background = tint.pin;
        el.textContent = String(viewIndex + 1);
        stopMarker.current = new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat([point.exact.lon, point.exact.lat]).addTo(map);
      }
    };
    if (map.isStyleLoaded()) paint(); else map.once("idle", paint);
  }, [here, point, target, tint.pin, viewIndex]);

  useEffect(() => { fitView(); }, [viewIndex, fitView]);

  const walkNote = distance === null
    ? locationDenied ? "Turn on location for distance" : "Finding you…"
    : `${distance < 1000 ? `${Math.round(distance / 10) * 10} m` : `${(distance / 1000).toFixed(1)} km`} · ${Math.max(1, Math.round(distance / 80))} min walk`;

  const direction = done
    ? "Back where you started"
    : heading
      ? `Head ${heading}${point?.street ? ` on ${point.street}` : ""}`
      : point?.street
        ? `Somewhere on ${point.street}`
        : "Somewhere on the strip";

  if (!stop) return null;

  return (
    <main className={styles.app}>
      <div className={styles.screen}>
        <header className={styles.gameHead}>
          <div className={styles.gameHeadRow}>
            <Link className={styles.gameBack} href={session.group_id ? `/${citySlug}/hunt/group/${session.group_id}` : `/${citySlug}`} aria-label="Leave hunt">
              <ChevronLeft size={15} />
            </Link>
            <span className={styles.gameHeadText}>
              <span className={`${styles.gameKicker} ${styles.mono}`}>{MODE_LABEL[session.mode]}</span>
              <strong className={styles.gameHeadline}>
                {done ? "Hunt complete" : `Stop ${viewIndex + 1} of ${session.total_stops}`}
              </strong>
            </span>
            <span className={styles.gameClock}><Clock size={12} />{formatClock(elapsed + session.penalty_seconds)}</span>
          </div>
          <div className={styles.gamePunches} aria-hidden>
            {session.stops.map((row, i) => (
              <span
                key={row.stop_id}
                className={`${styles.gamePunch} ${row.state === "solved" ? styles.gamePunchOn : i === cursor && !done ? styles.gamePunchNow : ""}`}
              />
            ))}
          </div>
        </header>

        <div className={styles.gameMap}>
          <div ref={mapNode} className={styles.gameMapCanvas} />
          <div className={styles.gameDirection}>
            <span className={styles.gameDirectionIcon}><ChevronRight size={16} /></span>
            <span className={styles.gameDirectionText}>
              <span className={styles.gameDirectionMain}>{direction}</span>
              <span className={`${styles.gameDirectionNote} ${styles.mono}`}>{done ? "Every stop found" : walkNote}</span>
            </span>
            <button className={styles.gameRecentre} onClick={fitView}>Recentre</button>
          </div>
        </div>

        <div className={styles.scroll}>
          <div className={styles.gameBody}>
            <div className={styles.riddleCard} style={{ background: tint.bg, borderColor: tint.border }}>
              <div className={styles.riddleCardHead} style={{ borderColor: tint.border }}>
                <button
                  className={styles.riddleNav}
                  style={{ borderColor: tint.border }}
                  onClick={() => showStop(Math.max(0, viewIndex - 1))}
                  disabled={viewIndex === 0}
                  aria-label="Previous stop"
                >
                  <ChevronLeft size={13} />
                </button>
                <span className={`${styles.riddleKicker} ${styles.mono}`} style={{ color: tint.ink }}>
                  Stop {viewIndex + 1} · {stop.state === "solved" ? "Solved" : "Riddle"}
                </span>
                <button
                  className={styles.riddleNav}
                  style={{ borderColor: tint.border }}
                  onClick={() => showStop(Math.min(cursor, viewIndex + 1))}
                  disabled={viewIndex >= cursor}
                  aria-label="Next unlocked stop"
                >
                  <ChevronRight size={13} />
                </button>
              </div>
              <div className={styles.riddleCardBody}>
                <p className={styles.riddleText}>{stop.riddle}</p>
                {stop.clues.map((clue, i) => (
                  <span className={styles.riddleHintChip} style={{ borderColor: tint.border }} key={clue}>
                    <Info size={13} /><span><strong>Clue {i + 1}.</strong> {clue}</span>
                  </span>
                ))}
                {isRevealed && (
                  <span className={styles.riddleReveal} style={{ borderColor: tint.border }}>
                    <Sparkles size={14} />
                    <span>It&rsquo;s <strong>{stop.name || "the next door"}</strong> — the answer counts either way, so head over and take the photo.</span>
                  </span>
                )}
              </div>
              <span className={styles.riddleNotch} style={{ borderColor: tint.border }} aria-hidden />
            </div>

            {isCurrent && stop.state !== "solved" && (
              <div className={styles.solveSteps}>
                <div className={styles.solveStep} style={{ borderColor: tint.border }}>
                  <span className={styles.solveStepN}>1</span>
                  <div className={styles.solveStepBody}>
                    <strong className={styles.solveStepTitle}>Enter your answer</strong>
                    <div className={`${styles.answerField} ${verdict === "wrong" ? styles.answerFieldWrong : ""}`} style={verdict === "idle" ? { borderColor: tint.border } : undefined}>
                      <input
                        className={styles.answerInput}
                        value={guess}
                        onChange={(event) => { setGuess(event.target.value); if (verdict !== "idle") setVerdict("idle"); }}
                        onKeyDown={(event) => { if (event.key === "Enter") void submitGuess(); }}
                        placeholder="Type your answer"
                        maxLength={120}
                        aria-label="Your answer for this stop"
                        autoComplete="off"
                      />
                      <button className={styles.answerCheck} onClick={() => void submitGuess()} disabled={!guess.trim() || busy}>
                        Check your guess
                      </button>
                    </div>
                    {verdict === "wrong" && (
                      <span className={styles.answerWrong}>
                        Not this one. Walk a little further, or take a clue below.
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.solveStep} style={{ borderColor: tint.border }}>
                  <span className={styles.solveStepN}>2</span>
                  <div className={styles.solveStepBody}>
                    <strong className={styles.solveStepTitle}>Need a clue?</strong>
                    {stop.clues_used >= 3 ? (
                      <span className={styles.solveStepNote}>
                        All three clues are open. Still stuck? Use <em>Stuck?</em> below to see the answer — the stop still counts.
                      </span>
                    ) : (
                      <>
                        <button className={styles.clueBtn} onClick={() => void takeClue()} disabled={busy}>
                          Give me a clue <ArrowRight size={15} />
                        </button>
                        <span className={styles.solveStepNote}>
                          <Lightbulb size={12} />
                          {3 - stop.clues_used} left{session.mode === "race" ? ` · adds ${[2, 5, 10][stop.clues_used]} min` : ""}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {stop.state === "solved" && !hasPhoto && (
              <div className={styles.solvedBanner}>
                <span className={styles.solvedTick}><Check size={13} strokeWidth={3} /></span>
                <span>Solved — it&rsquo;s <strong>{stop.name}</strong>. Now the photo at the door.</span>
              </div>
            )}

            <div className={styles.photoBlock}>
              <div className={styles.photoHead}>
                <strong className={styles.photoTitle}>Photo at the door</strong>
                <span className={`${styles.photoState} ${styles.mono}`} data-state={hasPhoto ? "added" : isCurrent ? "required" : "locked"}>
                  {hasPhoto ? "Added" : isCurrent ? "Required" : "Locked"}
                </span>
              </div>
              <label className={`${styles.photoSlot} ${hasPhoto ? styles.photoSlotFilled : ""}`}>
                {stop.photo_url
                  /* eslint-disable-next-line @next/next/no-img-element -- runtime upload, not a build asset */
                  ? <img src={stop.photo_url} alt={`Your photo at stop ${viewIndex + 1}`} />
                  : <span className={styles.photoEmpty}><Camera size={26} /><span>{isCurrent ? "Take a photo at the door" : "Unlocks when you get here"}</span></span>}
                {hasPhoto && <span className={styles.photoBadge}><Check size={12} strokeWidth={3} />Photo added</span>}
                {(isCurrent || hasPhoto) && <input type="file" accept="image/*" capture="environment" onChange={(event) => void uploadPhoto(event.target.files?.[0])} disabled={busy} aria-label="Take a photo at the door" />}
              </label>
              {error && <span className={styles.errorNote}>{error}</span>}
              <div className={styles.photoActions}>
                <label className={`${styles.photoBtn} ${!isCurrent && !hasPhoto ? styles.photoBtnMuted : ""}`}>
                  <Camera size={15} />{hasPhoto ? "Retake photo" : "Take photo"}
                  {(isCurrent || hasPhoto) && <input type="file" accept="image/*" capture="environment" onChange={(event) => void uploadPhoto(event.target.files?.[0])} disabled={busy} />}
                </label>
                <button
                  className={`${styles.photoBtn} ${styles.stuckBtn} ${isRevealed && !hasPhoto ? styles.stuckOn : ""}`}
                  onClick={() => setRevealed((rows) => ({ ...rows, [stop.stop_id]: !rows[stop.stop_id] }))}
                  disabled={stop.state === "solved"}
                >
                  {isRevealed ? "Hide" : "Stuck?"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          {done ? (
            <Link className={styles.cta} href={`/api/v1/${citySlug}/sessions/${session.id}/postcard?format=svg`}>
              See your postcard <ChevronRight size={15} />
            </Link>
          ) : (
            <button className={styles.cta} onClick={() => void advance()} disabled={!hasPhoto || busy}>
              {hasPhoto
                ? viewIndex === session.total_stops - 1 ? "Finish the hunt" : "Unlock next riddle"
                : stop.state === "solved" ? "Photo at the door to continue" : "Answer the riddle to continue"}
              <ChevronRight size={15} />
            </button>
          )}
          <span className={styles.ctaNote}>
            {done
              ? `${session.total_stops} stops punched · postcard ready`
              : hasPhoto
                ? `${stop.name || `Stop ${viewIndex + 1}`} · photo added`
                : `Take a photo at the door to unlock stop ${Math.min(cursor + 2, session.total_stops)}`}
          </span>
        </div>
      </div>
    </main>
  );
}
