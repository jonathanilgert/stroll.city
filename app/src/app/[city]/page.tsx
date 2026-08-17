import { notFound } from "next/navigation";
import { cities, getCity } from "../cities";
import StrollCityApp from "../StrollCityApp";

export function generateStaticParams() {
  return cities.map((city) => ({ city: city.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }) {
  const { city: slug } = await params;
  const city = getCity(slug);
  if (!city) return {};
  return {
    title: `Stroll ${city.name} — stroll.city`,
    description: `${city.name} local discovery map for stroll.city — real Inglewood storefronts, filters, events and scavenger hunts.`,
    openGraph: { title: `Stroll ${city.name} — stroll.city`, description: `${city.name} local discovery map for walkable shopping streets.`, images: ["/brand/stroll-logo.png"] },
  };
}

export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: slug } = await params;
  const city = getCity(slug);
  if (!city) notFound();
  return <StrollCityApp city={city} />;
}
