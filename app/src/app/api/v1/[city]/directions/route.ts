import { error, loadCityData } from "../../_lib/data";

type Context = { params: Promise<{ city: string }> };
type Coordinate = [number, number];
type DirectionsPayload = { start?: unknown; finish?: unknown };

type OsrmResponse = {
  code?: string;
  routes?: Array<{
    distance?: number;
    duration?: number;
    geometry?: { type?: string; coordinates?: unknown };
  }>;
};

const DEFAULT_PEDESTRIAN_ROUTER = "https://routing.openstreetmap.de/routed-foot/route/v1/driving";
const MAX_CITY_RADIUS_M = 40_000;
const MAX_ROUTE_DISTANCE_M = 40_000;
const MAX_ROUTE_POINTS = 5_000;
const CACHE_TTL_MS = 5 * 60 * 1000;
const routeCache = new Map<string, { expires: number; data: DirectionsData }>();
const requestWindows = new Map<string, { started: number; count: number }>();

type DirectionsData = {
  coordinates: Coordinate[];
  distance_m: number;
  duration_s: number | null;
  profile: "pedestrian";
  source: string;
};

function coordinate(value: unknown): Coordinate | null {
  if (!Array.isArray(value) || value.length !== 2) return null;
  const lon = Number(value[0]);
  const lat = Number(value[1]);
  if (!Number.isFinite(lon) || !Number.isFinite(lat) || lon < -180 || lon > 180 || lat < -90 || lat > 90) return null;
  return [lon, lat];
}

function metersBetween(a: Coordinate, b: Coordinate) {
  const lat1 = a[1] * Math.PI / 180;
  const lat2 = b[1] * Math.PI / 180;
  const dLat = lat2 - lat1;
  const dLon = (b[0] - a[0]) * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 12_742_000 * Math.asin(Math.sqrt(h));
}

function routeCoordinates(value: unknown): Coordinate[] | null {
  if (!Array.isArray(value) || value.length < 2 || value.length > MAX_ROUTE_POINTS) return null;
  const result: Coordinate[] = [];
  for (const item of value) {
    const parsed = coordinate(item);
    if (!parsed) return null;
    result.push(parsed);
  }
  return result;
}

function requestAllowed(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const current = requestWindows.get(ip);
  if (!current || now - current.started >= 60_000) {
    requestWindows.set(ip, { started: now, count: 1 });
    return true;
  }
  current.count += 1;
  return current.count <= 30;
}

function cacheKey(city: string, start: Coordinate, finish: Coordinate) {
  return `${city}:${[...start, ...finish].map((value) => value.toFixed(5)).join(",")}`;
}

export async function POST(request: Request, context: Context) {
  const { city } = await context.params;
  const data = await loadCityData(city);
  if (!data) return error(404, "City not found");

  let payload: DirectionsPayload;
  try {
    payload = await request.json() as DirectionsPayload;
  } catch {
    return error(400, "Directions require a JSON body");
  }

  const start = coordinate(payload.start);
  const finish = coordinate(payload.finish);
  if (!start || !finish) return error(400, "start and finish must be [longitude, latitude]");
  if (metersBetween(start, data.center) > MAX_CITY_RADIUS_M || metersBetween(finish, data.center) > MAX_CITY_RADIUS_M) {
    return error(400, "Directions must stay near the selected city");
  }
  if (metersBetween(start, finish) > MAX_ROUTE_DISTANCE_M) return error(400, "Walking route is too long");
  if (!requestAllowed(request)) return error(429, "Too many direction requests; please try again shortly");

  const key = cacheKey(city, start, finish);
  const cached = routeCache.get(key);
  if (cached && cached.expires > Date.now()) {
    return Response.json({ ok: true, city, data: cached.data }, { headers: { "Cache-Control": "private, max-age=60" } });
  }

  const base = (process.env.PEDESTRIAN_ROUTER_URL ?? DEFAULT_PEDESTRIAN_ROUTER).replace(/\/$/, "");
  const url = `${base}/${start[0]},${start[1]};${finish[0]},${finish[1]}?overview=full&geometries=geojson&steps=false`;

  try {
    const upstream = await fetch(url, {
      headers: { "User-Agent": "stroll.city pedestrian directions (https://stroll.city)" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!upstream.ok) return error(503, "Pedestrian directions are temporarily unavailable");

    const body = await upstream.json() as OsrmResponse;
    const route = body.routes?.[0];
    const coordinates = routeCoordinates(route?.geometry?.coordinates);
    if (body.code !== "Ok" || route?.geometry?.type !== "LineString" || !coordinates || !Number.isFinite(route.distance)) {
      return error(422, "No pedestrian route was found");
    }

    const distanceM = route.distance!;
    if (distanceM > MAX_ROUTE_DISTANCE_M || metersBetween(coordinates[0], start) > 150 || metersBetween(coordinates.at(-1)!, finish) > 150) {
      return error(422, "Pedestrian router returned invalid geometry");
    }

    const result: DirectionsData = {
      coordinates,
      distance_m: distanceM,
      duration_s: Number.isFinite(route.duration) ? route.duration! : null,
      profile: "pedestrian",
      source: "OpenStreetMap pedestrian network",
    };
    routeCache.set(key, { expires: Date.now() + CACHE_TTL_MS, data: result });
    if (routeCache.size > 256) routeCache.delete(routeCache.keys().next().value!);
    return Response.json({ ok: true, city, data: result }, { headers: { "Cache-Control": "private, max-age=60" } });
  } catch {
    return error(503, "Pedestrian directions are temporarily unavailable");
  }
}
