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
