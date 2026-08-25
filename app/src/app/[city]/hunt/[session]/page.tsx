import { notFound } from "next/navigation";
import { getHuntSession, hydrateHuntSession, loadCityData } from "../../../api/v1/_lib/data";
import { getCity } from "../../../cities";
import HuntDashboard, { type DashboardSession, type StopPoint } from "./HuntDashboard";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }) {
  const { city: slug } = await params;
  const city = getCity(slug);
  if (!city) return {};
  return { title: `Hunt in ${city.name} — stroll.city`, robots: { index: false, follow: false } };
}

export default async function HuntSessionPage({ params }: { params: Promise<{ city: string; session: string }> }) {
  const { city: slug, session: sessionId } = await params;
  const city = getCity(slug);
  if (!city) notFound();
  const data = await loadCityData(slug);
  if (!data) notFound();
  const stored = await getHuntSession(slug, sessionId);
  if (!stored) notFound();

  /* hydrateHuntSession masks unsolved stops; reveal: true is only used server-side
     below to look up coordinates, which are then filtered to the solved ones. */
  const session = hydrateHuntSession(stored, data) as unknown as DashboardSession;
  const full = hydrateHuntSession(stored, data, { reveal: true });

  const byId = new Map(data.businesses.map((business) => [business.id, business]));
  const points: StopPoint[] = full.stops
    .filter((stop) => stop.state === "solved")
    .map((stop) => {
      const business = stop.business_id ? byId.get(stop.business_id) : undefined;
      return {
        stop_id: stop.stop_id,
        lon: business?.lon ?? null,
        lat: business?.lat ?? null,
        address: business?.address ?? null,
      };
    });

  return <HuntDashboard citySlug={slug} cityName={city.name} center={data.center} session={session} points={points} />;
}
