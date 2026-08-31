#!/usr/bin/env node
/*
  Import a curated riddle set into public/data/stroll-data.json.

  Usage: node scripts/import-hunt-riddles.mjs <riddles.json>

  The riddle file is authoritative for everything a player reads — riddle, clues,
  challenge, difficulty, age rating — and for the stop's category, which the hunt
  themes select on. Category matters: the licence register mislabels a lot of the
  strip (a design studio filed as "shop"), and the curated file carries the
  correction.

  Stops keep their ids, so hunts and sessions in flight keep pointing at the same
  doors. Stops with no matching business record are kept with their own
  coordinates rather than dropped — a real door the licence data has not caught up
  with is still a real door.
*/
import fs from "node:fs";
import path from "node:path";

const source = process.argv[2];
if (!source) {
  console.error("Usage: node scripts/import-hunt-riddles.mjs <riddles.json>");
  process.exit(1);
}

const root = process.cwd();
const dataPath = path.join(root, "public", "data", "stroll-data.json");
const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
const incoming = JSON.parse(fs.readFileSync(source, "utf8"));
const stops = Array.isArray(incoming) ? incoming : incoming.stops;
if (!Array.isArray(stops) || !stops.length) {
  console.error("No stops found in the riddle file.");
  process.exit(1);
}

const slugify = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const bySlug = new Map();
const byName = new Map();
for (const business of data.businesses) {
  bySlug.set(slugify(business.name), business);
  byName.set(business.name.toLowerCase().trim(), business);
}

const previous = new Map((data.huntStops ?? []).map((stop) => [stop.id, stop]));
const now = new Date().toISOString();
let matched = 0;
let orphans = 0;
const categories = {};

const huntStops = stops.map((stop) => {
  const business = bySlug.get(stop.slug) || bySlug.get(slugify(stop.name)) || byName.get(String(stop.name).toLowerCase().trim());
  if (business) matched += 1; else orphans += 1;
  categories[stop.category] = (categories[stop.category] ?? 0) + 1;
  const clues = Array.isArray(stop.clues) ? stop.clues : [];
  const old = previous.get(stop.id);
  return {
    id: stop.id,
    business_id: business?.id ?? null,
    business_slug: business?.slug ?? stop.slug ?? null,
    name: stop.name,
    /* Curated, not from the licence register — the themes select on this. */
    category: stop.category,
    /* Only for stops the business data does not carry, so the map can still place them. */
    lon: business ? undefined : stop.lon,
    lat: business ? undefined : stop.lat,
    address: stop.address ?? null,
    riddle: stop.riddle,
    clue_1: clues[0] ?? "",
    clue_2: clues[1] ?? "",
    clue_3: clues[2] ?? "",
    challenge: stop.challenge ?? "Take a proof photo at the stop.",
    difficulty: stop.difficulty ?? "medium",
    age_restricted: Boolean(stop.age_restricted),
    variant: old?.variant ?? 1,
    status: stop.status ?? "draft",
    authored_by: incoming.generated_for ?? old?.authored_by ?? "curated import",
    updated_at: now,
  };
}).map((stop) => {
  for (const key of Object.keys(stop)) if (stop[key] === undefined) delete stop[key];
  return stop;
});

/* A hunt that points at a stop the import dropped would 404 mid-walk. */
const ids = new Set(huntStops.map((stop) => stop.id));
const hunts = (data.hunts ?? []).map((hunt) => {
  const kept = hunt.stop_ids.filter((id) => ids.has(id));
  if (kept.length !== hunt.stop_ids.length) {
    console.warn(`  ! ${hunt.slug}: dropped ${hunt.stop_ids.length - kept.length} stop(s) no longer in the riddle set`);
  }
  return { ...hunt, stop_ids: kept, updated_at: now };
});

data.huntStops = huntStops;
data.hunts = hunts;
fs.writeFileSync(dataPath, `${JSON.stringify(data, null, 2)}\n`);

const spoilers = huntStops.filter((stop) => {
  const name = stop.name.toLowerCase();
  return [stop.clue_1, stop.clue_2, stop.clue_3].some((clue) => clue.toLowerCase().includes(name));
});

console.log(`Imported ${huntStops.length} stops into public/data/stroll-data.json`);
console.log(`  matched to a business record: ${matched}`);
console.log(`  kept with their own coordinates: ${orphans}`);
console.log(`  by category: ${Object.entries(categories).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(", ")}`);
console.log(`  clues that name their own answer: ${spoilers.length}`);
if (spoilers.length) console.log(`    ${spoilers.slice(0, 5).map((s) => s.id).join(", ")}`);
