"use client";

import maplibregl from "maplibre-gl";
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Compass, Crosshair, X } from "lucide-react";
import { getCity } from "../../../cities";
import { categoryColor, CAT_LABEL, type Category } from "../../../StrollCityApp";
import styles from "../hunt.module.css";
import type { Door, Landmarks } from "./HuntGame";

/* The small map on the hunt screen is for glancing at. This is the one you look
   properly at: the whole street, doors in their category colours, and a tap on any
   of them offering directions or an answer.

   The doors still carry no names. Colour says what kind of place it is — which the
   riddle usually implies anyway — but which door it is remains the thing you have
   to work out. */
export default function HuntMapSheet({
  citySlug, center, landmarks, here, target, exact, solvedName, canAnswer, busy, onAnswer, onClose,
}: {
  citySlug: string;
  center: [number, number];
  landmarks?: Landmarks;
  here: { lon: number; lat: number; accuracy: number } | null;
  target: { lon: number; lat: number } | null;
  exact: { lon: number; lat: number } | null;
  solvedName: string;
  canAnswer: boolean;
  busy: boolean;
  onAnswer: (door: [number, number]) => void;
  onClose: () => void;
}) {
  const city = getCity(citySlug);
  const node = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const [picked, setPicked] = useState<Door | null>(null);
  const [leg, setLeg] = useState<{ distance_m: number; minutes: number } | null>(null);
  const [routing, setRouting] = useState(false);

  useEffect(() => {
    if (!node.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: node.current,
      style: "https://tiles.openfreemap.org/styles/positron",
      center: exact ?? target ?? { lon: center[0], lat: center[1] },
      zoom: 15.6,
      attributionControl: false,
    });
    mapRef.current = map;

    map.on("load", () => {
      map.addSource("sheet-route", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: "sheet-route",
        type: "line",
        source: "sheet-route",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#0B47E8", "line-width": 5, "line-opacity": 0.9 },
      });

      /* Nearest door to the tap, same arithmetic as the small map — a dot is still
         smaller than a fingertip even at this size. */
      map.on("click", (event) => {
        let nearest: { door: Door; distance: number } | null = null;
        for (const door of landmarks?.doors ?? []) {
          const at = map.project([door.lon, door.lat]);
          const distance = Math.hypot(at.x - event.point.x, at.y - event.point.y);
          if (distance <= 24 && (!nearest || distance < nearest.distance)) nearest = { door, distance };
        }
        setPicked(nearest?.door ?? null);
        setLeg(null);
      });
    });

    return () => { map.remove(); mapRef.current = null; };
  }, [center, exact, landmarks, target]);

  /* Doors as their own markers here so each can carry its category colour. */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !city) return;
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    (landmarks?.doors ?? []).forEach((door) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = styles.sheetDoor;
      el.style.background = categoryColor(city, door.category as Category);
      el.setAttribute("aria-label", `A ${CAT_LABEL[door.category as Category] ?? "place"} on this street`);
      if (picked && picked.lon === door.lon && picked.lat === door.lat) el.classList.add(styles.sheetDoorOn);
      el.addEventListener("click", (event) => { event.stopPropagation(); setPicked(door); setLeg(null); });
      markers.current.push(new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat([door.lon, door.lat]).addTo(map));
    });

    (landmarks?.places ?? []).forEach((place) => {
      const el = document.createElement("span");
      el.className = styles.landmark;
      const dot = document.createElement("span");
      dot.className = styles.landmarkDot;
      const label = document.createElement("span");
      label.className = styles.landmarkName;
      label.textContent = place.name;
      el.append(dot, label);
      markers.current.push(new maplibregl.Marker({ element: el, anchor: "left" }).setLngLat([place.lon, place.lat]).addTo(map));
    });

    if (here) {
      const el = document.createElement("span");
      el.className = here.accuracy > 400 ? `${styles.hereDot} ${styles.hereDotVague}` : styles.hereDot;
      markers.current.push(new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat([here.lon, here.lat]).addTo(map));
    }

    if (exact) {
      const wrap = document.createElement("span");
      wrap.className = styles.stopPinWrap;
      const dot = document.createElement("span");
      dot.className = styles.stopPin;
      dot.style.background = "#14161A";
      dot.textContent = "★";
      wrap.appendChild(dot);
      if (solvedName) {
        const tag = document.createElement("span");
        tag.className = styles.stopPinLabel;
        tag.textContent = solvedName;
        wrap.appendChild(tag);
      }
      markers.current.push(new maplibregl.Marker({ element: wrap, anchor: "center" }).setLngLat([exact.lon, exact.lat]).addTo(map));
    }
  }, [city, landmarks, picked, here, exact, solvedName]);

  const showDirections = useCallback(async () => {
    const map = mapRef.current;
    if (!map || !picked) return;
    if (!here) { setLeg(null); return; }
    setRouting(true);
    try {
      const payload = await fetch(
        `/api/v1/${citySlug}/route?from=${here.lon},${here.lat}&to=${picked.lon},${picked.lat}`,
        { cache: "no-store" },
      ).then((response) => response.json()).catch(() => null);
      if (!payload?.ok) return;
      const source = map.getSource("sheet-route") as maplibregl.GeoJSONSource | undefined;
      source?.setData({
        type: "FeatureCollection",
        features: [{ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: payload.data.coordinates } }],
      });
      setLeg({ distance_m: payload.data.distance_m, minutes: payload.data.minutes });
      const bounds = new maplibregl.LngLatBounds();
      payload.data.coordinates.forEach((coord: [number, number]) => bounds.extend(coord));
      map.fitBounds(bounds, { padding: { top: 80, bottom: 200, left: 50, right: 50 }, maxZoom: 17, duration: 600 });
    } finally {
      setRouting(false);
    }
  }, [citySlug, here, picked]);

  const recentre = () => {
    const map = mapRef.current;
    if (!map) return;
    const bounds = new maplibregl.LngLatBounds();
    if (here) bounds.extend([here.lon, here.lat]);
    if (target) bounds.extend([target.lon, target.lat]);
    if (bounds.isEmpty()) map.easeTo({ center, zoom: 15.6 });
    else map.fitBounds(bounds, { padding: { top: 80, bottom: 200, left: 50, right: 50 }, maxZoom: 16.8, duration: 600 });
  };

  const pickedLabel = picked ? CAT_LABEL[picked.category as Category] ?? "A place on this street" : "";

  return (
    /* A layer over the hunt, not a new page: the screen behind stays visible at the
       edges, and tapping it closes. */
    <div className={styles.mapScrim} onClick={onClose}>
    <div
      className={styles.mapSheet}
      role="dialog"
      aria-modal="true"
      aria-label="Map of the street"
      onClick={(event) => event.stopPropagation()}
    >
      <div ref={node} className={styles.mapSheetCanvas} />

      <button className={styles.mapSheetClose} onClick={onClose} aria-label="Close the map">
        <X size={18} />
      </button>
      <button className={styles.mapSheetRecentre} onClick={recentre} aria-label="Recentre">
        <Crosshair size={17} />
      </button>

      {picked && (
        <div className={styles.mapSheetCard}>
          <div className={styles.mapSheetCardTop}>
            <span className={styles.mapSheetSwatch} style={{ background: city ? categoryColor(city, picked.category as Category) : "#55585F" }} />
            <span className={styles.mapSheetCardText}>
              <strong>{pickedLabel}</strong>
              <span>
                {leg
                  ? `${leg.distance_m < 1000 ? `${Math.round(leg.distance_m / 10) * 10} m` : `${(leg.distance_m / 1000).toFixed(1)} km`} · ${leg.minutes} min walk`
                  : here ? "Tap directions to route here" : "Turn on location for directions"}
              </span>
            </span>
          </div>
          <div className={styles.mapSheetActions}>
            <button className={styles.mapSheetGhost} onClick={() => void showDirections()} disabled={!here || routing}>
              <Compass size={15} />{routing ? "Routing…" : "Directions"}
            </button>
            <button
              className={styles.mapSheetPrimary}
              onClick={() => onAnswer([picked.lon, picked.lat])}
              disabled={!canAnswer || busy}
            >
              <Check size={15} />Make this the answer
            </button>
          </div>
          {!canAnswer && <span className={styles.mapSheetNote}>This stop is already solved.</span>}
        </div>
      )}
    </div>
    </div>
  );
}
