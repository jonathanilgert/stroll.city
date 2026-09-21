import fs from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import data from "../../../../../public/data/stroll-data.json";
import { getCity } from "../../../cities";
import { HUNT_THEMES } from "../../../hunt-themes";
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

/* A photograph wins if one is there. Drop a wide shot of the strip at
   public/brand/inglewood-hero.jpg (or .webp) and the cover uses it; otherwise the
   drawn streetscape stands in. No business photo is used — every one of them is a
   hunt stop, and the cover would be handing out answers. */
function findHeroPhoto() {
  const dir = path.join(process.cwd(), "public", "brand");
  for (const name of ["inglewood-hero.jpg", "inglewood-hero.jpeg", "inglewood-hero.webp", "inglewood-hero.png"]) {
    if (fs.existsSync(path.join(dir, name))) return `/brand/${name}`;
  }
  return null;
}

export default async function HuntStartPage({
  params, searchParams,
}: {
  params: Promise<{ city: string }>;
  searchParams: Promise<{ type?: string; theme?: string }>;
}) {
  const { city: slug } = await params;
  const { type, theme } = await searchParams;
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

  /* A mood can arrive in the link (the landing page's occasion cards do this).
     Validate it here — an unknown id should open the picker, not preselect junk. */
  const initialTheme = HUNT_THEMES.some((item) => item.id === theme) ? theme! : null;

  return <HuntOnboarding citySlug={slug} hunts={hunts} initialType={type ?? null} initialTheme={initialTheme} heroPhoto={findHeroPhoto()} />;
}
