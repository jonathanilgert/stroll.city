import { notFound } from "next/navigation";
import { getHuntSession, hydrateHuntSession, loadCityData } from "../../../api/v1/_lib/data";
import { getCity } from "../../../cities";
import HuntGame, { type GameSession, type StopPoint } from "./HuntGame";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }) {
  const { city: slug } = await params;
  const city = getCity(slug);
  if (!city) return {};
  return { title: `Hunt in ${city.name} — stroll.city`, robots: { index: false, follow: false } };
}

/* Roughly a block. Enough to walk to, nowhere near enough to pick the door. */
const AREA_RADIUS_M = 130;

/* Unsolved stops are coarsened to a ~110m grid before they leave the server, so the
   payload cannot be read to find the exact address the riddle is about. */
function coarsen(value: number) {
  return Math.round(value * 1000) / 1000;
}

export default async function HuntSessionPage({ params }: { params: Promise<{ city: string; session: string }> }) {
  const { city: slug, session: sessionId } = await params;
  const city = getCity(slug);
  if (!city) notFound();
  const data = await loadCityData(slug);
  if (!data) notFound();
  const stored = await getHuntSession(slug, sessionId);
  if (!stored) notFound();

  /* hydrateHuntSession masks unsolved stops; the reveal: true copy stays server-side
     and is only used to work out where to point the map. */
  const session = hydrateHuntSession(stored, data) as unknown as GameSession;
  const full = hydrateHuntSession(stored, data, { reveal: true });
  const byId = new Map(data.businesses.map((business) => [business.id, business]));

  /* Some stops are real doors the licence register has not caught up with; they
     carry their own coordinates, so fall back to those rather than dropping them
     off the map. */
  const stopById = new Map((data.huntStops ?? []).map((row) => [row.id, row]));
  const points: StopPoint[] = full.stops.map((stop) => {
    const content = stopById.get(stop.stop_id);
    const business = stop.business_id ? byId.get(stop.business_id) : undefined;
    const lon = business?.lon ?? content?.lon;
    const lat = business?.lat ?? content?.lat;
    const address = business?.address ?? content?.address ?? null;
    if (typeof lon !== "number" || typeof lat !== "number") {
      return { stop_id: stop.stop_id, exact: null, area: null, street: null };
    }
    const solved = stop.state === "solved";
    return {
      stop_id: stop.stop_id,
      exact: solved ? { lon, lat } : null,
      /* Before it is solved the map gets a search area, not a pin. */
      area: solved ? null : { lon: coarsen(lon), lat: coarsen(lat), radius: AREA_RADIUS_M },
      street: address ? address.replace(/^\s*(?:#|unit|suite|ste\.?|bay)\s*[\w-]+\s*,?\s*/i, "").replace(/^\s*\d+[A-Za-z]?\s+(?=\S)/, "").replace(/\bAv\b/gi, "Ave").replace(/\b(SE|SW|NE|NW)\b/gi, (m) => m.toUpperCase()) : null,
    };
  });

  return <HuntGame citySlug={slug} center={data.center} session={session} points={points} />;
}
