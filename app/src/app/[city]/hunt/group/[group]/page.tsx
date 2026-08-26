import { notFound } from "next/navigation";
import { getHuntGroup, hydrateHuntGroup, loadCityData } from "../../../../api/v1/_lib/data";
import { getCity } from "../../../../cities";
import GroupBoard, { type BoardGroup } from "./GroupBoard";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }) {
  const { city: slug } = await params;
  const city = getCity(slug);
  if (!city) return {};
  return { title: `Group hunt in ${city.name} — stroll.city`, robots: { index: false, follow: false } };
}

export default async function GroupPage({ params }: { params: Promise<{ city: string; group: string }> }) {
  const { city: slug, group: groupId } = await params;
  const city = getCity(slug);
  if (!city) notFound();
  const data = await loadCityData(slug);
  if (!data) notFound();
  const stored = await getHuntGroup(slug, groupId);
  if (!stored) notFound();
  const group = await hydrateHuntGroup(slug, stored) as unknown as BoardGroup;
  return <GroupBoard citySlug={slug} group={group} />;
}
