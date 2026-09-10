import { envelope, error, loadCityData } from "../../_lib/data";
import { buildWalkingRoute, headingOf, metresBetween, routeLength } from "../../../../walking-route";

/* Walking directions between two points, routed over the city's streets and
   pathways. Server-side so a phone on a hunt is not asked to download the whole
   street network to be told which way to turn.

   GET /api/v1/calgary/route?from=lon,lat&to=lon,lat
*/
function parsePoint(value: string | null): [number, number] | null {
  if (!value) return null;
  const parts = value.split(",").map((part) => Number(part.trim()));
  if (parts.length !== 2 || parts.some((n) => !Number.isFinite(n))) return null;
  const [lon, lat] = parts;
  if (Math.abs(lon) > 180 || Math.abs(lat) > 90) return null;
  return [lon, lat];
}

export async function GET(request: Request, context: { params: Promise<{ city: string }> }) {
  const { city } = await context.params;
  const data = await loadCityData(city);
  if (!data) return error(404, "City not found");

  const url = new URL(request.url);
  const from = parsePoint(url.searchParams.get("from"));
  const to = parsePoint(url.searchParams.get("to"));
  if (!from || !to) return error(400, "from and to are required as lon,lat");

  const path = buildWalkingRoute(
    { streets: data.streets, pathways: data.pathways, bike: data.bike },
    from,
    to,
  );
  /* No route means one end is nowhere near anything walkable — say so rather than
     drawing a line through the buildings and calling it directions. */
  const straight = metresBetween(from, to);
  const coords = path ?? [from, to];
  const distance = path ? routeLength(path) : straight;

  return envelope(city, {
    coordinates: coords,
    distance_m: Math.round(distance),
    /* 80 m a minute is an unhurried pace, which is the point of the product. */
    minutes: Math.max(1, Math.round(distance / 80)),
    heading: headingOf(coords),
    on_network: Boolean(path),
  }, "static-json");
}
