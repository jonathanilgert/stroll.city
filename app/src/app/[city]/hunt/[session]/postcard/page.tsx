import { notFound, redirect } from "next/navigation";
import { getHuntSession, hydrateHuntSession, loadCityData } from "../../../../api/v1/_lib/data";
import { getCity } from "../../../../cities";
import PostcardScreen, { type PostcardData } from "./PostcardScreen";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }) {
  const { city: slug } = await params;
  const city = getCity(slug);
  if (!city) return {};
  return { title: `Your postcard — stroll.city`, robots: { index: false, follow: false } };
}

export default async function PostcardPage({ params }: { params: Promise<{ city: string; session: string }> }) {
  const { city: slug, session: sessionId } = await params;
  const city = getCity(slug);
  if (!city) notFound();
  const data = await loadCityData(slug);
  if (!data) notFound();
  const stored = await getHuntSession(slug, sessionId);
  if (!stored) notFound();
  /* Nothing to celebrate yet — send them back to the stop they are on. */
  if (stored.status !== "finished") redirect(`/${slug}/hunt/${sessionId}`);

  const session = hydrateHuntSession(stored, data, { reveal: true });
  const seconds = session.elapsed_seconds + session.penalty_seconds;
  const postcard: PostcardData = {
    id: session.id,
    team_name: session.team_name,
    hunt_name: session.hunt_name,
    mode: session.mode,
    group_id: session.group_id,
    total_stops: session.total_stops,
    seconds,
    clues_used: session.stops.reduce((sum, stop) => sum + stop.clues_used, 0),
    finished_at: session.finished_at,
    stops: session.stops.map((stop) => ({
      stop_id: stop.stop_id,
      index: stop.index,
      name: stop.name,
      photo_url: stop.photo_url,
    })),
  };

  return <PostcardScreen citySlug={slug} postcard={postcard} />;
}
