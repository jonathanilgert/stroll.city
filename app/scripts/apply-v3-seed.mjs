#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const appRoot = process.cwd();
const dataPath = path.join(appRoot, 'public/data/stroll-data.json');
const riddlesPath = process.argv[2] ?? '/mnt/c/Users/pc/OneDrive/Agents/10_Projects/stroll.city/V2/inglewood-scavenger-hunt-riddles.json';

const slugify = (input) => String(input ?? '').toLowerCase().trim().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const normAddress = (input) => String(input ?? '').toLowerCase().replace(/#/g, '').replace(/\s+/g, ' ').trim();
const close = (a, b) => Math.abs(Number(a) - Number(b)) < 0.00008;

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const riddles = JSON.parse(fs.readFileSync(riddlesPath, 'utf8'));

const byName = new Map(data.businesses.map((business) => [slugify(business.name), business]));
const byAddress = new Map(data.businesses.map((business) => [`${normAddress(business.address)}|${slugify(business.name).slice(0, 8)}`, business]));
const matched = new Set();
const unmatched = [];
const huntStops = [];
let corrections = 0;

for (const stop of riddles.stops ?? []) {
  let business = byName.get(stop.slug) ?? byName.get(slugify(stop.name));
  if (!business) business = byAddress.get(`${normAddress(stop.address)}|${slugify(stop.name).slice(0, 8)}`);
  if (!business) business = data.businesses.find((candidate) => normAddress(candidate.address) === normAddress(stop.address) && close(candidate.lon, stop.lon) && close(candidate.lat, stop.lat));
  if (!business) { unmatched.push({ id: stop.id, name: stop.name, address: stop.address }); continue; }

  matched.add(business.id);
  const priorCategory = business.category;
  business.licence_category = stop.licence_category ?? priorCategory;
  business.category = stop.category ?? priorCategory;
  business.category_corrected = Boolean(stop.category_corrected);
  business.category_note = stop.note ?? business.category_note ?? null;
  business.age_restricted = Boolean(stop.age_restricted);
  business.walk_up = stop.walk_up === false ? false : (business.walk_up ?? true);
  business.confidence = business.confidence ?? 'licence';
  business.hunt_eligible = business.walk_up !== false;
  if (business.category_corrected && priorCategory !== business.category) corrections += 1;

  huntStops.push({
    id: stop.id,
    business_id: business.id,
    business_slug: slugify(business.name),
    name: business.name,
    riddle: stop.riddle,
    clue_1: stop.clues?.[0] ?? stop.clue_1 ?? '',
    clue_2: stop.clues?.[1] ?? stop.clue_2 ?? '',
    clue_3: stop.clues?.[2] ?? stop.clue_3 ?? '',
    challenge: stop.challenge,
    difficulty: stop.difficulty ?? 'medium',
    age_restricted: Boolean(stop.age_restricted),
    variant: 1,
    status: stop.status ?? (stop.verified ? 'live' : 'draft'),
    authored_by: 'V3 riddle seed',
    updated_at: new Date().toISOString(),
  });
}

for (const business of data.businesses) {
  business.walk_up = business.walk_up ?? true;
  business.confidence = business.confidence ?? 'licence';
  business.plan_tier = business.plan_tier ?? 'free';
  business.claim_status = business.claim_status ?? 'unclaimed';
}

data.huntStops = huntStops;
data.hunts = [
  {
    id: 'inglewood-friendly-mode',
    city: 'calgary',
    neighbourhood: 'inglewood',
    slug: 'friendly-mode',
    name: 'Friendly Mode',
    blurb: 'Four stops, no clock, randomized from live Inglewood riddles.',
    stop_ids: huntStops.filter((stop) => stop.status !== 'retired' && !stop.age_restricted).slice(0, 24).map((stop) => stop.id),
    mode: 'friendly',
    audience: 'family',
    est_minutes: 35,
    distance_m: 900,
    difficulty: 'easy',
    status: 'live',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inglewood-full-hunt',
    city: 'calgary',
    neighbourhood: 'inglewood',
    slug: 'full-hunt',
    name: 'Full Hunt',
    blurb: 'Six to nine stops with Stroll Time, clue penalties, proof photos and a postcard finish.',
    stop_ids: huntStops.filter((stop) => stop.status !== 'retired').slice(0, 36).map((stop) => stop.id),
    mode: 'full',
    audience: 'family',
    est_minutes: 75,
    distance_m: 1800,
    difficulty: 'medium',
    status: 'live',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inglewood-loop-race',
    city: 'calgary',
    neighbourhood: 'inglewood',
    slug: 'loop-race',
    name: 'Scavenger Hunt Race',
    blurb: 'Same stops, rotated starts, live leaderboard. Destinations stay hidden while racing.',
    stop_ids: huntStops.filter((stop) => stop.status !== 'retired').slice(0, 18).map((stop) => stop.id),
    mode: 'race',
    audience: 'family',
    est_minutes: 60,
    distance_m: 1600,
    difficulty: 'medium',
    status: 'live',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

data.stats = { ...(data.stats ?? {}), huntStops: huntStops.length, huntSeedMatches: matched.size, huntSeedUnmatched: unmatched.length, categoryCorrectionsApplied: corrections };
data.generatedAt = new Date().toISOString();
fs.writeFileSync(dataPath, `${JSON.stringify(data, null, 2)}\n`);
console.log(JSON.stringify({ businesses: data.businesses.length, stops: (riddles.stops ?? []).length, matched: matched.size, unmatched: unmatched.length, corrections, huntStops: huntStops.length, unmatched_samples: unmatched.slice(0, 10) }, null, 2));
