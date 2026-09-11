#!/usr/bin/env node
/*
  End-to-end checks against a running dev server.
  Usage: npm run test:app          (expects http://localhost:3000)
         BASE=http://localhost:3111 npm run test:app

  Covers the surfaces a unit test would not: real HTTP, real session files, real
  page renders. It walks each hunt shape start to finish, so a regression in the
  counter, the photo gate or the spoiler masking fails here rather than in front
  of someone standing on 9 Ave.
*/
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE ?? "http://localhost:3000";
const DATA = JSON.parse(fs.readFileSync(path.join(process.cwd(), "public", "data", "stroll-data.json"), "utf8"));
const MAP_SOURCE = fs.readFileSync(path.join(process.cwd(), "src", "app", "StrollCityApp.tsx"), "utf8");
const STOP = new Map(DATA.huntStops.map((s) => [s.id, s]));
const fails = [];
const fail = (area, msg) => { fails.push(`[${area}] ${msg}`); console.log(`      FAIL [${area}] ${msg}`); };

/* A 1x1 PNG, so photo upload can be exercised without a fixture on disk. */
const PIXEL = Buffer.from(
  "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8cfc00000030101001836dd8f0000000049454e44ae426082",
  "hex",
);

async function call(pathname, { method = "GET", body, raw = false } = {}) {
  const res = await fetch(BASE + pathname, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  const text = await res.text();
  if (raw) return { status: res.status, text };
  try { return { status: res.status, json: JSON.parse(text) }; }
  catch { return { status: res.status, text }; }
}

async function uploadPhoto(session, stopId) {
  const form = new FormData();
  form.append("stop_id", stopId);
  form.append("team_name", "tester");
  form.append("photo", new Blob([PIXEL], { type: "image/png" }), "p.png");
  const res = await fetch(`${BASE}/api/v1/calgary/sessions/${session}/photos`, { method: "POST", body: form });
  return res.status;
}

function screen(html) {
  const stop = html.match(/Stop (\d+) of (\d+)/);
  const photo = html.match(/data-state="(\w+)"/);
  const ctas = ["Answer the riddle to continue", "Photo at the door to continue",
                "Unlock next riddle", "Finish the hunt", "See your postcard"];
  return {
    stop: stop ? Number(stop[1]) : null,
    total: stop ? Number(stop[2]) : null,
    photo: photo?.[1] ?? null,
    cta: ctas.find((c) => html.includes(c)) ?? null,
    html,
  };
}

async function section(title, run) {
  console.log(`\n${"=".repeat(60)}\n${title}\n${"=".repeat(60)}`);
  await run();
}

await section("PAGES", async () => {
  const paths = ["/", "/calgary", "/edmonton", "/calgary/hunt", "/calgary/hunt/start",
                 "/calgary/hunt/race/new", "/portal", "/business", "/events", "/rules", "/admin"];
  for (const p of paths) {
    const { status, text } = await call(p, { raw: true });
    if (status !== 200) fail("page", `${p} → ${status}`);
    else if (text.length < 500) fail("page", `${p} rendered ${text.length} bytes`);
  }
  console.log(`  ${paths.length} pages render`);
  for (const [p, want] of [["/nowhere", 404], ["/vancouver", 404],
                           ["/calgary/hunt/sess-nope", 404], ["/calgary/hunt/group/grp-nope", 404]]) {
    const { status } = await call(p, { raw: true });
    if (status !== want) fail("page", `${p} → ${status}, expected ${want}`);
  }
  console.log("  not-found handling ok");
  /* /s is the sticker QR: a redirect onto the map, not a page. */
  const sticker = await call("/s", { raw: true });
  if (sticker.status !== 307) fail("page", `/s → ${sticker.status}, expected a 307 redirect`);
  console.log("  sticker link redirects to the map");
});

await section("IOS ROUTE STARTUP", async () => {
  const canaries = [
    ["tolerant location options", "{ enableHighAccuracy: false, maximumAge: 60_000, timeout: 30_000 }"],
    ["permission-specific recovery copy", "Allow location access for Safari and try again"],
    ["unavailable-specific recovery copy", "Your location is temporarily unavailable"],
    ["timeout-specific recovery copy", "Finding your location took too long"],
    ["successful recovery clears stale errors", "setGeoError(null);"],
    ["external walking-directions fallback", "https://www.google.com/maps/dir/?api=1&destination="],
    ["route camera respects constrained mobile space", "map.cameraForBounds(bounds, { padding, maxZoom: 18.8 })"],
    ["camera layout failures do not cancel navigation", "A transient iOS layout/resize must not turn valid route geometry into a route failure"],
  ];
  for (const [label, expected] of canaries) {
    if (!MAP_SOURCE.includes(expected)) fail("ios-route", `missing ${label}`);
  }
  console.log("  mobile route startup accepts a recent fix, allows a longer cold start, and offers a Maps fallback");
});

await section("API", async () => {
  const cases = [["/api/v1/calgary/businesses", 200], ["/api/v1/calgary/businesses?cat=cafe", 200],
                 ["/api/v1/calgary/businesses?q=records", 200], ["/api/v1/calgary/events", 200],
                 ["/api/v1/calgary/attractions", 200], ["/api/v1/calgary/hunts", 200],
                 ["/api/v1/calgary/layers/trees", 200], ["/api/v1/calgary/layers/bogus", 404],
                 ["/api/v1/vancouver/businesses", 404], ["/api/v1/calgary/hunts?slug=nope", 404]];
  for (const [p, want] of cases) {
    const { status } = await call(p);
    if (status !== want) fail("api", `${p} → ${status}, expected ${want}`);
  }
  console.log(`  ${cases.length} endpoints return the expected status`);

  /* This location-to-Wymbin route previously crossed the railway where there is
     no crossing. The pedestrian router must take the 8 St underpass to the west. */
  const directions = await call("/api/v1/calgary/directions", {
    method: "POST",
    body: { start: [-114.0405, 51.0330], finish: [-114.040195, 51.042799] },
  });
  if (directions.status !== 200) fail("directions", `reported Wymbin route → ${directions.status}`);
  const route = directions.json?.data?.coordinates;
  let underpassRoute = Array.isArray(route) && route.length >= 3;
  if (!underpassRoute) fail("directions", "pedestrian route geometry is missing");
  else if (!route.some(([lon, lat]) => lon < -114.0414 && lat > 51.0395 && lat < 51.0436)) {
    underpassRoute = false;
    fail("directions", "Wymbin route did not use the west-side 8 St underpass corridor");
  }
  if (underpassRoute) console.log("  reported Wymbin route uses the mapped pedestrian underpass");

  /* The search regressed once by only matching substrings of the name. */
  for (const q of ["records", "books", "cafes", "brewery", "coffee"]) {
    const { json } = await call(`/api/v1/calgary/businesses?q=${q}`);
    if (!json?.count) fail("search", `q=${q} found nothing`);
  }
  const { json: noise } = await call("/api/v1/calgary/businesses?q=zzzzqqq");
  if (noise?.count) fail("search", "nonsense query matched something");
  console.log("  search finds plurals and blurb terms, rejects noise");

  for (const p of ["/api/v1/calgary/hunt/stops", "/api/v1/calgary/hunts", "/api/v1/calgary/admin/businesses"]) {
    const { status } = await call(p, { method: "POST", body: { name: "x" } });
    if (![401, 403].includes(status)) fail("security", `${p} accepted an unauthenticated write (${status})`);
  }
  console.log("  write endpoints require a key");
});

await section("DATA", async () => {
  const ids = new Set(DATA.huntStops.map((s) => s.id));
  if (ids.size !== DATA.huntStops.length) fail("data", "duplicate stop ids");
  for (const hunt of DATA.hunts) {
    const missing = hunt.stop_ids.filter((id) => !ids.has(id));
    if (missing.length) fail("data", `hunt ${hunt.slug} points at missing stops ${missing}`);
  }
  const biz = new Map(DATA.businesses.map((b) => [b.id, b]));
  for (const s of DATA.huntStops) {
    if (!s.riddle?.trim()) fail("data", `${s.id} has no riddle`);
    if (![s.clue_1, s.clue_2, s.clue_3].every((c) => c?.trim())) fail("data", `${s.id} is missing a clue`);
    if (!s.category) fail("data", `${s.id} has no category`);
    const placed = (s.business_id && biz.has(s.business_id)) || (typeof s.lon === "number" && typeof s.lat === "number");
    if (!placed) fail("data", `${s.id} cannot be placed on the map`);
    /* Clue three is the way out and must name the place; the first two must not. */
    const name = s.name.toLowerCase();
    if (`${s.clue_1} ${s.clue_2}`.toLowerCase().includes(name)) fail("data", `${s.id} gives the answer away in clue 1 or 2`);
    if (!s.clue_3.toLowerCase().includes(name)) fail("data", `${s.id} clue 3 does not name the answer`);
  }
  console.log(`  ${DATA.huntStops.length} stops: riddles, three clues, categories, placement, clue-3 reveal`);
});

await section("THEMES", async () => {
  const themes = {
    "date-night": ["bar", "restaurant", "gallery"], "with-friends": ["bar", "shop", "restaurant"],
    "shop-crawl": ["shop", "gallery"], "eat-drink": ["cafe", "restaurant"],
    "makers": ["gallery", "services", "shop"],
  };
  const family = new Set(["shop-crawl", "eat-drink", "makers"]);
  for (const [theme, allowed] of Object.entries(themes)) {
    for (let i = 0; i < 3; i += 1) {
      const { json } = await call("/api/v1/calgary/hunts/full-hunt/sessions", { method: "POST", body: { team_name: "T", theme } });
      for (const id of json.data.stop_ids) {
        const stop = STOP.get(id);
        if (!allowed.includes(stop.category)) fail("theme", `${theme} drew a ${stop.category}`);
        if (family.has(theme) && stop.age_restricted) fail("theme", `${theme} drew an age-restricted stop`);
      }
    }
  }
  console.log(`  ${Object.keys(themes).length} themes stay in their categories; family themes stay dry`);
});

async function walk(session, label, { group = false } = {}) {
  const { json: start } = await call(`/api/v1/calgary/sessions/${session}`);
  const total = start.data.total_stops;
  for (let i = 0; i < total; i += 1) {
    const { text } = await call(`/calgary/hunt/${session}`, { raw: true });
    const view = screen(text);
    if (view.stop !== i + 1) fail(label, `expected stop ${i + 1}, screen shows ${view.stop}`);
    if (view.cta !== "Answer the riddle to continue") fail(label, `stop ${i + 1}: cta is ${view.cta}`);
    const { json: cur } = await call(`/api/v1/calgary/sessions/${session}`);
    for (const s of cur.data.stops) {
      if (s.state !== "solved" && STOP.get(s.stop_id) && text.includes(STOP.get(s.stop_id).name)) {
        fail("security", `${label}: unsolved stop name in the page`);
      }
    }
    const pending = cur.data.stops.find((s) => s.state !== "solved" || !s.photo_url);
    const answer = STOP.get(pending.stop_id).name;
    const { json: guess } = await call(`/api/v1/calgary/sessions/${session}/answer`, {
      method: "POST", body: { stop_id: pending.stop_id, guess: answer },
    });
    if (!guess?.data?.correct) fail(label, `stop ${i + 1}: correct answer rejected`);
    const { text: after } = await call(`/calgary/hunt/${session}`, { raw: true });
    if (!after.includes("Photo at the door to continue")) fail(label, `stop ${i + 1}: photo not required after answering`);
    const status = await uploadPhoto(session, pending.stop_id);
    if (status !== 200) fail(label, `stop ${i + 1}: photo upload → ${status}`);
  }
  const { json: done } = await call(`/api/v1/calgary/sessions/${session}`);
  if (done.data.status !== "finished") fail(label, `status ${done.data.status} after every stop`);
  const { text: card } = await call(`/calgary/hunt/${session}/postcard`, { raw: true });
  const photos = new Set([...card.matchAll(/\/api\/v1\/calgary\/sessions\/[^"\\]+\/photos\/[^"\\]+/g)].map((m) => m[0]));
  if (photos.size < total) fail(label, `postcard shows ${photos.size} photos, expected ${total}`);
  const back = group ? "Back to the team board" : "Back to the map";
  if (!card.includes(back)) fail(label, `postcard missing "${back}"`);
  for (const want of ["Save", "Send it", "Stops found"]) {
    if (!card.includes(want)) fail(label, `postcard missing "${want}"`);
  }
  return total;
}

await section("HUNT FLOWS", async () => {
  const { json: solo } = await call("/api/v1/calgary/hunts/friendly-mode/sessions", {
    method: "POST", body: { team_name: "Solo Sam", party_type: "solo", theme: "shop-crawl" },
  });
  if (solo.data.party_size !== 1) fail("solo", "party_size is not 1");
  console.log(`  solo: ${await walk(solo.data.id, "solo")} stops`);

  const { json: team } = await call("/api/v1/calgary/hunts/full-hunt/sessions", {
    method: "POST", body: { team_name: "The Testers", party_type: "team", party_size: 4, theme: "date-night" },
  });
  console.log(`  team: ${await walk(team.data.id, "team")} stops`);

  const { json: group } = await call("/api/v1/calgary/hunts/loop-race/groups", {
    method: "POST", body: { group_name: "Reid's 40th", team_names: ["Alpha", "Bravo", "Charlie"], party_size: 12 },
  });
  const teams = group.data.teams;
  const starts = teams.map((t) => t.start_index);
  if (new Set(starts).size !== starts.length) fail("group", `teams share a start ${starts}`);
  const orders = [];
  for (const t of teams) {
    const { json } = await call(`/api/v1/calgary/sessions/${t.session_id}`);
    orders.push(json.data.stop_ids.join(","));
  }
  if (new Set(orders).size !== orders.length) fail("group", "two teams walk the same order");
  if (new Set(orders.map((o) => o.split(",").sort().join(","))).size !== 1) fail("group", "teams walk different doors");
  const { text: board } = await call(`/calgary/hunt/group/${group.data.id}`, { raw: true });
  for (const t of teams) if (!board.includes(t.team_name)) fail("group", `${t.team_name} missing from the board`);
  console.log(`  group: ${teams.length} teams, starts ${starts}, ${await walk(teams[0].session_id, "group", { group: true })} stops`);
});

await section("RACES", async () => {
  const { json: race } = await call("/api/v1/calgary/races", { method: "POST", body: { team_count: 3 } });
  const code = race.data.code;
  if (!code) return fail("race", "no join code returned");
  const { status: unknown } = await call("/api/v1/races/ZZZZZ/join", { method: "POST", body: { team_name: "Ghost" } });
  if (unknown !== 404) fail("race", `unknown code join → ${unknown}, expected 404`);
  const { status: noBoard } = await call("/api/v1/races/ZZZZZ/leaderboard");
  if (noBoard !== 404) fail("race", `unknown code leaderboard → ${noBoard}, expected 404`);
  const { json: joined } = await call(`/api/v1/races/${code}/join`, { method: "POST", body: { team_name: "The Quick" } });
  if (!joined?.data?.hunt_url) fail("race", "join did not return a punch card");
  const { json: again } = await call(`/api/v1/races/${code}/join`, { method: "POST", body: { team_name: "The Quick" } });
  if (again?.data?.session_id !== joined.data.session_id) fail("race", "rejoining burned a second slot");
  await call(`/api/v1/races/${code}/join`, { method: "POST", body: { team_name: "Second" } });
  await call(`/api/v1/races/${code}/join`, { method: "POST", body: { team_name: "Third" } });
  const { status: full } = await call(`/api/v1/races/${code}/join`, { method: "POST", body: { team_name: "Fourth" } });
  if (full !== 409) fail("race", `a full race returned ${full}, expected 409`);
  const { json: lb } = await call(`/api/v1/races/${code}/leaderboard`);
  if (lb?.data?.standings?.length !== 3) fail("race", `leaderboard has ${lb?.data?.standings?.length} teams, expected 3`);
  console.log(`  code ${code}: join, rejoin, full-race 409, leaderboard of ${lb?.data?.standings?.length}`);
});

await section("STOP ORDER", async () => {
  /* Taking the photo before answering is the natural order standing at a door. It
     once flipped the button to "Unlock next riddle" and let advance() mark the stop
     solved, skipping the riddle entirely. */
  const { json: s } = await call("/api/v1/calgary/hunts/friendly-mode/sessions", { method: "POST", body: { team_name: "Order" } });
  const id = s.data.id, first = s.data.stop_ids[0];
  await uploadPhoto(id, first);
  const { text } = await call(`/calgary/hunt/${id}`, { raw: true });
  const view = screen(text);
  if (view.stop !== 1) fail("order", `a photo alone moved the screen to stop ${view.stop}`);
  if (view.cta !== "Answer the riddle to continue") fail("order", `a photo alone changed the cta to "${view.cta}"`);
  const { json: after } = await call(`/api/v1/calgary/sessions/${id}`);
  const row = after.data.stops.find((r) => r.stop_id === first);
  if (row.state === "solved") fail("order", "a photo alone solved the stop");
  if (row.name) fail("order", "a photo alone revealed the answer");

  /* And the other way round: answering first must still ask for the photo. */
  const { json: s2 } = await call("/api/v1/calgary/hunts/friendly-mode/sessions", { method: "POST", body: { team_name: "Order 2" } });
  const id2 = s2.data.id, first2 = s2.data.stop_ids[0];
  await call(`/api/v1/calgary/sessions/${id2}/answer`, { method: "POST", body: { stop_id: first2, guess: STOP.get(first2).name } });
  const { text: t2 } = await call(`/calgary/hunt/${id2}`, { raw: true });
  const v2 = screen(t2);
  if (v2.stop !== 1) fail("order", `answering moved the screen to stop ${v2.stop}`);
  if (v2.cta !== "Photo at the door to continue") fail("order", `after answering the cta is "${v2.cta}"`);
  console.log("  neither half alone advances the stop, in either order");
});

await section("CONCURRENCY", async () => {
  /* Answering and uploading land together whenever someone taps both in the same
     second. Both are read-modify-write on one overlay file, and without a queue the
     second write was built on a snapshot taken before the first — the answer would
     vanish and the stop would ask to be solved again. */
  let lost = 0;
  for (let trial = 0; trial < 5; trial += 1) {
    const { json: s } = await call("/api/v1/calgary/hunts/friendly-mode/sessions", { method: "POST", body: { team_name: `Race ${trial}` } });
    const id = s.data.id, first = s.data.stop_ids[0];
    await Promise.all([
      call(`/api/v1/calgary/sessions/${id}/progress`, { method: "POST", body: { stop_id: first, action: "clue_revealed", clues_used: 1 } }),
      call(`/api/v1/calgary/sessions/${id}/answer`, { method: "POST", body: { stop_id: first, guess: STOP.get(first).name } }),
      uploadPhoto(id, first),
    ]);
    const { json } = await call(`/api/v1/calgary/sessions/${id}`);
    const row = json.data.stops[0];
    if (row.state !== "solved" || !row.photo_url) {
      lost += 1;
      fail("concurrency", `simultaneous writes lost one: state=${row.state} photo=${row.photo_url ? "yes" : "no"}`);
    }
  }
  if (!lost) console.log("  simultaneous clue, answer and photo all survive");

  /* Two phones reaching for the same race slot must not both get it. */
  const { json: race } = await call("/api/v1/calgary/races", { method: "POST", body: { team_count: 2 } });
  const code = race.data.code;
  const [a, b] = await Promise.all([
    call(`/api/v1/races/${code}/join`, { method: "POST", body: { team_name: "First" } }),
    call(`/api/v1/races/${code}/join`, { method: "POST", body: { team_name: "Second" } }),
  ]);
  const ids = [a.json?.data?.session_id, b.json?.data?.session_id].filter(Boolean);
  if (new Set(ids).size !== ids.length) fail("concurrency", "two teams were given the same punch card");
  else console.log("  simultaneous race joins get different punch cards");
});

await section("CACHING", async () => {
  /* Live session state must never be cacheable. It used to go out as
     "public, max-age=60", so after uploading a photo the client re-read its session
     and the browser answered from a copy taken before the riddle was answered — the
     photo vanished and the stop asked to be solved again. "public" also meant a
     shared cache could serve one team's session, name and email included, to
     someone else. */
  const { json: s } = await call("/api/v1/calgary/hunts/friendly-mode/sessions", { method: "POST", body: { team_name: "Cache" } });
  const live = [
    `/api/v1/calgary/sessions/${s.data.id}`,
    `/api/v1/calgary/sessions/${s.data.id}/postcard`,
  ];
  for (const p of live) {
    const res = await fetch(BASE + p);
    const cc = res.headers.get("cache-control") ?? "";
    if (!cc.includes("no-store")) fail("caching", `${p} is cacheable: "${cc}"`);
    if (cc.includes("public")) fail("caching", `${p} is marked public — private session data`);
  }
  /* Reference data is still allowed to cache. */
  const ref = await fetch(`${BASE}/api/v1/calgary/businesses`);
  if (!(ref.headers.get("cache-control") ?? "").includes("public")) {
    fail("caching", "reference data lost its caching");
  }
  console.log("  session state is no-store; reference data still caches");
});

await section("MAP DIRECTIONS", async () => {
  /* Coordinates have to arrive with the answer. They used to be computed once at
     page load, so solving a stop never moved the map until a full reload — the
     screen said "it's Kent Of Inglewood" while still showing a search circle. */
  const { json: s } = await call("/api/v1/calgary/hunts/friendly-mode/sessions", { method: "POST", body: { team_name: "Directions" } });
  const id = s.data.id, first = s.data.stop_ids[0];
  const { json: before } = await call(`/api/v1/calgary/sessions/${id}`);
  const hidden = before.data.stops[0];
  if (hidden.lon !== null || hidden.lat !== null) fail("map", "an unsolved stop shipped its coordinates");
  if (hidden.address) fail("map", "an unsolved stop shipped its address");

  await call(`/api/v1/calgary/sessions/${id}/answer`, { method: "POST", body: { stop_id: first, guess: STOP.get(first).name } });
  const { json: after } = await call(`/api/v1/calgary/sessions/${id}`);
  const found = after.data.stops[0];
  if (typeof found.lon !== "number" || typeof found.lat !== "number") fail("map", "a solved stop has no coordinates to point at");
  if (!found.address) fail("map", "a solved stop has no address");

  /* The walk there uses the city's pedestrian router — the same one the map app
     uses, rather than a second set of rules for the hunt. */
  const { status: routeStatus, json: route } = await call(`/api/v1/calgary/directions`, {
    method: "POST", body: { start: [-114.0455, 51.0455], finish: [found.lon, found.lat] },
  });
  if (routeStatus === 200) {
    if (!route?.data?.coordinates?.length) fail("map", "directions returned no path");
    else if (route.data.coordinates.length < 3) fail("map", "directions returned a straight line");
  } else if (![429, 503, 422].includes(routeStatus)) {
    /* The upstream router can be rate limited or down; that is not our bug. */
    fail("map", `directions returned ${routeStatus}`);
  }
  const { status: bad } = await call("/api/v1/calgary/directions", { method: "POST", body: { start: "nonsense" } });
  if (bad !== 400) fail("map", `bad directions input returned ${bad}, expected 400`);

  /* The street is drawn for context — every door as a dot — but never labelled:
     102 of the 162 businesses are hunt stops, so a labelled map would answer the
     riddle by being read. Landmarks are named because they are never stops. */
  const { text: game } = await call(`/calgary/hunt/${id}`, { raw: true });
  const doors = (game.match(/\\"lon\\":-114\.\d+/g) ?? []).length;
  if (doors < 100) fail("map", `only ${doors} doors drawn — the street has no context`);
  const named = [...STOP.values()].filter((stop) => game.includes(stop.name));
  /* The solved stop may name itself; nothing else may. */
  const unsolvedNamed = named.filter((stop) => stop.id !== first);
  if (unsolvedNamed.length) fail("map", `unsolved stop names on the map page: ${unsolvedNamed.slice(0, 3).map((s) => s.name)}`);
  for (const place of ["Calgary Zoo", "The Confluence", "RiverWalk"]) {
    if (!game.includes(place)) fail("map", `landmark ${place} missing from the map`);
  }
  console.log(`  coordinates arrive on solving; directions come from the pedestrian router`);
  console.log(`  ${doors} doors drawn unlabelled, 3 landmarks named`);

  /* Tapping a door is how you check a place you are standing at without knowing its
     name. It has to count exactly as a typed guess does — right, wrong, or nothing. */
  const { json: tap } = await call("/api/v1/calgary/hunts/friendly-mode/sessions", { method: "POST", body: { team_name: "Tap" } });
  const tapId = tap.data.id, tapStop = tap.data.stop_ids[0];
  const biz = new Map(DATA.businesses.map((b) => [b.id, b]));
  const answer = biz.get(STOP.get(tapStop).business_id);
  if (!answer) return fail("map", "stop 1 has no business to tap");
  const elsewhere = DATA.businesses.find((b) => b.id !== answer.id);

  const { json: wrongDoor } = await call(`/api/v1/calgary/sessions/${tapId}/answer`, {
    method: "POST", body: { stop_id: tapStop, door: [elsewhere.lon, elsewhere.lat] },
  });
  if (wrongDoor?.data?.correct !== false) fail("map", "tapping the wrong door was accepted");

  const { json: nowhere } = await call(`/api/v1/calgary/sessions/${tapId}/answer`, {
    method: "POST", body: { stop_id: tapStop, door: [-114.09, 51.09] },
  });
  if (nowhere?.data?.correct !== false) fail("map", "tapping empty ground was accepted");

  const { status: neither } = await call(`/api/v1/calgary/sessions/${tapId}/answer`, {
    method: "POST", body: { stop_id: tapStop },
  });
  if (neither !== 400) fail("map", `an empty check returned ${neither}, expected 400`);

  const { json: rightDoor } = await call(`/api/v1/calgary/sessions/${tapId}/answer`, {
    method: "POST", body: { stop_id: tapStop, door: [answer.lon, answer.lat] },
  });
  if (!rightDoor?.data?.correct) fail("map", "tapping the right door did not solve the stop");
  console.log("  tapping a door checks it: right solves, wrong and empty do not");

  /* The full map colours doors by category, so the payload carries that — but never
     a name, which is the answer. */
  const { text: withDoors } = await call(`/calgary/hunt/${tapId}`, { raw: true });
  if (!withDoors.includes("Open map")) fail("map", "no way to open the full map");
  const cats = (withDoors.match(/category/g) ?? []).length;
  if (cats < 100) fail("map", `only ${cats} doors carry a category to colour by`);
  const { json: tapState } = await call(`/api/v1/calgary/sessions/${tapId}`);
  const solvedIds = new Set(tapState.data.stops.filter((s) => s.state === "solved").map((s) => s.stop_id));
  const namedInPayload = [...STOP.values()]
    .filter((stop) => !solvedIds.has(stop.id) && withDoors.includes(stop.name));
  if (namedInPayload.length) fail("map", `the full map payload names ${namedInPayload.length} unsolved stop(s)`);
  console.log(`  full map: ${cats} doors carry a category, none carry a name`);
});

await section("VALIDATION", async () => {
  const { json: sess } = await call("/api/v1/calgary/hunts/friendly-mode/sessions", { method: "POST", body: { team_name: "Edge" } });
  const id = sess.data.id, first = sess.data.stop_ids[0];
  const { json: wrong } = await call(`/api/v1/calgary/sessions/${id}/answer`, { method: "POST", body: { stop_id: first, guess: "a hardware store" } });
  if (wrong?.data?.correct !== false) fail("validation", "a wrong guess was accepted");
  const checks = [
    [`/api/v1/calgary/sessions/${id}/answer`, "POST", { stop_id: first, guess: "  " }, 400],
    [`/api/v1/calgary/sessions/${id}/answer`, "POST", { stop_id: "nope", guess: "x" }, 404],
    ["/api/v1/calgary/sessions/sess-nope/answer", "POST", { stop_id: first, guess: "x" }, 404],
    ["/api/v1/calgary/sessions/sess-nope/progress", "POST", { stop_id: first, action: "stop_solved" }, 404],
    ["/api/v1/calgary/sessions/sess-nope/postcard", "GET", undefined, 404],
    ["/api/v1/calgary/groups/grp-nope", "GET", undefined, 404],
  ];
  for (const [p, method, body, want] of checks) {
    const { status } = await call(p, { method, body });
    if (status !== want) fail("validation", `${method} ${p} → ${status}, expected ${want}`);
  }
  const clamps = [
    [{ party_type: "group", party_size: 9999, team_count: 99 }, 200, 12],
    [{ party_type: "team", party_size: 999 }, 24, 1],
    [{ party_type: "solo", party_size: 50 }, 1, 1],
  ];
  for (const [body, size, teams] of clamps) {
    const { json } = await call("/api/v1/calgary/hunts/friendly-mode/sessions", { method: "POST", body });
    if (json.data.party_size !== size || json.data.team_count !== teams) {
      fail("validation", `clamp wrong for ${JSON.stringify(body)}: got ${json.data.party_size}/${json.data.team_count}`);
    }
  }
  const biz = DATA.businesses[0];
  const claim = { business_id: biz.id, claimant_role: "Owner", claimant_email: "a@b.com", plan_tier: "free" };
  const { status: named } = await call("/api/v1/calgary/claims", { method: "POST", body: { ...claim, claimant_name: "Alex Tester" } });
  if (named >= 400) fail("validation", `a valid claim was rejected (${named})`);
  for (const [label, body] of [["no name", { ...claim, claimant_name: "" }],
                               ["bad email", { ...claim, claimant_name: "A Tester", claimant_email: "nope" }],
                               ["unknown business", { ...claim, claimant_name: "A Tester", business_id: "ghost" }]]) {
    const { status } = await call("/api/v1/calgary/claims", { method: "POST", body });
    if (status < 400) fail("validation", `claim with ${label} was accepted (${status})`);
  }
  console.log("  guesses, unknown ids, party clamps and claim validation all behave");
});

await section("SPOILERS", async () => {
  const { json: sess } = await call("/api/v1/calgary/hunts/full-hunt/sessions", { method: "POST", body: { team_name: "Peek" } });
  const id = sess.data.id;
  const { text } = await call(`/calgary/hunt/${id}`, { raw: true });
  const { json: state } = await call(`/api/v1/calgary/sessions/${id}`);
  for (const s of state.data.stops) {
    const name = STOP.get(s.stop_id)?.name;
    if (name && text.includes(name)) fail("security", `unsolved stop ${name} appears in the page`);
    if (s.name !== "") fail("security", "API returned an unsolved stop name");
    if (s.clues.length) fail("security", "a clue shipped before it was revealed");
  }
  if (/"exact":\{/.test(text)) fail("security", "exact coordinates shipped for an unsolved stop");
  const { text: onboarding } = await call("/calgary/hunt/start", { raw: true });
  for (const s of DATA.huntStops) {
    if (onboarding.includes(s.name)) { fail("security", `onboarding leaks ${s.name}`); break; }
  }
  /* Clue three names the place, so it must arrive only when asked for. */
  const stopId = sess.data.stop_ids[0];
  for (let n = 1; n <= 3; n += 1) {
    await call(`/api/v1/calgary/sessions/${id}/progress`, { method: "POST", body: { stop_id: stopId, action: "clue_revealed", clues_used: n } });
    const { json } = await call(`/api/v1/calgary/sessions/${id}`);
    const row = json.data.stops.find((s) => s.stop_id === stopId);
    if (row.clues.length !== n) fail("security", `asked for ${n} clue(s), got ${row.clues.length}`);
    const reveals = row.clues.some((c) => c.toLowerCase().includes(STOP.get(stopId).name.toLowerCase()));
    if (n < 3 && reveals) fail("security", `clue ${n} named the answer`);
    if (n === 3 && !reveals) fail("data", "clue 3 did not name the answer");
  }
  console.log("  nothing leaks before it is earned; clue 3 reveals only when asked for");
});

console.log(`\n${"=".repeat(60)}`);
console.log(fails.length ? `${fails.length} FAILURE(S)` : "ALL CHECKS PASSED");
for (const f of fails) console.log(`  ${f}`);
console.log("=".repeat(60));
process.exit(fails.length ? 1 : 0);
