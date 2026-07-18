#!/usr/bin/env node
/*
  Export the current Phase 1 static JSON into Supabase-ready SQL seed data.
  Usage: node scripts/export-supabase-seed.mjs
  Output: supabase/seed.sql
  No credentials are read or written by this script.
*/
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dataPath = path.join(root, 'public', 'data', 'stroll-data.json');
const outDir = path.join(root, '..', 'supabase');
const outPath = path.join(outDir, 'seed.sql');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const CITY_SLUG = 'calgary';
const CITY_NAME = 'Calgary';

function sqlString(value) {
  if (value === null || value === undefined) return 'null';
  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlJson(value) {
  return `${sqlString(JSON.stringify(value))}::jsonb`;
}

function point(lon, lat) {
  if (lon === null || lat === null || lon === undefined || lat === undefined) return 'null';
  return `st_setsrid(st_makepoint(${Number(lon)}, ${Number(lat)}), 4326)::geography`;
}

function geometryFromFeature(feature) {
  if (!feature?.geometry) return 'null';
  return `st_setsrid(st_geomfromgeojson(${sqlString(JSON.stringify(feature.geometry))}), 4326)`;
}

function businessBuildingFeatures() {
  const features = data.businessBuildings?.features ?? [];
  return features.map((feature, index) => ({ feature, index }));
}

const lines = [];
lines.push('-- Generated from app/public/data/stroll-data.json');
lines.push(`-- Generated at ${new Date().toISOString()}`);
lines.push('begin;');
lines.push('');
lines.push(`insert into public.cities (slug, name, status, center, strip_bounds, theme)
values (${sqlString(CITY_SLUG)}, ${sqlString(CITY_NAME)}, 'live', ${point(data.center[0], data.center[1])}, ${sqlJson(data.stripBounds)}, '{}'::jsonb)
on conflict (slug) do update set
  name = excluded.name,
  status = excluded.status,
  center = excluded.center,
  strip_bounds = excluded.strip_bounds,
  updated_at = now();`);
lines.push('');

for (const [sortOrder, hood] of (data.neighbourhoods ?? []).entries()) {
  lines.push(`insert into public.neighbourhoods (city_id, slug, name, enabled, center, bounds, bearing, sort_order)
select id, ${sqlString(hood.id)}, ${sqlString(hood.name)}, ${hood.enabled ? 'true' : 'false'}, ${point(hood.center?.[0], hood.center?.[1])}, ${sqlJson(hood.bounds)}, ${Number(hood.bearing ?? 0)}, ${sortOrder}
from public.cities where slug = ${sqlString(CITY_SLUG)}
on conflict (city_id, slug) do update set
  name = excluded.name,
  enabled = excluded.enabled,
  center = excluded.center,
  bounds = excluded.bounds,
  bearing = excluded.bearing,
  sort_order = excluded.sort_order,
  updated_at = now();`);
}
lines.push('');

for (const biz of data.businesses ?? []) {
  lines.push(`insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select ${sqlString(biz.id)}, id, ${sqlString(biz.name)}, ${sqlString(biz.category)}, ${sqlString(biz.mono)}, ${sqlString(biz.address)}, ${sqlString(biz.blurb)}, ${sqlString(biz.hours)}, ${sqlJson(biz.highlights ?? [])}, ${sqlString(biz.photo)}, ${sqlString(biz.domain)}, ${sqlString(biz.source)}, ${biz.needsReview ? 'true' : 'false'}, ${point(biz.lon, biz.lat)}
from public.cities where slug = ${sqlString(CITY_SLUG)}
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  mono = excluded.mono,
  address = excluded.address,
  blurb = excluded.blurb,
  hours = excluded.hours,
  highlights = excluded.highlights,
  photo_url = excluded.photo_url,
  suggested_domain = excluded.suggested_domain,
  source = excluded.source,
  needs_review = excluded.needs_review,
  geom = excluded.geom,
  updated_at = now();`);
}
lines.push('');

for (const { feature, index } of businessBuildingFeatures()) {
  const props = feature.properties ?? {};
  const businessId = props.business_id ?? props.id ?? null;
  lines.push(`insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select ${sqlString(businessId)}, id, ${Number(props.roof ?? props.roof_index ?? index)}, ${geometryFromFeature(feature)}, ${sqlJson(props)}
from public.cities where slug = ${sqlString(CITY_SLUG)};`);
}
lines.push('');

const attractions = data.attractions?.length ? data.attractions : [
  { id: 'zoo', name: 'Calgary Zoo', emoji: '🦁', lon: -114.0307, lat: 51.0457, blurb: 'A citywide discovery pin near the Bow River and Inglewood.' },
  { id: 'fort-calgary', name: 'The Confluence', emoji: '🏛️', lon: -114.0446, lat: 51.0476, blurb: 'Historic gathering place and cultural destination.' },
  { id: 'riverwalk', name: 'RiverWalk', emoji: '🚶', lon: data.center[0] - 0.006, lat: data.center[1] + 0.005, blurb: 'A friendly route for strolling into the neighbourhood.' }
];
for (const attraction of attractions) {
  lines.push(`insert into public.attractions (id, city_id, name, emoji, blurb, geom)
select ${sqlString(attraction.id)}, id, ${sqlString(attraction.name)}, ${sqlString(attraction.emoji)}, ${sqlString(attraction.blurb)}, ${point(attraction.lon, attraction.lat)}
from public.cities where slug = ${sqlString(CITY_SLUG)}
on conflict (id) do update set
  name = excluded.name,
  emoji = excluded.emoji,
  blurb = excluded.blurb,
  geom = excluded.geom,
  updated_at = now();`);
}

lines.push('');
lines.push('commit;');
lines.push('');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, lines.join('\n'));
console.log(`Wrote ${outPath}`);
console.log(`Businesses: ${(data.businesses ?? []).length}`);
console.log(`Building footprints: ${businessBuildingFeatures().length}`);
console.log(`Neighbourhoods: ${(data.neighbourhoods ?? []).length}`);
console.log(`Attractions: ${attractions.length}`);
