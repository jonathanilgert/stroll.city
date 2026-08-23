import { notFound } from "next/navigation";
import data from "../../../../public/data/stroll-data.json";
import { cities, getCity } from "../../cities";
import HuntApp, { type Hunt, type HuntStopLite } from "./HuntApp";

export function generateStaticParams() {
  return cities.map((city) => ({ city: city.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }) {
  const { city: slug } = await params;
  const city = getCity(slug);
  if (!city) return {};
  return { title: `Stroll ${city.name} hunt — stroll.city`, description: `Scavenger hunts for ${city.name} on stroll.city.` };
}

export default async function HuntPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: slug } = await params;
  const city = getCity(slug);
  if (!city || slug !== "calgary") notFound();
  const stopsById = new Map((data.huntStops as HuntStopLite[] | undefined ?? []).map((stop) => [stop.id, stop]));
  const hunts = ((data.hunts as Hunt[] | undefined) ?? []).filter((hunt) => hunt.status === "live");
  const stops = hunts.flatMap((hunt) => hunt.stop_ids.map((id) => stopsById.get(id)).filter(Boolean) as HuntStopLite[]);
  return <HuntApp cityName={city.name} hunts={hunts} stops={stops} />;
}
