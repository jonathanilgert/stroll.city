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
  const businessById = new Map((data.businesses as Array<{ id: string; lon: number; lat: number; address?: string; mono?: string; category?: string }> | undefined ?? []).map((business) => [business.id, business]));
  const stopsById = new Map((data.huntStops as HuntStopLite[] | undefined ?? []).map((stop) => {
    const business = businessById.get(stop.business_id);
    return [stop.id, { ...stop, lon: business?.lon, lat: business?.lat, address: business?.address, mono: business?.mono, category: business?.category }];
  }));
  const hunts = ((data.hunts as Hunt[] | undefined) ?? []).filter((hunt) => hunt.status === "live");
  const stops = hunts.flatMap((hunt) => hunt.stop_ids.map((id) => stopsById.get(id)).filter(Boolean) as HuntStopLite[]);
  return <HuntApp cityName={city.name} hunts={hunts} stops={stops} />;
}
