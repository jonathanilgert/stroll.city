/* ---------------------------------------------------------------------------
   Walking routes over the street network.

   Shared by the map app (which routes in the browser, having already loaded the
   city file) and the hunt API (which routes on the server, so a phone walking a
   hunt never has to download 1.4MB of streets to be told where to turn).
--------------------------------------------------------------------------- */

/* How far from a point we will look for somewhere to join the network, and how
   many of those joins to keep. A door set back from the kerb still has to reach
   the pavement, but joining to something a block away would draw a line through
   buildings. */
const ACCESS_RADIUS_M = 140;
const ACCESS_CANDIDATES = 6;

export type RouteNetwork = {
  streets?: GeoJSON.FeatureCollection;
  pathways?: GeoJSON.FeatureCollection;
  bike?: GeoJSON.FeatureCollection;
};

export function metresBetween(a: [number, number], b: [number, number]) {
  const toRad = Math.PI / 180;
  const lat1 = a[1] * toRad, lat2 = b[1] * toRad;
  const dLat = (b[1] - a[1]) * toRad, dLon = (b[0] - a[0]) * toRad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 12742000 * Math.asin(Math.sqrt(h));
}

function geometryLines(feature: GeoJSON.Feature): [number, number][][] {
  const geom = feature.geometry;
  if (!geom) return [];
  if (geom.type === "LineString") return [geom.coordinates as [number, number][]];
  if (geom.type === "MultiLineString") return geom.coordinates as [number, number][][];
  return [];
}

export function routeLength(path: [number, number][]) {
  let total = 0;
  for (let i = 1; i < path.length; i += 1) total += metresBetween(path[i - 1], path[i]);
  return total;
}

/* Compass bearing of the first real leg of a route — what to say out loud. */
export function headingOf(path: [number, number][]) {
  if (path.length < 2) return null;
  const [a] = path;
  /* Skip the joining hop onto the network; it points at the kerb, not the walk. */
  const b = path.find((point, i) => i > 0 && metresBetween(a, point) > 25) ?? path[path.length - 1];
  const toRad = Math.PI / 180;
  const dLon = (b[0] - a[0]) * toRad;
  const lat1 = a[1] * toRad, lat2 = b[1] * toRad;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const deg = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  return ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"][
    Math.round(deg / 45) % 8
  ];
}

/* Dijkstra across streets, pathways and bikeways. Returns null when either end is
   too far from anything walkable — the caller should fall back to a straight line
   rather than pretend. */
export function buildWalkingRoute(
  network: RouteNetwork,
  start: [number, number],
  finish: [number, number],
): [number, number][] | null {
  const nodeIds = new Map<string, number>();
  const nodes: [number, number][] = [];
  const graph: Array<Array<[number, number]>> = [];
  const keyFor = (coord: [number, number]) => `${coord[0].toFixed(5)},${coord[1].toFixed(5)}`;
  const addNode = (coord: [number, number]) => {
    const key = keyFor(coord);
    const existing = nodeIds.get(key);
    if (existing !== undefined) return existing;
    const id = nodes.length;
    nodeIds.set(key, id);
    nodes.push(coord);
    graph.push([]);
    return id;
  };
  const addEdgeIndexes = (ai: number, bi: number, d: number) => {
    graph[ai].push([bi, d]);
    graph[bi].push([ai, d]);
  };

  [network.streets, network.pathways, network.bike].forEach((collection) => {
    collection?.features.forEach((feature) => {
      geometryLines(feature).forEach((line) => {
        for (let i = 1; i < line.length; i += 1) {
          const a = line[i - 1], b = line[i];
          addEdgeIndexes(addNode(a), addNode(b), metresBetween(a, b));
        }
      });
    });
  });
  if (!nodes.length) return null;

  const accessCandidates = (point: [number, number]) => nodes
    .map((node, index) => ({ index, distance: metresBetween(point, node) }))
    .filter((candidate) => candidate.distance <= ACCESS_RADIUS_M)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, ACCESS_CANDIDATES);

  const startCandidates = accessCandidates(start);
  const finishCandidates = accessCandidates(finish);
  if (!startCandidates.length || !finishCandidates.length) return null;

  const startIndex = nodes.length;
  nodes.push(start);
  graph.push([]);
  startCandidates.forEach(({ index, distance }) => addEdgeIndexes(startIndex, index, distance));

  const finishIndex = nodes.length;
  nodes.push(finish);
  graph.push([]);
  finishCandidates.forEach(({ index, distance }) => addEdgeIndexes(finishIndex, index, distance));

  const dist = new Array(nodes.length).fill(Infinity);
  const prev = new Array<number>(nodes.length).fill(-1);
  const seen = new Set<number>();
  dist[startIndex] = 0;
  while (seen.size < nodes.length) {
    let u = -1, best = Infinity;
    for (let i = 0; i < dist.length; i += 1) {
      if (!seen.has(i) && dist[i] < best) { best = dist[i]; u = i; }
    }
    if (u === -1 || u === finishIndex) break;
    seen.add(u);
    graph[u].forEach(([v, weight]) => {
      const next = dist[u] + weight;
      if (next < dist[v]) { dist[v] = next; prev[v] = u; }
    });
  }
  if (!Number.isFinite(dist[finishIndex])) return null;
  const path: [number, number][] = [];
  for (let at = finishIndex; at !== -1; at = prev[at]) path.push(nodes[at]);
  path.reverse();
  return path;
}
