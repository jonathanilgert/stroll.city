-- stroll.city Phase 2 data platform schema
-- Target: Supabase Postgres with PostGIS enabled.
-- This file intentionally contains no credentials.

create extension if not exists postgis;
create extension if not exists pgcrypto;

create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  status text not null default 'coming-soon' check (status in ('live', 'coming-soon')),
  brand_tag text,
  theme jsonb not null default '{}'::jsonb,
  center geography(point, 4326),
  strip_bounds jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.neighbourhoods (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  slug text not null,
  name text not null,
  enabled boolean not null default false,
  center geography(point, 4326),
  bounds jsonb,
  bearing numeric default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(city_id, slug)
);

create table if not exists public.businesses (
  id text primary key,
  city_id uuid not null references public.cities(id) on delete cascade,
  neighbourhood_id uuid references public.neighbourhoods(id) on delete set null,
  name text not null,
  category text not null,
  mono text,
  address text,
  blurb text,
  hours text,
  highlights jsonb not null default '[]'::jsonb,
  photo_url text,
  suggested_domain text,
  source text,
  needs_review boolean not null default true,
  claim_status text not null default 'unclaimed' check (claim_status in ('unclaimed', 'pending', 'claimed', 'rejected')),
  plan_tier text not null default 'free' check (plan_tier in ('free', 'stroll', 'stroll_plus')),
  geom geography(point, 4326) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_buildings (
  id uuid primary key default gen_random_uuid(),
  business_id text references public.businesses(id) on delete cascade,
  city_id uuid not null references public.cities(id) on delete cascade,
  roof_index integer,
  geom geometry(multipolygon, 4326) not null,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id text primary key,
  city_id uuid not null references public.cities(id) on delete cascade,
  neighbourhood_id uuid references public.neighbourhoods(id) on delete set null,
  name text not null,
  venue text,
  starts_at timestamptz,
  ends_at timestamptz,
  source text,
  emoji text,
  url text,
  geom geography(point, 4326),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attractions (
  id text primary key,
  city_id uuid not null references public.cities(id) on delete cascade,
  name text not null,
  emoji text,
  blurb text,
  url text,
  geom geography(point, 4326) not null,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_claims (
  id uuid primary key default gen_random_uuid(),
  business_id text not null references public.businesses(id) on delete cascade,
  claimant_email text not null,
  claimant_name text,
  claimant_phone text,
  business_role text,
  proof_notes text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table if not exists public.business_assets (
  id uuid primary key default gen_random_uuid(),
  business_id text not null references public.businesses(id) on delete cascade,
  claim_id uuid references public.business_claims(id) on delete set null,
  asset_kind text not null check (asset_kind in ('logo', 'photo')),
  storage_bucket text not null default 'business-assets',
  storage_path text not null,
  public_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id text not null references public.businesses(id) on delete cascade,
  claim_id uuid references public.business_claims(id) on delete set null,
  stripe_customer_id text,
  stripe_subscription_id text,
  tier text not null check (tier in ('free', 'stroll', 'stroll_plus')),
  status text not null default 'incomplete',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  key_hash text not null unique,
  city_id uuid references public.cities(id) on delete cascade,
  scopes text[] not null default array[]::text[],
  revoked boolean not null default false,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create index if not exists businesses_city_category_idx on public.businesses(city_id, category);
create index if not exists businesses_geom_gix on public.businesses using gist(geom);
create index if not exists business_buildings_geom_gix on public.business_buildings using gist(geom);
create index if not exists events_geom_gix on public.events using gist(geom);
create index if not exists attractions_geom_gix on public.attractions using gist(geom);
create index if not exists business_claims_business_idx on public.business_claims(business_id, status);
create index if not exists business_assets_business_idx on public.business_assets(business_id, asset_kind, status);
create index if not exists subscriptions_business_idx on public.subscriptions(business_id, status);

alter table public.cities enable row level security;
alter table public.neighbourhoods enable row level security;
alter table public.businesses enable row level security;
alter table public.business_buildings enable row level security;
alter table public.events enable row level security;
alter table public.attractions enable row level security;
alter table public.business_claims enable row level security;
alter table public.business_assets enable row level security;
alter table public.subscriptions enable row level security;
alter table public.api_keys enable row level security;

-- Public read policies for published map data.
do $$ begin
  create policy "public read cities" on public.cities for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public read neighbourhoods" on public.neighbourhoods for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public read businesses" on public.businesses for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public read business buildings" on public.business_buildings for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public read published events" on public.events for select using (status = 'published');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public read published attractions" on public.attractions for select using (status = 'published');
exception when duplicate_object then null; end $$;

-- Claims are write-only from the future public portal. Reads/reviews should use service role/admin UI.
do $$ begin
  create policy "public create business claims" on public.business_claims for insert with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public create pending business assets" on public.business_assets for insert with check (status = 'pending');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Scavenger hunts
-- Mirrors the runtime-overlay shape the API writes today (.stroll/runtime/<city>/
-- hunt_sessions.json), so moving to Postgres is a data copy rather than a rewrite.
-- ---------------------------------------------------------------------------
create table if not exists public.hunts (
  id text primary key,
  city_slug text not null references public.cities(slug) on delete cascade,
  neighbourhood text,
  slug text not null,
  name text not null,
  blurb text,
  mode text not null check (mode in ('friendly', 'full', 'race')),
  audience text not null default 'family' check (audience in ('family', 'adult')),
  stop_ids text[] not null default '{}',
  est_minutes int,
  distance_m int,
  difficulty text,
  status text not null default 'draft' check (status in ('draft', 'live', 'retired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (city_slug, slug)
);

create table if not exists public.hunt_stops (
  id text primary key,
  city_slug text not null references public.cities(slug) on delete cascade,
  business_id text references public.businesses(id) on delete set null,
  business_slug text,
  name text not null,
  riddle text not null,
  clue_1 text,
  clue_2 text,
  clue_3 text,
  challenge text,
  difficulty text,
  age_restricted boolean not null default false,
  variant int not null default 1,
  status text not null default 'draft' check (status in ('draft', 'live', 'retired')),
  authored_by text,
  updated_at timestamptz not null default now()
);

-- One team walking one hunt. The stop order is stored per session because races
-- rotate their start, so two sessions of the same hunt are not the same walk.
create table if not exists public.hunt_sessions (
  id text primary key,
  city_slug text not null references public.cities(slug) on delete cascade,
  hunt_id text references public.hunts(id) on delete set null,
  hunt_slug text not null,
  hunt_name text,
  mode text not null check (mode in ('friendly', 'full', 'race')),
  team_name text not null default 'Anonymous team',
  email text,
  stop_ids text[] not null default '{}',
  start_index int not null default 0,
  status text not null default 'active' check (status in ('active', 'finished', 'abandoned')),
  paid boolean not null default false,
  stripe_payment_id text,
  photos_consented boolean not null default false,
  penalty_seconds int not null default 0,
  elapsed_seconds int not null default 0,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  updated_at timestamptz not null default now()
);
create index if not exists hunt_sessions_hunt_idx on public.hunt_sessions (city_slug, hunt_slug, started_at desc);

-- Per-stop state. Unique on (session, stop): a stop appears once per walk, and the
-- row carries both the solve and the proof photo that finishes it.
create table if not exists public.hunt_session_stops (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references public.hunt_sessions(id) on delete cascade,
  stop_id text not null references public.hunt_stops(id) on delete restrict,
  position int not null default 0,
  state text not null default 'pending' check (state in ('pending', 'solved', 'skipped')),
  clues_used int not null default 0 check (clues_used between 0 and 3),
  seconds int not null default 0,
  photo_id text,
  photo_url text,
  solved_at timestamptz,
  unique (session_id, stop_id)
);

-- Append-only event log: clue reveals and solves, for analytics and for rebuilding
-- a session if the aggregate above is ever suspect.
create table if not exists public.hunt_events (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references public.hunt_sessions(id) on delete cascade,
  stop_id text,
  action text not null check (action in ('stop_solved', 'clue_revealed', 'stop_skipped', 'stop_reset', 'photo_uploaded')),
  clues_used int,
  seconds int,
  created_at timestamptz not null default now()
);
create index if not exists hunt_events_session_idx on public.hunt_events (session_id, created_at);

create table if not exists public.hunt_photos (
  id text primary key,
  session_id text not null references public.hunt_sessions(id) on delete cascade,
  stop_id text not null,
  team_name text,
  file_name text not null,
  content_type text not null,
  byte_size bigint not null,
  url text not null,
  created_at timestamptz not null default now()
);

alter table public.hunts enable row level security;
alter table public.hunt_stops enable row level security;
alter table public.hunt_sessions enable row level security;
alter table public.hunt_session_stops enable row level security;
alter table public.hunt_events enable row level security;
alter table public.hunt_photos enable row level security;

-- Live hunts are public; the riddle text is the product, so stops stay readable too.
do $$ begin
  create policy "public read live hunts" on public.hunts for select using (status = 'live');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public read live hunt stops" on public.hunt_stops for select using (status = 'live');
exception when duplicate_object then null; end $$;

-- Sessions hold a team name and an optional email, so they are not public reads.
-- The session id is the capability: the API looks a session up by id and returns
-- only that row. Service role handles everything else.
