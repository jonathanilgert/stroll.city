import { notFound } from "next/navigation";
import data from "../../../../../public/data/stroll-data.json";
import { getCity } from "../../../cities";
import HuntOnboarding, { type OnboardingHunt } from "./HuntOnboarding";

export function generateStaticParams() {
  return [{ city: "calgary" }];
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }) {
  const { city: slug } = await params;
  const city = getCity(slug);
  if (!city) return {};
  return {
    title: `Start a hunt in ${city.name} — stroll.city`,
    description: `Pick a hunt, name your team, and walk ${city.name}.`,
  };
}

export default async function HuntStartPage({
  params, searchParams,
}: {
  params: Promise<{ city: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { city: slug } = await params;
  const { type } = await searchParams;
  const city = getCity(slug);
  if (!city || slug !== "calgary") notFound();

  /* Only the shape of each hunt is sent to the browser — never the stops. The
     route preview draws a line and numbered dots; naming them here would hand
     over every answer before the walk starts. */
  const hunts: OnboardingHunt[] = ((data.hunts as Array<Record<string, unknown>> | undefined) ?? [])
    .filter((hunt) => hunt.status === "live")
    .map((hunt) => ({
      slug: String(hunt.slug),
      name: String(hunt.name),
      blurb: String(hunt.blurb ?? ""),
      mode: String(hunt.mode) as OnboardingHunt["mode"],
      audience: String(hunt.audience ?? "family") as OnboardingHunt["audience"],
      difficulty: String(hunt.difficulty ?? "easy"),
      est_minutes: Number(hunt.est_minutes ?? 0),
      distance_m: Number(hunt.distance_m ?? 0),
      stop_count: Array.isArray(hunt.stop_ids) ? hunt.stop_ids.length : 0,
    }));

  return <HuntOnboarding citySlug={slug} hunts={hunts} initialType={type ?? null} />;
}
