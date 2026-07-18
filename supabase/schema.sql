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
