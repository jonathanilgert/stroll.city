-- Generated from app/public/data/stroll-data.json
-- Generated at 2026-07-18T00:47:00.639Z
begin;

insert into public.cities (slug, name, status, center, strip_bounds, theme)
values ('calgary', 'Calgary', 'live', st_setsrid(st_makepoint(-114.0358, 51.04185), 4326)::geography, '[[-114.048,51.0386],[-114.0238,51.0455]]'::jsonb, '{}'::jsonb)
on conflict (slug) do update set
  name = excluded.name,
  status = excluded.status,
  center = excluded.center,
  strip_bounds = excluded.strip_bounds,
  updated_at = now();

insert into public.neighbourhoods (city_id, slug, name, enabled, center, bounds, bearing, sort_order)
select id, 'inglewood', 'Inglewood / 9 Ave SE', true, st_setsrid(st_makepoint(-114.0358, 51.04185), 4326)::geography, '[[-114.048,51.0386],[-114.0238,51.0455]]'::jsonb, -25, 0
from public.cities where slug = 'calgary'
on conflict (city_id, slug) do update set
  name = excluded.name,
  enabled = excluded.enabled,
  center = excluded.center,
  bounds = excluded.bounds,
  bearing = excluded.bearing,
  sort_order = excluded.sort_order,
  updated_at = now();
insert into public.neighbourhoods (city_id, slug, name, enabled, center, bounds, bearing, sort_order)
select id, 'kensington', 'Kensington', false, st_setsrid(st_makepoint(-114.0853, 51.0535), 4326)::geography, '[[-114.095,51.049],[-114.074,51.058]]'::jsonb, -18, 1
from public.cities where slug = 'calgary'
on conflict (city_id, slug) do update set
  name = excluded.name,
  enabled = excluded.enabled,
  center = excluded.center,
  bounds = excluded.bounds,
  bearing = excluded.bearing,
  sort_order = excluded.sort_order,
  updated_at = now();
insert into public.neighbourhoods (city_id, slug, name, enabled, center, bounds, bearing, sort_order)
select id, 'seventeenth', '17th Ave SW', false, st_setsrid(st_makepoint(-114.087, 51.037), 4326)::geography, '[[-114.112,51.033],[-114.06,51.041]]'::jsonb, -5, 2
from public.cities where slug = 'calgary'
on conflict (city_id, slug) do update set
  name = excluded.name,
  enabled = excluded.enabled,
  center = excluded.center,
  bounds = excluded.bounds,
  bearing = excluded.bearing,
  sort_order = excluded.sort_order,
  updated_at = now();
insert into public.neighbourhoods (city_id, slug, name, enabled, center, bounds, bearing, sort_order)
select id, 'marda', 'Marda Loop', false, st_setsrid(st_makepoint(-114.115, 51.023), 4326)::geography, '[[-114.128,51.018],[-114.104,51.028]]'::jsonb, -25, 3
from public.cities where slug = 'calgary'
on conflict (city_id, slug) do update set
  name = excluded.name,
  enabled = excluded.enabled,
  center = excluded.center,
  bounds = excluded.bounds,
  bearing = excluded.bearing,
  sort_order = excluded.sort_order,
  updated_at = now();
insert into public.neighbourhoods (city_id, slug, name, enabled, center, bounds, bearing, sort_order)
select id, 'bridgeland', 'Bridgeland', false, st_setsrid(st_makepoint(-114.041, 51.052), 4326)::geography, '[[-114.052,51.047],[-114.028,51.058]]'::jsonb, -18, 4
from public.cities where slug = 'calgary'
on conflict (city_id, slug) do update set
  name = excluded.name,
  enabled = excluded.enabled,
  center = excluded.center,
  bounds = excluded.bounds,
  bearing = excluded.bearing,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '29a2af05451c', id, 'Next Level Thrift Store', 'shop', 'NL', '1045 19 Av Se', 'Next Level Thrift Store — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc49/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.037086, 51.036027), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '5a31d972b821', id, 'Vigi''s Hair', 'services', 'VH', '1044 19 Av Se', 'Vigi''s Hair — local service on 9 Ave SE in Inglewood.', '9am–6pm', '[["💈","By appointment"],["✨","Local pros"],["📍","On 9 Ave"]]'::jsonb, 'https://picsum.photos/seed/strollyyc948/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.037202, 51.03637), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'af19fb9c1ea2', id, 'Bioi', 'shop', 'B', '1226A 9 Av Se', 'Bioi — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc730/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.035072, 51.041821), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '6eaa141841dc', id, 'Rain Dog Bar', 'bar', 'RD', '1214B 9 Av Se', 'Rain Dog Bar — bar on 9 Ave SE in Inglewood.', '12pm–12am', '[["🍺","Local pours"],["🎶","Good vibes"],["🍔","Bar bites"]]'::jsonb, 'https://picsum.photos/seed/strollyyc321/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.03589, 51.042021), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '9df18e70bdc2', id, 'Fair''s Fair (For Book Lovers)', 'shop', 'FF', '#L 907 9 Av Se', 'Beloved sprawling used & rare bookstore.', '10am–6pm', '[["📚","Stacks of used books"],["🔎","Rare finds"],["🛋️","Cozy nooks"]]'::jsonb, 'https://picsum.photos/seed/strollyyc610/520/340', 'fairsfairbooks.com', 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.041176, 51.043048), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '233bf3afee12', id, 'Tuu Shop', 'shop', 'TS', '#103 902 9 Av Se', 'Tuu Shop — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc437/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.04096, 51.043347), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '6d69b904c020', id, 'Two Wheel View', 'shop', 'TW', '#M 907 9 Av Se', 'Two Wheel View — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc435/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.041176, 51.043048), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '88699a0736e7', id, 'Sweet Treats Co.', 'restaurant', 'ST', '1109 9 Av Se', 'Sweet Treats Co. — restaurant on 9 Ave SE in Inglewood.', '11am–10pm', '[["🍴","Local kitchen"],["🪑","Dine-in"],["📍","On the strip"]]'::jsonb, 'https://picsum.photos/seed/strollyyc931/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.037617, 51.042193), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '236192258ad8', id, 'Next Page (The)', 'restaurant', 'NP', '1217A 9 Av Se', 'Next Page (The) — restaurant on 9 Ave SE in Inglewood.', '11am–10pm', '[["🍴","Local kitchen"],["🪑","Dine-in"],["📍","On the strip"]]'::jsonb, 'https://picsum.photos/seed/strollyyc187/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.035816, 51.041581), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '94a0baf17bed', id, 'Lasa By Cara', 'restaurant', 'LB', '1117 9 Av Se', 'Lasa By Cara — restaurant on 9 Ave SE in Inglewood.', '11am–10pm', '[["🍴","Local kitchen"],["🪑","Dine-in"],["📍","On the strip"]]'::jsonb, 'https://picsum.photos/seed/strollyyc653/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.037465, 51.042154), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '16e779e13027', id, 'Faire Living Group', 'shop', 'FL', '1226B 9 Av Se', 'Beloved sprawling used & rare bookstore.', '10am–6pm', '[["📚","Stacks of used books"],["🔎","Rare finds"],["🛋️","Cozy nooks"]]'::jsonb, 'https://picsum.photos/seed/strollyyc782/520/340', 'fairsfairbooks.com', 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.035072, 51.041821), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '2412ea4b78e2', id, 'Oxgust Studio', 'services', 'OS', '915 9 Av Se', 'Oxgust Studio — local service on 9 Ave SE in Inglewood.', '9am–6pm', '[["💈","By appointment"],["✨","Local pros"],["📍","On 9 Ave"]]'::jsonb, 'https://picsum.photos/seed/strollyyc190/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.040472, 51.042874), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'd2605e8f6fc3', id, 'Oolong Tea House', 'cafe', 'OT', '1219A 9 Av Se', 'Oolong Tea House — cafe on 9 Ave SE in Inglewood.', '8am–6pm', '[["☕","Coffee & treats"],["🥐","Fresh baking"],["🪟","Cosy room"]]'::jsonb, 'https://picsum.photos/seed/strollyyc429/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.035816, 51.041581), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '687822f20e5a', id, 'Apothecary In Inglewood (The)', 'restaurant', 'AI', '921 9 Av Se', 'Apothecary In Inglewood (The) — restaurant on 9 Ave SE in Inglewood.', '11am–10pm', '[["🍴","Local kitchen"],["🪑","Dine-in"],["📍","On the strip"]]'::jsonb, 'https://picsum.photos/seed/strollyyc541/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.040041, 51.042799), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '1716d99864a3', id, 'The Confluence Historic Site & Parkland', 'restaurant', 'TC', '750 9 Av Se', 'The Confluence Historic Site & Parkland — restaurant on 9 Ave SE in Inglewood.', '11am–10pm', '[["🍴","Local kitchen"],["🪑","Dine-in"],["📍","On the strip"]]'::jsonb, 'https://picsum.photos/seed/strollyyc535/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.04449, 51.045031), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '62d69f5ce2cd', id, 'Lily By Lyla', 'shop', 'LB', '1221 9 Av Se', 'Lily By Lyla — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc86/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.035456, 51.041515), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'f694ae890130', id, 'Master Of None Studios', 'services', 'MO', '915 9 Av Se', 'Master Of None Studios — local service on 9 Ave SE in Inglewood.', '9am–6pm', '[["💈","By appointment"],["✨","Local pros"],["📍","On 9 Ave"]]'::jsonb, 'https://picsum.photos/seed/strollyyc858/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.040472, 51.042874), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '4f84e76c32c7', id, 'Opulence Piercing', 'services', 'OP', '1105 9 Av Se', 'Opulence Piercing — local service on 9 Ave SE in Inglewood.', '9am–6pm', '[["💈","By appointment"],["✨","Local pros"],["📍","On 9 Ave"]]'::jsonb, 'https://picsum.photos/seed/strollyyc219/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.037715, 51.042216), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '45932e0c84d0', id, 'Gallery Underground', 'gallery', 'GU', '#10 917 9 Av Se', 'Gallery Underground — gallery on 9 Ave SE in Inglewood.', '11am–5pm', '[["🎨","Art & culture"],["🆓","Drop in"],["🖼️","Local makers"]]'::jsonb, 'https://picsum.photos/seed/strollyyc443/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.040356, 51.042799), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '841028781fc1', id, 'Madison''s 12|12', 'restaurant', 'M1', '1212 9 Av Se', 'Madison''s 12|12 — restaurant on 9 Ave SE in Inglewood.', '11am–10pm', '[["🍴","Local kitchen"],["🪑","Dine-in"],["📍","On the strip"]]'::jsonb, 'https://picsum.photos/seed/strollyyc102/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.03591, 51.042165), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '74588358da7f', id, 'Adorn Boutique', 'shop', 'AB', '1216A 9 Av Se', 'Adorn Boutique — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc518/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.035732, 51.042014), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '5bc4c633989f', id, 'Domino''s', 'restaurant', 'D', '1220 9 Av Se', 'Domino''s — restaurant on 9 Ave SE in Inglewood.', '11am–10pm', '[["🍴","Local kitchen"],["🪑","Dine-in"],["📍","On the strip"]]'::jsonb, 'https://picsum.photos/seed/strollyyc523/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.03541, 51.041948), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'ca50b22119a9', id, 'Curated Home (The)', 'shop', 'CH', '1004 9 Av Se', 'Curated Home (The) — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc13/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.038889, 51.042935), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '916108d117d0', id, 'Pronto Pizza', 'restaurant', 'PP', '#2 1139 9 Av Se', 'Pronto Pizza — restaurant on 9 Ave SE in Inglewood.', '11am–10pm', '[["🍴","Local kitchen"],["🪑","Dine-in"],["📍","On the strip"]]'::jsonb, 'https://picsum.photos/seed/strollyyc15/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.037175, 51.041916), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'c508b8125dfe', id, 'Stash', 'shop', 'S', '1237 9 Av Se', 'Stash — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc440/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.034759, 51.041201), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'aa668db97c13', id, 'Murphy''s Mid-Century', 'shop', 'MM', '1221B 9 Av Se', 'Murphy''s Mid-Century — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc409/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.035456, 51.041515), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '2fa2d989f7e9', id, 'Dragon Pearl', 'restaurant', 'DP', '1223A 9 Av Se', 'Dragon Pearl — restaurant on 9 Ave SE in Inglewood.', '11am–10pm', '[["🍴","Local kitchen"],["🪑","Dine-in"],["📍","On the strip"]]'::jsonb, 'https://picsum.photos/seed/strollyyc291/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.035311, 51.041408), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '46cf2dc3cfe4', id, 'Gravity Espresso And Wine Bar', 'bar', 'GE', '909 10 St Se', 'Espresso & wine bar, a Music Mile staple.', '7am–10pm', '[["☕","Serious espresso"],["🍷","Evening wine"],["🥪","Café lunch"]]'::jsonb, 'https://picsum.photos/seed/strollyyc126/520/340', 'gravityespresso.com', 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.038195, 51.042303), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '09c9fd233081', id, 'Deane House', 'restaurant', 'DH', '806 9 Av Se', 'Historic riverside restaurant in a 1906 home.', '10am–10pm', '[["🏛️","1906 heritage house"],["🍽️","Seasonal menu"],["🌉","By the Bow"]]'::jsonb, 'https://picsum.photos/seed/strollyyc795/520/340', 'deanehouse.com', 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.042039, 51.043787), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '35c1f13079a4', id, 'Inglewood Pizza & Pasta', 'restaurant', 'IP', '1225A 9 Av Se', 'Inglewood Pizza & Pasta — restaurant on 9 Ave SE in Inglewood.', '11am–10pm', '[["🍴","Local kitchen"],["🪑","Dine-in"],["📍","On the strip"]]'::jsonb, 'https://picsum.photos/seed/strollyyc101/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.035195, 51.041356), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'e3e6dc5ee309', id, 'Bussin', 'restaurant', 'B', '1121 9 Av Se', 'Bussin — restaurant on 9 Ave SE in Inglewood.', '11am–10pm', '[["🍴","Local kitchen"],["🪑","Dine-in"],["📍","On the strip"]]'::jsonb, 'https://picsum.photos/seed/strollyyc324/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.037387, 51.042136), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '55392d8d40b5', id, 'Kups', 'restaurant', 'K', '#108 1020 9 Av Se', 'Kups — restaurant on 9 Ave SE in Inglewood.', '11am–10pm', '[["🍴","Local kitchen"],["🪑","Dine-in"],["📍","On the strip"]]'::jsonb, 'https://picsum.photos/seed/strollyyc231/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.037981, 51.042706), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '4e8f371b021c', id, 'F45 Inglewood', 'services', 'FI', '#130 1020 9 Av Se', 'F45 Inglewood — local service on 9 Ave SE in Inglewood.', '9am–6pm', '[["💈","By appointment"],["✨","Local pros"],["📍","On 9 Ave"]]'::jsonb, 'https://picsum.photos/seed/strollyyc594/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.037521, 51.042692), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'b8e8d0fd2d3a', id, 'Sot', 'restaurant', 'S', '1216C 9 Av Se', 'Sot — restaurant on 9 Ave SE in Inglewood.', '11am–10pm', '[["🍴","Local kitchen"],["🪑","Dine-in"],["📍","On the strip"]]'::jsonb, 'https://picsum.photos/seed/strollyyc646/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.035732, 51.042014), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'a530ce1bb27e', id, 'Marshall Drugs', 'restaurant', 'MD', '1231 9 Av Se', 'Marshall Drugs — restaurant on 9 Ave SE in Inglewood.', '11am–10pm', '[["🍴","Local kitchen"],["🪑","Dine-in"],["📍","On the strip"]]'::jsonb, 'https://picsum.photos/seed/strollyyc88/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.034759, 51.041201), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'd19aba1a4eb6', id, 'Limitless Calgary', 'shop', 'LC', '1015 9 Av Se', 'Limitless Calgary — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc625/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.038542, 51.042474), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '1d1c8a07d95a', id, 'Hello Vintage Inglewood', 'shop', 'HV', '1228A 9 Av Se', 'Hello Vintage Inglewood — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc332/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.035049, 51.041697), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '771bbaecb1e6', id, 'Linas Italian Piazza', 'restaurant', 'LI', '1023 9 Av Se', 'Linas Italian Piazza — restaurant on 9 Ave SE in Inglewood.', '11am–10pm', '[["🍴","Local kitchen"],["🪑","Dine-in"],["📍","On the strip"]]'::jsonb, 'https://picsum.photos/seed/strollyyc599/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.038172, 51.042378), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '524c489f3b72', id, 'Mowgli''s/Ninja Tiger', 'restaurant', 'MT', '1209 9 Av Se', 'Mowgli''s/Ninja Tiger — restaurant on 9 Ave SE in Inglewood.', '11am–10pm', '[["🍴","Local kitchen"],["🪑","Dine-in"],["📍","On the strip"]]'::jsonb, 'https://picsum.photos/seed/strollyyc383/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.036285, 51.041732), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '2aaca500ccf5', id, 'Eden (The)', 'restaurant', 'E', '1219 9 Av Se', 'Eden (The) — restaurant on 9 Ave SE in Inglewood.', '11am–10pm', '[["🍴","Local kitchen"],["🪑","Dine-in"],["📍","On the strip"]]'::jsonb, 'https://picsum.photos/seed/strollyyc111/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.035816, 51.041581), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '21744966d801', id, 'Potion Room', 'restaurant', 'PR', '1211 9 Av Se', 'Potion Room — restaurant on 9 Ave SE in Inglewood.', '11am–10pm', '[["🍴","Local kitchen"],["🪑","Dine-in"],["📍","On the strip"]]'::jsonb, 'https://picsum.photos/seed/strollyyc96/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.0361, 51.041679), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '8aa03ffcf4d9', id, 'Espy', 'shop', 'E', '1009 9 Av Se', 'Espy — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc109/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.038963, 51.04258), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '0d0ecc0fa057', id, 'Genuine Design', 'shop', 'GD', '1213 9 Av Se', 'Genuine Design — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc725/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.0361, 51.041679), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'c1d8eab13593', id, 'Ari Sushi', 'restaurant', 'AS', '1201 9 Av Se', 'Ari Sushi — restaurant on 9 Ave SE in Inglewood.', '11am–10pm', '[["🍴","Local kitchen"],["🪑","Dine-in"],["📍","On the strip"]]'::jsonb, 'https://picsum.photos/seed/strollyyc733/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.036462, 51.04178), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'eede4681c3bf', id, 'Calgary Car Centre / Driving With Carmelo', 'shop', 'CC', '1234 9 Av Se', 'Calgary Car Centre / Driving With Carmelo — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc292/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.034763, 51.04163), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '1fa848cefc45', id, 'Purr', 'shop', 'P', '1227 9 Av Se', 'Purr — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc288/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.035088, 51.041292), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'a90455765ddf', id, 'Burn Block Social Club', 'bar', 'BB', '1217B 9 Av Se', 'Burn Block Social Club — bar on 9 Ave SE in Inglewood.', '12pm–12am', '[["🍺","Local pours"],["🎶","Good vibes"],["🍔","Bar bites"]]'::jsonb, 'https://picsum.photos/seed/strollyyc244/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.035816, 51.041581), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '84d5b791561e', id, 'Worn Studio', 'services', 'WS', '915 9 Av Se', 'Worn Studio — local service on 9 Ave SE in Inglewood.', '9am–6pm', '[["💈","By appointment"],["✨","Local pros"],["📍","On 9 Ave"]]'::jsonb, 'https://picsum.photos/seed/strollyyc0/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.040472, 51.042874), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '570104f90205', id, 'Lemonceillo Home', 'shop', 'LH', '1223B 9 Av Se', 'Lemonceillo Home — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc870/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.035311, 51.041408), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '37ed1bddcb49', id, 'Junction 9 Wellbeing', 'services', 'J9', '#100 919 9 Av Se', 'Junction 9 Wellbeing — local service on 9 Ave SE in Inglewood.', '9am–6pm', '[["💈","By appointment"],["✨","Local pros"],["📍","On 9 Ave"]]'::jsonb, 'https://picsum.photos/seed/strollyyc407/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.040195, 51.042799), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '97fdf6fcf0b3', id, 'Hose & Hound Pub', 'bar', 'H', '1030 9 Av Se', 'Pub grub & craft brews in a 1906 fire hall.', '11am–12am', '[["🚒","Historic firehall"],["🍺","24 taps"],["🍔","Late kitchen"]]'::jsonb, 'https://picsum.photos/seed/strollyyc784/520/340', 'hoseandhound.ca', 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.037176, 51.042654), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '0df04872d129', id, 'Analog', 'restaurant', 'A', '#1 1139 9 Av Se', 'Analog — restaurant on 9 Ave SE in Inglewood.', '11am–10pm', '[["🍴","Local kitchen"],["🪑","Dine-in"],["📍","On the strip"]]'::jsonb, 'https://picsum.photos/seed/strollyyc168/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.037175, 51.041916), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '2dd4b6846c10', id, 'Ouijablonde Hair Studio', 'services', 'OH', '915 9 Av Se', 'Ouijablonde Hair Studio — local service on 9 Ave SE in Inglewood.', '9am–6pm', '[["💈","By appointment"],["✨","Local pros"],["📍","On 9 Ave"]]'::jsonb, 'https://picsum.photos/seed/strollyyc150/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.040472, 51.042874), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'a39de405c769', id, 'Recordland', 'shop', 'R', '1208 9 Av Se', 'Recordland — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc711/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.0361, 51.0422), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'a7a9fba12b4b', id, 'Boft Fine Rugs Gallery', 'gallery', 'BF', '1225B 9 Av Se', 'Boft Fine Rugs Gallery — gallery on 9 Ave SE in Inglewood.', '11am–5pm', '[["🎨","Art & culture"],["🆓","Drop in"],["🖼️","Local makers"]]'::jsonb, 'https://picsum.photos/seed/strollyyc958/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.035195, 51.041356), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '4574605e3680', id, 'Evi Beauty', 'services', 'EB', '1010 9 Av Se', 'Evi Beauty — local service on 9 Ave SE in Inglewood.', '9am–6pm', '[["💈","By appointment"],["✨","Local pros"],["📍","On 9 Ave"]]'::jsonb, 'https://picsum.photos/seed/strollyyc182/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.038573, 51.042859), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '5089a6babc37', id, 'Mumbai Bites- Progressive Indian Cuisine', 'restaurant', 'MB', '1214C 9 Av Se', 'Mumbai Bites- Progressive Indian Cuisine — restaurant on 9 Ave SE in Inglewood.', '11am–10pm', '[["🍴","Local kitchen"],["🪑","Dine-in"],["📍","On the strip"]]'::jsonb, 'https://picsum.photos/seed/strollyyc829/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.03589, 51.042021), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'd161032761c5', id, 'Marshall''s Rx Centre', 'shop', 'MR', '#214 1231 9 Av Se', 'Marshall''s Rx Centre — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc624/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.034759, 51.041201), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '4bea70511cd8', id, '4Cats', 'shop', '4', '1218B 9 Av Se', '4Cats — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc306/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.035568, 51.042007), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '67083be6ccc2', id, 'Onyx & Ivory Salon', 'services', 'O', '#116 1020 9 Av Se', 'Onyx & Ivory Salon — local service on 9 Ave SE in Inglewood.', '9am–6pm', '[["💈","By appointment"],["✨","Local pros"],["📍","On 9 Ave"]]'::jsonb, 'https://picsum.photos/seed/strollyyc109/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.037818, 51.042676), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '5007e41b4194', id, 'Ironwood Stage And Grill', 'restaurant', 'IS', '1229 9 Av Se', 'Beloved live-music venue & grill on Music Mile.', 'Shows nightly', '[["🎸","Live roots & folk"],["🍔","Pre-show grill"],["🎶","Music Mile"]]'::jsonb, 'https://picsum.photos/seed/strollyyc147/520/340', 'ironwoodstage.ca', 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.035005, 51.041206), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '797848edd816', id, 'Patisseries Louise', 'restaurant', 'PL', '1002 9 Av Se', 'Patisseries Louise — restaurant on 9 Ave SE in Inglewood.', '11am–10pm', '[["🍴","Local kitchen"],["🪑","Dine-in"],["📍","On the strip"]]'::jsonb, 'https://picsum.photos/seed/strollyyc638/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.039048, 51.042969), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '54c3547cc3d7', id, 'Wymbin', 'services', 'W', '#50 919 9 Av Se', 'Wymbin — local service on 9 Ave SE in Inglewood.', '9am–6pm', '[["💈","By appointment"],["✨","Local pros"],["📍","On 9 Ave"]]'::jsonb, 'https://picsum.photos/seed/strollyyc744/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.040195, 51.042799), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'cab5f9ab3488', id, 'Artesano Galleria', 'gallery', 'AG', '#B 1215 9 Av Se', 'Artesano Galleria — gallery on 9 Ave SE in Inglewood.', '11am–5pm', '[["🎨","Art & culture"],["🆓","Drop in"],["🖼️","Local makers"]]'::jsonb, 'https://picsum.photos/seed/strollyyc765/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.035816, 51.041581), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '487a3fcc7b5d', id, 'Be Brave', 'shop', 'BB', '1018 9 Av Se', 'Be Brave — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc180/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.038269, 51.042773), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'f042b4218d69', id, 'Esker Foundation', 'gallery', 'EF', '#444 1011 9 Av Se', 'Free contemporary art gallery in a converted warehouse.', '11–6, closed Mon', '[["🖼️","Rotating exhibitions"],["🆓","Always free"],["🏛️","Rooftop terrace"]]'::jsonb, 'https://picsum.photos/seed/strollyyc742/520/340', 'eskerfoundation.art', 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.038782, 51.042347), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '75154b1f16b5', id, 'Brooklyn Dumplings Shop', 'restaurant', 'BD', '1113 9 Av Se', 'Brooklyn Dumplings Shop — restaurant on 9 Ave SE in Inglewood.', '11am–10pm', '[["🍴","Local kitchen"],["🪑","Dine-in"],["📍","On the strip"]]'::jsonb, 'https://picsum.photos/seed/strollyyc892/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.037541, 51.04217), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'c1beb8d914b3', id, 'Bored Brewing Company (The)', 'bar', 'BB', '#200 1212 9 Av Se', 'Bored Brewing Company (The) — bar on 9 Ave SE in Inglewood.', '12pm–12am', '[["🍺","Local pours"],["🎶","Good vibes"],["🍔","Bar bites"]]'::jsonb, 'https://picsum.photos/seed/strollyyc344/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.03591, 51.042165), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'e38de7ec7f73', id, 'Smithbilt Hats', 'shop', 'SH', '914 11 St Se', 'Makers of the iconic white Stampede hat since 1919.', '9am–5pm', '[["🤠","Custom felt hats"],["🏭","Working factory"],["⭐","Calgary icon"]]'::jsonb, 'https://picsum.photos/seed/strollyyc790/520/340', 'smithbilthats.com', 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.036581, 51.041345), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '277cf40085c3', id, 'T2722 Luxury Barista Experience', 'bar', 'TL', '1002 9 Av Se', 'T2722 Luxury Barista Experience — bar on 9 Ave SE in Inglewood.', '12pm–12am', '[["🍺","Local pours"],["🎶","Good vibes"],["🍔","Bar bites"]]'::jsonb, 'https://picsum.photos/seed/strollyyc838/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.039048, 51.042969), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'd01c631dc549', id, 'Leo Boutique', 'shop', 'LB', '1006 9 Av Se', 'Leo Boutique — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc844/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.038784, 51.042909), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '2a4e53351036', id, 'Untitled Esthetics Studio', 'services', 'UE', '#105 917 9 Av Se', 'Untitled Esthetics Studio — local service on 9 Ave SE in Inglewood.', '9am–6pm', '[["💈","By appointment"],["✨","Local pros"],["📍","On 9 Ave"]]'::jsonb, 'https://picsum.photos/seed/strollyyc34/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.040356, 51.042799), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '8ea5cf5900dd', id, 'Inglewood Oak & Vine', 'shop', 'IO', '1139 9 Av Se', 'Inglewood Oak & Vine — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc471/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.037114, 51.04217), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'fcc6c0f13afd', id, 'Made By Marcus', 'restaurant', 'MB', '1119 10 Av Se', 'Small-batch ice cream in wild local flavours.', '12–10pm', '[["🍦","Rotating flavours"],["🌾","Honey & haskap"],["🧇","Waffle cones"]]'::jsonb, 'https://picsum.photos/seed/strollyyc531/520/340', 'madebymarcus.ca', 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.037694, 51.04134), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '6091b65fad46', id, 'Doughnut Party', 'restaurant', 'DP', '1125 9 Av Se', 'Doughnut Party — restaurant on 9 Ave SE in Inglewood.', '11am–10pm', '[["🍴","Local kitchen"],["🪑","Dine-in"],["📍","On the strip"]]'::jsonb, 'https://picsum.photos/seed/strollyyc928/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.037481, 51.042016), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'b2c3851f5ef3', id, 'Respect Eyecare', 'shop', 'RE', '#112 1020 9 Av Se', 'Respect Eyecare — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc602/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.037912, 51.042689), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'a9233a05bb50', id, 'Peacock Boutique Consignment', 'shop', 'PB', '1218 9 Av Se', 'Peacock Boutique Consignment — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc803/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.035691, 51.041916), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'e670bbb1664a', id, 'North Hill Aesthetics', 'services', 'NH', '#2 1922 9 Av Se', 'North Hill Aesthetics — local service on 9 Ave SE in Inglewood.', '9am–6pm', '[["💈","By appointment"],["✨","Local pros"],["📍","On 9 Ave"]]'::jsonb, 'https://picsum.photos/seed/strollyyc849/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.018757, 51.035216), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '57e13aa3304f', id, 'Flawless Clinical Aesthetics And Medical Services', 'services', 'FC', '#12 1922 9 Av Se', 'Flawless Clinical Aesthetics And Medical Services — local service on 9 Ave SE in Inglewood.', '9am–6pm', '[["💈","By appointment"],["✨","Local pros"],["📍","On 9 Ave"]]'::jsonb, 'https://picsum.photos/seed/strollyyc101/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.018256, 51.035058), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'b8513e84792b', id, 'Cober West', 'shop', 'CW', '#200 1601 9 Av Se', 'Cober West — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc324/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.024466, 51.037113), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'a09b61e46e3c', id, 'Blackfoot Diner', 'restaurant', 'BD', '#A 1840 9 Av Se', 'Blackfoot Diner — restaurant on 9 Ave SE in Inglewood.', '11am–10pm', '[["🍴","Local kitchen"],["🪑","Dine-in"],["📍","On the strip"]]'::jsonb, 'https://picsum.photos/seed/strollyyc20/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.020299, 51.036468), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'b77ff12c0cbc', id, 'West Canadian Digital Imaging', 'shop', 'WC', '1601 9 Av Se', 'West Canadian Digital Imaging — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc923/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.024466, 51.037113), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '5ca23bc3bd63', id, 'Theralleve', 'shop', 'T', '#3 1922 9 Av Se', 'Theralleve — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc476/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.018814, 51.035168), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '88f3e13a9794', id, 'Lou''s Autobody', 'shop', 'LA', '1801 9 Av Se', 'Lou''s Autobody — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc300/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.021798, 51.035808), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'ac50e17bd637', id, 'Petro Canada Truck Stop', 'restaurant', 'PC', '1840 9 Av Se', 'Petro Canada Truck Stop — restaurant on 9 Ave SE in Inglewood.', '11am–10pm', '[["🍴","Local kitchen"],["🪑","Dine-in"],["📍","On the strip"]]'::jsonb, 'https://picsum.photos/seed/strollyyc406/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.020299, 51.036468), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'b8bc81a1b121', id, 'Jfit + Restore', 'services', 'J', '#3 1922 9 Av Se', 'Jfit + Restore — local service on 9 Ave SE in Inglewood.', '9am–6pm', '[["💈","By appointment"],["✨","Local pros"],["📍","On 9 Ave"]]'::jsonb, 'https://picsum.photos/seed/strollyyc744/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.018814, 51.035168), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'e7334a0455b6', id, 'Hd Motors', 'shop', 'HM', '1817 9 Av Se', 'Hd Motors — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc60/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.021029, 51.035713), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'fa9f4171431d', id, 'King Eddy Live Music', 'restaurant', 'KE', '438 9 Av Se', 'King Eddy Live Music — restaurant on 9 Ave SE in Inglewood.', '11am–10pm', '[["🍴","Local kitchen"],["🪑","Dine-in"],["📍","On the strip"]]'::jsonb, 'https://picsum.photos/seed/strollyyc65/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.053495, 51.044519), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '4c1fe4126426', id, 'Salvation Army (The)', 'services', 'SA', '420 9 Av Se', 'Salvation Army (The) — local service on 9 Ave SE in Inglewood.', '9am–6pm', '[["💈","By appointment"],["✨","Local pros"],["📍","On 9 Ave"]]'::jsonb, 'https://picsum.photos/seed/strollyyc454/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.054307, 51.044628), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'f0fcbbc515c4', id, 'Prep Doctors', 'shop', 'PD', '518 9 Av Se', 'Prep Doctors — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc402/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.052187, 51.044565), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '5c368a88b70e', id, '11-Eleven Liquor', 'shop', '1L', '1402 9 Av Se', '11-Eleven Liquor — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc80/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.031172, 51.040205), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '807072a32dc5', id, 'Delicious From Colombia', 'restaurant', 'DF', '1314B 9 Av Se', 'Delicious From Colombia — restaurant on 9 Ave SE in Inglewood.', '11am–10pm', '[["🍴","Local kitchen"],["🪑","Dine-in"],["📍","On the strip"]]'::jsonb, 'https://picsum.photos/seed/strollyyc52/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.033266, 51.041055), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'cc8c3794c49e', id, 'Theycallme.V', 'services', 'T', '1530 9 Av Se', 'Theycallme.V — local service on 9 Ave SE in Inglewood.', '9am–6pm', '[["💈","By appointment"],["✨","Local pros"],["📍","On 9 Ave"]]'::jsonb, 'https://picsum.photos/seed/strollyyc301/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.026906, 51.038632), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '6ec656d11313', id, 'Rosso Coffee Roasters Inglewood', 'cafe', 'RC', '1400 9 Av Se', 'Industrial-chic roastery & flagship café.', '7am–6pm', '[["☕","House-roasted"],["🪵","Communal tables"],["🥐","Fresh pastries"]]'::jsonb, 'https://picsum.photos/seed/strollyyc714/520/340', 'rossocoffee.com', 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.031278, 51.040253), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'f50eef980e1b', id, 'Minh Chau Vietnamese Restaurant', 'restaurant', 'MC', '1318 9 Av Se', 'Minh Chau Vietnamese Restaurant — restaurant on 9 Ave SE in Inglewood.', '11am–10pm', '[["🍴","Local kitchen"],["🪑","Dine-in"],["📍","On the strip"]]'::jsonb, 'https://picsum.photos/seed/strollyyc656/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.033024, 51.0409), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'f3be6109ae01', id, 'Collector''s Gallery (The)', 'gallery', 'CG', '1332A 9 Av Se', 'Collector''s Gallery (The) — gallery on 9 Ave SE in Inglewood.', '11am–5pm', '[["🎨","Art & culture"],["🆓","Drop in"],["🖼️","Local makers"]]'::jsonb, 'https://picsum.photos/seed/strollyyc519/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.032172, 51.040653), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '4ff6ccc46bc6', id, 'Monki Breakfast Club & Bistro', 'restaurant', 'MB', '#4 1420 9 Av Se', 'Monki Breakfast Club & Bistro — restaurant on 9 Ave SE in Inglewood.', '11am–10pm', '[["🍴","Local kitchen"],["🪑","Dine-in"],["📍","On the strip"]]'::jsonb, 'https://picsum.photos/seed/strollyyc565/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.030393, 51.03991), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '4b6002b0a66d', id, 'That Old Retro Store', 'shop', 'TO', '1314A 9 Av Se', 'That Old Retro Store — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc370/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.033338, 51.041084), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'e22ed6114477', id, 'Twitchin Threadz & Company', 'shop', 'TT', '#2 1335 9 Av Se', 'Twitchin Threadz & Company — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc939/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.032321, 51.040352), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'b1d63fca1b08', id, 'Tupi Acai Bowls', 'restaurant', 'TA', '1414 9 Av Se', 'Tupi Acai Bowls — restaurant on 9 Ave SE in Inglewood.', '11am–10pm', '[["🍴","Local kitchen"],["🪑","Dine-in"],["📍","On the strip"]]'::jsonb, 'https://picsum.photos/seed/strollyyc468/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.030698, 51.040026), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '1af4eb6bb2fd', id, 'Kultura Massage Wellness', 'services', 'KM', '1528 9 Av Se', 'Kultura Massage Wellness — local service on 9 Ave SE in Inglewood.', '9am–6pm', '[["💈","By appointment"],["✨","Local pros"],["📍","On 9 Ave"]]'::jsonb, 'https://picsum.photos/seed/strollyyc935/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.027023, 51.038677), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '070d5959d97d', id, 'Boss Tattoos Walk - In Studio', 'services', 'BT', '1331 9 Av Se', 'Boss Tattoos Walk - In Studio — local service on 9 Ave SE in Inglewood.', '9am–6pm', '[["💈","By appointment"],["✨","Local pros"],["📍","On 9 Ave"]]'::jsonb, 'https://picsum.photos/seed/strollyyc918/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.032526, 51.040419), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'c36b3a13013f', id, 'Wild Soul Body Sugaring', 'services', 'WS', '#109E 1526 9 Av Se', 'Wild Soul Body Sugaring — local service on 9 Ave SE in Inglewood.', '9am–6pm', '[["💈","By appointment"],["✨","Local pros"],["📍","On 9 Ave"]]'::jsonb, 'https://picsum.photos/seed/strollyyc100/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.027171, 51.038692), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'db2d4b40f860', id, 'Permanent Beauty Boutique Yyc', 'services', 'PB', '#109 1526 9 Av Se', 'Permanent Beauty Boutique Yyc — local service on 9 Ave SE in Inglewood.', '9am–6pm', '[["💈","By appointment"],["✨","Local pros"],["📍","On 9 Ave"]]'::jsonb, 'https://picsum.photos/seed/strollyyc388/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.027223, 51.038672), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'eada90fe500b', id, 'Foundation Barbershop', 'bar', 'FB', '#3 1335 9 Av Se', 'Foundation Barbershop — bar on 9 Ave SE in Inglewood.', '12pm–12am', '[["🍺","Local pours"],["🎶","Good vibes"],["🍔","Bar bites"]]'::jsonb, 'https://picsum.photos/seed/strollyyc119/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.032395, 51.040383), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '8e71e576c7ad', id, 'Double L Motors (2008)', 'shop', 'DL', '1509 9 Av Se', 'Double L Motors (2008) — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc339/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.028407, 51.038682), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '77efe6ee9a22', id, 'Nova Skin & Wellness', 'services', 'NS', '1412 9 Av Se', 'Nova Skin & Wellness — local service on 9 Ave SE in Inglewood.', '9am–6pm', '[["💈","By appointment"],["✨","Local pros"],["📍","On 9 Ave"]]'::jsonb, 'https://picsum.photos/seed/strollyyc630/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.030796, 51.040061), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'a508aaae5b24', id, 'Pro Line Shooters Ii', 'services', 'PL', '#B 1426 9 Av Se', 'Pro Line Shooters Ii — local service on 9 Ave SE in Inglewood.', '9am–6pm', '[["💈","By appointment"],["✨","Local pros"],["📍","On 9 Ave"]]'::jsonb, 'https://picsum.photos/seed/strollyyc850/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.029862, 51.039704), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '1762b7c2d959', id, 'Le Belle Arti', 'shop', 'LB', '1435 9 Av Se', 'Le Belle Arti — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc942/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.029679, 51.039147), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '8bfa3e36c706', id, 'Rayacom', 'shop', 'R', '1528 9 Av Se', 'Rayacom — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc31/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.027023, 51.038677), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '6f49344adc5e', id, 'Tail Blazers Inglewood', 'shop', 'TB', '#7 1420 9 Av Se', 'Tail Blazers Inglewood — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc437/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.0301, 51.039788), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'ce59616ff3fd', id, 'Purple Lotus Massage', 'services', 'PL', '1530 9 Av Se', 'Purple Lotus Massage — local service on 9 Ave SE in Inglewood.', '9am–6pm', '[["💈","By appointment"],["✨","Local pros"],["📍","On 9 Ave"]]'::jsonb, 'https://picsum.photos/seed/strollyyc72/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.026906, 51.038632), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '9a47399c5b8e', id, 'Shoe Closet (The)', 'shop', 'SC', '1404 9 Av Se', 'Shoe Closet (The) — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc275/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.031068, 51.040171), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'f380866520e2', id, 'Canela', 'cafe', 'C', '1319 9 Av Se', 'All-vegan bakery & café — sweet & savoury.', '8am–5pm', '[["🥐","Vegan croissants"],["🎂","Cake counter"],["🌱","Plant-based"]]'::jsonb, 'https://picsum.photos/seed/strollyyc139/520/340', 'canelabakeshop.com', 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.033301, 51.040621), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'a783f67510af', id, 'Knifewear', 'restaurant', 'K', '#100A 1316 9 Av Se', 'Japanese kitchen knives & sharpening experts.', '10am–6pm', '[["🔪","Hand-forged blades"],["🪒","Sharpening bar"],["🇯🇵","Imported steel"]]'::jsonb, 'https://picsum.photos/seed/strollyyc705/520/340', 'knifewear.com', 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.033142, 51.041044), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'cff5275976cd', id, 'Yyc Laser & Skincare', 'services', 'YL', '#109H 1526 9 Av Se', 'Yyc Laser & Skincare — local service on 9 Ave SE in Inglewood.', '9am–6pm', '[["💈","By appointment"],["✨","Local pros"],["📍","On 9 Ave"]]'::jsonb, 'https://picsum.photos/seed/strollyyc323/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.027197, 51.038773), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '872ea242c1fa', id, 'Alberta Boot Company', 'shop', 'AB', '1312A 9 Av Se', 'Alberta''s original western boot maker.', '9am–5:30pm', '[["👢","Handmade cowboy boots"],["🐂","Exotic leathers"],["🧵","Custom fittings"]]'::jsonb, 'https://picsum.photos/seed/strollyyc952/520/340', 'albertaboot.com', 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.033508, 51.041062), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '9257e6fa4ed5', id, 'Teou Studio', 'services', 'TS', '#109D 1526 9 Av Se', 'Teou Studio — local service on 9 Ave SE in Inglewood.', '9am–6pm', '[["💈","By appointment"],["✨","Local pros"],["📍","On 9 Ave"]]'::jsonb, 'https://picsum.photos/seed/strollyyc81/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.027155, 51.038672), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '76e41ecc93dd', id, 'Not Another Eye Store', 'shop', 'NA', '1321 9 Av Se', 'Not Another Eye Store — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc504/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.033149, 51.040623), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '4c72fe2adf42', id, 'Calgary Local Florist', 'restaurant', 'CL', '1428 9 Av Se', 'Calgary Local Florist — restaurant on 9 Ave SE in Inglewood.', '11am–10pm', '[["🍴","Local kitchen"],["🪑","Dine-in"],["📍","On the strip"]]'::jsonb, 'https://picsum.photos/seed/strollyyc861/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.029862, 51.039704), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '6d5d54955fd5', id, 'Kindred Aesthetics', 'services', 'KA', '#109A 1526 9 Av Se', 'Kindred Aesthetics — local service on 9 Ave SE in Inglewood.', '9am–6pm', '[["💈","By appointment"],["✨","Local pros"],["📍","On 9 Ave"]]'::jsonb, 'https://picsum.photos/seed/strollyyc736/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.027259, 51.038647), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '7d26fd6de9f4', id, 'Tea Cult (The)', 'restaurant', 'TC', '#23 1420 9 Av Se', 'Tea Cult (The) — restaurant on 9 Ave SE in Inglewood.', '11am–10pm', '[["🍴","Local kitchen"],["🪑","Dine-in"],["📍","On the strip"]]'::jsonb, 'https://picsum.photos/seed/strollyyc579/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.02988, 51.039884), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '12d77445dc0f', id, 'Man Of Distinction', 'shop', 'MO', '1416 9 Av Se', 'Man Of Distinction — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc531/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.030604, 51.039991), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '3df783573f2f', id, 'Change Is Good Cdc', 'shop', 'CI', '1317 9 Av Se', 'Change Is Good Cdc — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc612/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.03349, 51.040644), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'b49cbb8240cc', id, 'Silk Road Spice Merchant (The)', 'restaurant', 'SR', '1419 9 Av Se', 'Silk Road Spice Merchant (The) — restaurant on 9 Ave SE in Inglewood.', '11am–10pm', '[["🍴","Local kitchen"],["🪑","Dine-in"],["📍","On the strip"]]'::jsonb, 'https://picsum.photos/seed/strollyyc601/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.030539, 51.039569), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '7978ab85f4db', id, 'Spolumbo''s Fine Food & Deli', 'restaurant', 'SF', '1308 9 Av Se', 'Bustling Italian deli & famous house sausage.', '9am–4pm', '[["🌭","House sausage"],["🥪","Deli subs"],["👨‍🍳","Ex-Stampeders"]]'::jsonb, 'https://picsum.photos/seed/strollyyc149/520/340', 'spolumbos.com', 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.033859, 51.041358), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '27762f395b94', id, 'High Line Brewing', 'bar', 'HL', '#113 1318 9 Av Se', 'Small-batch neighbourhood brewery & taproom.', '12–11pm', '[["🍺","Fresh batches"],["🎯","Taproom games"],["🐕","Dog-friendly"]]'::jsonb, 'https://picsum.photos/seed/strollyyc131/520/340', 'highlinebrewing.ca', 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.032831, 51.041129), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'e2da7a713064', id, 'Imagine Vintage Wear', 'shop', 'IV', '1325 9 Av Se', 'Imagine Vintage Wear — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc888/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.032979, 51.040526), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '660cce1585b4', id, 'Elysian Alchemy', 'restaurant', 'EA', '1340 9 Av Se', 'Elysian Alchemy — restaurant on 9 Ave SE in Inglewood.', '11am–10pm', '[["🍴","Local kitchen"],["🪑","Dine-in"],["📍","On the strip"]]'::jsonb, 'https://picsum.photos/seed/strollyyc426/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.03177, 51.040439), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'fe1f0bae0b79', id, 'Hallmark Auto Body', 'shop', 'HA', '1430 9 Av Se', 'Hallmark Auto Body — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc371/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.029228, 51.039646), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '94ea41bcbdb8', id, 'Eira Laser', 'services', 'EL', '#109I 1526 9 Av Se', 'Eira Laser — local service on 9 Ave SE in Inglewood.', '9am–6pm', '[["💈","By appointment"],["✨","Local pros"],["📍","On 9 Ave"]]'::jsonb, 'https://picsum.photos/seed/strollyyc92/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.027173, 51.038729), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '8dcd6411ad76', id, 'Notorious Hair Group', 'services', 'NH', '#1 1335 9 Av Se', 'Notorious Hair Group — local service on 9 Ave SE in Inglewood.', '9am–6pm', '[["💈","By appointment"],["✨","Local pros"],["📍","On 9 Ave"]]'::jsonb, 'https://picsum.photos/seed/strollyyc81/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.032305, 51.040346), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '56bf137ea1eb', id, 'Ama Jewellery & Watches', 'shop', 'AJ', '1349 9 Av Se', 'Ama Jewellery & Watches — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc796/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.032095, 51.040232), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '0a462a7fdf36', id, 'Vegan Street & The Attic', 'restaurant', 'VS', '1413 9 Av Se', 'Vegan Street & The Attic — restaurant on 9 Ave SE in Inglewood.', '11am–10pm', '[["🍴","Local kitchen"],["🪑","Dine-in"],["📍","On the strip"]]'::jsonb, 'https://picsum.photos/seed/strollyyc67/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.030957, 51.039689), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '127a77d78cdc', id, 'Barbie Nail And Massage', 'bar', 'BN', '1327B 9 Av Se', 'Barbie Nail And Massage — bar on 9 Ave SE in Inglewood.', '12pm–12am', '[["🍺","Local pours"],["🎶","Good vibes"],["🍔","Bar bites"]]'::jsonb, 'https://picsum.photos/seed/strollyyc594/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.032595, 51.040442), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'f0e71e686754', id, 'Tease Hair Studio', 'services', 'TH', '1532 9 Av Se', 'Tease Hair Studio — local service on 9 Ave SE in Inglewood.', '9am–6pm', '[["💈","By appointment"],["✨","Local pros"],["📍","On 9 Ave"]]'::jsonb, 'https://picsum.photos/seed/strollyyc763/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.026808, 51.038561), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'a3c937706f28', id, 'Coven Body Arts', 'services', 'CB', '1532 9 Av Se', 'Coven Body Arts — local service on 9 Ave SE in Inglewood.', '9am–6pm', '[["💈","By appointment"],["✨","Local pros"],["📍","On 9 Ave"]]'::jsonb, 'https://picsum.photos/seed/strollyyc797/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.026808, 51.038561), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '92e556fab575', id, 'Plant Terrariums & Garden Supplies', 'shop', 'PT', '1327 9 Av Se', 'Plant Terrariums & Garden Supplies — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc81/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.0329, 51.040387), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'baa6a523115f', id, 'Recess', 'shop', 'R', '1333 9 Av Se', 'Recess — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc477/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.032476, 51.040396), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'bced601bb20a', id, 'Chantelle Keshaye Permanent Makeup', 'services', 'CK', '#8 1420 9 Av Se', 'Chantelle Keshaye Permanent Makeup — local service on 9 Ave SE in Inglewood.', '9am–6pm', '[["💈","By appointment"],["✨","Local pros"],["📍","On 9 Ave"]]'::jsonb, 'https://picsum.photos/seed/strollyyc519/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.030299, 51.039877), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'a814add1ea08', id, 'Radiance Day Spa', 'services', 'RD', '1528 9 Av Se', 'Radiance Day Spa — local service on 9 Ave SE in Inglewood.', '9am–6pm', '[["💈","By appointment"],["✨","Local pros"],["📍","On 9 Ave"]]'::jsonb, 'https://picsum.photos/seed/strollyyc108/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.027023, 51.038677), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'ac2056898e5a', id, 'Sol Electrolysis', 'services', 'SE', '1532 9 Av Se', 'Sol Electrolysis — local service on 9 Ave SE in Inglewood.', '9am–6pm', '[["💈","By appointment"],["✨","Local pros"],["📍","On 9 Ave"]]'::jsonb, 'https://picsum.photos/seed/strollyyc10/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.026808, 51.038561), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '8e81202c36eb', id, 'Four20 Premium Market', 'shop', 'FP', '1309 9 Av Se', 'Four20 Premium Market — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc212/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.033875, 51.04079), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '71a3c24d9cc0', id, 'Ami Tea Sub', 'cafe', 'AT', '1357 9 Av Se', 'Ami Tea Sub — cafe on 9 Ave SE in Inglewood.', '8am–6pm', '[["☕","Coffee & treats"],["🥐","Fresh baking"],["🪟","Cosy room"]]'::jsonb, 'https://picsum.photos/seed/strollyyc16/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.031953, 51.04017), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '303651f0e95a', id, 'Lyndsey Haley Massage Therapy', 'services', 'LH', '1530 9 Av Se', 'Lyndsey Haley Massage Therapy — local service on 9 Ave SE in Inglewood.', '9am–6pm', '[["💈","By appointment"],["✨","Local pros"],["📍","On 9 Ave"]]'::jsonb, 'https://picsum.photos/seed/strollyyc629/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.026906, 51.038632), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'f9da1415aa9d', id, 'Inspire Wellness Massage', 'services', 'IW', '#109A 1526 9 Av Se', 'Inspire Wellness Massage — local service on 9 Ave SE in Inglewood.', '9am–6pm', '[["💈","By appointment"],["✨","Local pros"],["📍","On 9 Ave"]]'::jsonb, 'https://picsum.photos/seed/strollyyc727/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.027259, 51.038647), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'e50b4d6af5b6', id, 'Blooms On 9Th', 'shop', 'BO', '#19 1420 9 Av Se', 'Blooms On 9Th — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc187/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.029916, 51.039847), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '54960e7da203', id, 'Supervariety', 'restaurant', 'S', '1327A 9 Av Se', 'Supervariety — restaurant on 9 Ave SE in Inglewood.', '11am–10pm', '[["🍴","Local kitchen"],["🪑","Dine-in"],["📍","On the strip"]]'::jsonb, 'https://picsum.photos/seed/strollyyc794/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.032659, 51.040465), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '0150a1d87973', id, 'Sakura Eyelash Salon', 'services', 'SE', '1420 9 Av Se', 'Sakura Eyelash Salon — local service on 9 Ave SE in Inglewood.', '9am–6pm', '[["💈","By appointment"],["✨","Local pros"],["📍","On 9 Ave"]]'::jsonb, 'https://picsum.photos/seed/strollyyc833/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.030278, 51.040006), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '6aa8ee6fefbc', id, 'Neo Vape', 'shop', 'NV', '#1 1336 9 Av Se', 'Neo Vape — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc793/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.032014, 51.04056), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '30fec28bcc20', id, 'Blue Store (The)', 'restaurant', 'BS', '1344 9 Av Se', 'Blue Store (The) — restaurant on 9 Ave SE in Inglewood.', '11am–10pm', '[["🍴","Local kitchen"],["🪑","Dine-in"],["📍","On the strip"]]'::jsonb, 'https://picsum.photos/seed/strollyyc378/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.03177, 51.040439), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '8f4da35ae374', id, 'Saint And Stellar Tattoo', 'services', 'SA', '1530 9 Av Se', 'Saint And Stellar Tattoo — local service on 9 Ave SE in Inglewood.', '9am–6pm', '[["💈","By appointment"],["✨","Local pros"],["📍","On 9 Ave"]]'::jsonb, 'https://picsum.photos/seed/strollyyc833/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.026906, 51.038632), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'fb97bea5afc2', id, 'Tibetan Trom', 'shop', 'TT', '1325A 9 Av Se', 'Tibetan Trom — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc268/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.032979, 51.040526), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'bdb45997e4f9', id, 'Sacred Horizons Massage', 'services', 'SH', '1528 9 Av Se', 'Sacred Horizons Massage — local service on 9 Ave SE in Inglewood.', '9am–6pm', '[["💈","By appointment"],["✨","Local pros"],["📍","On 9 Ave"]]'::jsonb, 'https://picsum.photos/seed/strollyyc960/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.027023, 51.038677), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '94c97df793dd', id, 'Atlantic Auto Sales', 'shop', 'AA', '1556 9 Av Se', 'Atlantic Auto Sales — shop on 9 Ave SE in Inglewood.', '10am–6pm', '[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]'::jsonb, 'https://picsum.photos/seed/strollyyc812/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.025385, 51.038017), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'ffe0781bf7e7', id, 'Dirty Duck', 'bar', 'DD', '1336 9 Av Se', 'Dirty Duck — bar on 9 Ave SE in Inglewood.', '12pm–12am', '[["🍺","Local pours"],["🎶","Good vibes"],["🍔","Bar bites"]]'::jsonb, 'https://picsum.photos/seed/strollyyc506/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.032014, 51.04056), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '44b81446a20e', id, 'Kent Of Inglewood', 'services', 'KO', '#100B 1316 9 Av Se', 'Wet-shaving, grooming goods & fine knives.', '10am–6pm', '[["🪒","Straight razors"],["🧴","Grooming kits"],["🎁","Great gifts"]]'::jsonb, 'https://picsum.photos/seed/strollyyc768/520/340', 'kentofinglewood.com', 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.033142, 51.041044), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'c21c1143432a', id, 'Norley''s Colombian Street Food', 'restaurant', 'NC', '1314B 9 Av Se', 'Norley''s Colombian Street Food — restaurant on 9 Ave SE in Inglewood.', '11am–10pm', '[["🍴","Local kitchen"],["🪑","Dine-in"],["📍","On the strip"]]'::jsonb, 'https://picsum.photos/seed/strollyyc921/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.033266, 51.041055), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'dbea23c30e5b', id, 'Fetish Hair', 'services', 'FH', '#11 1420 9 Av Se', 'Fetish Hair — local service on 9 Ave SE in Inglewood.', '9am–6pm', '[["💈","By appointment"],["✨","Local pros"],["📍","On 9 Ave"]]'::jsonb, 'https://picsum.photos/seed/strollyyc78/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.030005, 51.039755), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '8b29b7dad567', id, 'Shu Beauty', 'services', 'SB', '#8 1420 9 Av Se', 'Shu Beauty — local service on 9 Ave SE in Inglewood.', '9am–6pm', '[["💈","By appointment"],["✨","Local pros"],["📍","On 9 Ave"]]'::jsonb, 'https://picsum.photos/seed/strollyyc623/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.030299, 51.039877), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select 'ae124029d974', id, 'Lashgirlsu', 'services', 'L', '1528 9 Av Se', 'Lashgirlsu — local service on 9 Ave SE in Inglewood.', '9am–6pm', '[["💈","By appointment"],["✨","Local pros"],["📍","On 9 Ave"]]'::jsonb, 'https://picsum.photos/seed/strollyyc568/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.027119, 51.038586), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();
insert into public.businesses (id, city_id, name, category, mono, address, blurb, hours, highlights, photo_url, suggested_domain, source, needs_review, geom)
select '4ea033a7b255', id, 'Cyndi Fehr Wellness', 'services', 'CF', '1528 9 Av Se', 'Cyndi Fehr Wellness — local service on 9 Ave SE in Inglewood.', '9am–6pm', '[["💈","By appointment"],["✨","Local pros"],["📍","On 9 Ave"]]'::jsonb, 'https://picsum.photos/seed/strollyyc143/520/340', null, 'City of Calgary business licence', true, st_setsrid(st_makepoint(-114.027119, 51.038586), 4326)::geography
from public.cities where slug = 'calgary'
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
  updated_at = now();

insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 0, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.03704,51.036076],[-114.037073,51.036076],[-114.037073,51.036088],[-114.037109,51.036088],[-114.037109,51.036075],[-114.037136,51.036075],[-114.037136,51.035981],[-114.037103,51.035982],[-114.037102,51.035969],[-114.037039,51.03597],[-114.03704,51.036076]]]]}'), 4326), '{"roof":0}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 2, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.037154,51.036424],[-114.03725,51.036423],[-114.03725,51.036327],[-114.037242,51.036327],[-114.037242,51.036313],[-114.037164,51.036314],[-114.037164,51.036328],[-114.037153,51.036328],[-114.037154,51.036424]]]]}'), 4326), '{"roof":2}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 8, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.034901,51.041781],[-114.034847,51.041836],[-114.03494,51.041872],[-114.034889,51.041925],[-114.034888,51.041926],[-114.035007,51.041971],[-114.035226,51.041746],[-114.035255,51.041716],[-114.035226,51.041705],[-114.034895,51.041577],[-114.034779,51.041532],[-114.03463,51.041682],[-114.034745,51.041728],[-114.034752,51.041724],[-114.034901,51.041781]]]]}'), 4326), '{"roof":8}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 4, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.035987,51.041999],[-114.035751,51.041908],[-114.035735,51.041925],[-114.035609,51.041877],[-114.035403,51.04209],[-114.035526,51.042137],[-114.035589,51.042072],[-114.035596,51.042074],[-114.035712,51.042119],[-114.035696,51.042135],[-114.035812,51.042179],[-114.035927,51.042061],[-114.035987,51.041999]]]]}'), 4326), '{"roof":4}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 6, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.040922,51.043005],[-114.04087,51.043092],[-114.041358,51.04321],[-114.041482,51.043005],[-114.040994,51.042887],[-114.040922,51.043005]]]]}'), 4326), '{"roof":6}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 8, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.0408,51.043446],[-114.040802,51.043446],[-114.040918,51.043474],[-114.0409,51.043504],[-114.041001,51.043529],[-114.041184,51.043573],[-114.041188,51.043574],[-114.0413,51.043389],[-114.041301,51.043388],[-114.040955,51.043304],[-114.040895,51.04329],[-114.0408,51.043446]]]]}'), 4326), '{"roof":8}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 1, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.037901,51.042032],[-114.037707,51.041985],[-114.037623,51.042123],[-114.03761,51.04212],[-114.037693,51.041984],[-114.037469,51.04193],[-114.037386,51.042064],[-114.037352,51.04212],[-114.037333,51.042152],[-114.037323,51.042168],[-114.037753,51.042273],[-114.037901,51.042032]]]]}'), 4326), '{"roof":1}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 8, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.035733,51.041297],[-114.035595,51.041437],[-114.035673,51.041467],[-114.035619,51.041522],[-114.035377,51.041424],[-114.035449,51.041351],[-114.035437,51.041347],[-114.035329,51.041306],[-114.03534,51.041295],[-114.035217,51.041246],[-114.035226,51.041237],[-114.035246,51.041215],[-114.035226,51.041207],[-114.035126,51.041166],[-114.035202,51.041088],[-114.035084,51.041042],[-114.035073,51.041053],[-114.035033,51.041094],[-114.034998,51.04108],[-114.035027,51.041051],[-114.034854,51.040983],[-114.034841,51.040978],[-114.03462,51.041208],[-114.034631,51.041212],[-114.03464,51.041239],[-114.034632,51.041246],[-114.034812,51.041317],[-114.034806,51.041322],[-114.035226,51.041485],[-114.03537,51.041541],[-114.036261,51.041887],[-114.036345,51.041798],[-114.036442,51.041702],[-114.036457,51.041688],[-114.036391,51.041662],[-114.036451,51.041604],[-114.036413,51.041589],[-114.036406,51.041594],[-114.036335,51.041565],[-114.036334,51.041566],[-114.036292,51.041609],[-114.036113,51.041536],[-114.036095,51.041557],[-114.035726,51.041412],[-114.035809,51.041328],[-114.035733,51.041297]]]]}'), 4326), '{"roof":8}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 3, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.040611,51.042785],[-114.040465,51.042749],[-114.040334,51.042964],[-114.040479,51.043],[-114.040536,51.042907],[-114.040611,51.042785]]]]}'), 4326), '{"roof":3}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 4, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.040199,51.042668],[-114.040161,51.042732],[-114.040023,51.042699],[-114.039923,51.042866],[-114.040326,51.042962],[-114.040448,51.042759],[-114.040447,51.042758],[-114.040411,51.04275],[-114.040405,51.042748],[-114.040316,51.042727],[-114.040371,51.042635],[-114.040314,51.042622],[-114.040275,51.042687],[-114.040199,51.042668]]]]}'), 4326), '{"roof":4}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 2, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.044305,51.044723],[-114.044329,51.04475],[-114.044318,51.044783],[-114.044369,51.04479],[-114.044379,51.044802],[-114.044317,51.044826],[-114.04446,51.044974],[-114.044412,51.044992],[-114.044379,51.044958],[-114.044162,51.045041],[-114.044233,51.045116],[-114.044234,51.045117],[-114.04425,51.045135],[-114.044253,51.045138],[-114.044321,51.045209],[-114.044321,51.04521],[-114.044325,51.045209],[-114.044476,51.045152],[-114.044543,51.045127],[-114.044511,51.045093],[-114.044561,51.045074],[-114.044697,51.045218],[-114.044701,51.045223],[-114.04484,51.04517],[-114.044792,51.04512],[-114.044804,51.045115],[-114.044796,51.045106],[-114.044778,51.045087],[-114.044766,51.045074],[-114.044751,51.045079],[-114.044672,51.044996],[-114.044686,51.044991],[-114.044684,51.044988],[-114.044638,51.044941],[-114.044624,51.044946],[-114.044544,51.044862],[-114.044556,51.044858],[-114.044519,51.044819],[-114.044517,51.044817],[-114.044503,51.044822],[-114.044457,51.044774],[-114.044424,51.044786],[-114.044415,51.044775],[-114.044413,51.044773],[-114.044426,51.04474],[-114.04439,51.044735],[-114.044376,51.044734],[-114.044322,51.044677],[-114.044279,51.044694],[-114.044305,51.044723]]]]}'), 4326), '{"roof":2}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 1, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.035932,51.042062],[-114.035775,51.042226],[-114.035889,51.04227],[-114.035867,51.042293],[-114.035961,51.042329],[-114.035954,51.042336],[-114.03598,51.042346],[-114.035984,51.042342],[-114.036092,51.042383],[-114.036243,51.042226],[-114.036257,51.042232],[-114.036283,51.042204],[-114.036269,51.042199],[-114.036333,51.042133],[-114.036108,51.042047],[-114.03605,51.042107],[-114.035932,51.042062]]]]}'), 4326), '{"roof":1}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 4, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.035242,51.042014],[-114.035318,51.042045],[-114.035398,51.042076],[-114.035614,51.041856],[-114.035457,51.041795],[-114.035242,51.042014]]]]}'), 4326), '{"roof":4}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 1, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.037534,51.042501],[-114.037381,51.042759],[-114.037445,51.042773],[-114.037428,51.042803],[-114.038033,51.042947],[-114.038041,51.042934],[-114.038028,51.042931],[-114.038067,51.042866],[-114.038274,51.042915],[-114.038253,51.042951],[-114.038363,51.042977],[-114.038368,51.042967],[-114.038439,51.042984],[-114.038434,51.042994],[-114.038466,51.043002],[-114.038472,51.04299],[-114.038547,51.043008],[-114.03854,51.043019],[-114.038569,51.043026],[-114.038575,51.043016],[-114.038648,51.043033],[-114.038641,51.043044],[-114.038674,51.043052],[-114.03868,51.043042],[-114.038752,51.043059],[-114.038747,51.043069],[-114.038779,51.043076],[-114.038785,51.043065],[-114.038856,51.043082],[-114.038849,51.043094],[-114.038881,51.043102],[-114.038887,51.043092],[-114.038959,51.043109],[-114.038953,51.043118],[-114.038985,51.043126],[-114.038991,51.043116],[-114.039065,51.043134],[-114.039069,51.043128],[-114.039136,51.043144],[-114.039167,51.043093],[-114.039166,51.043092],[-114.039205,51.043026],[-114.039172,51.043018],[-114.039215,51.042947],[-114.038978,51.042891],[-114.038987,51.042875],[-114.038671,51.0428],[-114.038665,51.042809],[-114.038461,51.04276],[-114.038467,51.042751],[-114.038193,51.042685],[-114.038176,51.042715],[-114.038168,51.042714],[-114.0382,51.042663],[-114.037849,51.042578],[-114.037737,51.042665],[-114.037655,51.042646],[-114.037707,51.042567],[-114.037534,51.042501]]]]}'), 4326), '{"roof":1}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 0, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.036924,51.041788],[-114.036924,51.041826],[-114.036923,51.04193],[-114.037036,51.041957],[-114.037047,51.041941],[-114.037299,51.042002],[-114.037285,51.04203],[-114.037384,51.042053],[-114.037454,51.041939],[-114.037415,51.04193],[-114.037395,51.041901],[-114.036924,51.041788],[-114.036924,51.041788]]]]}'), 4326), '{"roof":0}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 5, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.039155,51.042268],[-114.039079,51.042291],[-114.039067,51.042311],[-114.038913,51.042276],[-114.038936,51.042238],[-114.03888,51.042226],[-114.03894,51.042124],[-114.03894,51.042124],[-114.038716,51.042072],[-114.038511,51.041921],[-114.038511,51.041921],[-114.038482,51.041937],[-114.038352,51.041905],[-114.038236,51.042097],[-114.038259,51.042104],[-114.038222,51.042166],[-114.038204,51.042159],[-114.038073,51.042369],[-114.038111,51.042419],[-114.038672,51.042553],[-114.03869,51.04252],[-114.038814,51.04255],[-114.038822,51.042538],[-114.038838,51.042541],[-114.038812,51.042585],[-114.038821,51.042587],[-114.038817,51.042593],[-114.039393,51.042726],[-114.039435,51.042653],[-114.039403,51.042646],[-114.039417,51.042622],[-114.039432,51.042626],[-114.039559,51.042408],[-114.03955,51.042406],[-114.039457,51.042385],[-114.039461,51.042379],[-114.039217,51.042319],[-114.039233,51.04229],[-114.039237,51.042282],[-114.039163,51.042265],[-114.039155,51.042268]]]]}'), 4326), '{"roof":5}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 7, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.041875,51.043866],[-114.041968,51.043889],[-114.041987,51.043858],[-114.042057,51.043875],[-114.042069,51.043854],[-114.042122,51.043867],[-114.042196,51.043747],[-114.041981,51.043695],[-114.041875,51.043866]]]]}'), 4326), '{"roof":7}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 1, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.036456,51.041712],[-114.03636,51.041806],[-114.036466,51.041849],[-114.036566,51.041752],[-114.036481,51.041721],[-114.036456,51.041712]]]]}'), 4326), '{"roof":1}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 0, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.037046,51.042728],[-114.037204,51.042766],[-114.037306,51.042598],[-114.037315,51.0426],[-114.037324,51.042587],[-114.037144,51.042543],[-114.037046,51.042703],[-114.037059,51.042707],[-114.037046,51.042728]]]]}'), 4326), '{"roof":0}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 2, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.03609,51.042195],[-114.035981,51.042306],[-114.036008,51.042316],[-114.036136,51.042186],[-114.036117,51.042179],[-114.036098,51.042198],[-114.03609,51.042195]]]]}'), 4326), '{"roof":2}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 4, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.03781,51.041147],[-114.037787,51.041142],[-114.037798,51.041138],[-114.03769,51.041038],[-114.037524,51.041311],[-114.037689,51.041349],[-114.03781,51.041147]]]]}'), 4326), '{"roof":4}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 5, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.018895,51.035189],[-114.018734,51.035328],[-114.018902,51.035405],[-114.019062,51.035266],[-114.019053,51.035262],[-114.018906,51.035195],[-114.018895,51.035189]]]]}'), 4326), '{"roof":5}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 3, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.01795,51.035205],[-114.018013,51.035234],[-114.018074,51.035182],[-114.01801,51.035153],[-114.01795,51.035205]]]]}'), 4326), '{"roof":3}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 7, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.024073,51.036885],[-114.02404,51.036872],[-114.023947,51.036967],[-114.023908,51.036951],[-114.023836,51.037025],[-114.024092,51.037124],[-114.02408,51.037137],[-114.024752,51.037398],[-114.024774,51.037375],[-114.024778,51.037376],[-114.024801,51.03738],[-114.024822,51.037381],[-114.024838,51.03738],[-114.02486,51.037376],[-114.024879,51.03737],[-114.024902,51.037392],[-114.024925,51.03738],[-114.024939,51.037371],[-114.024953,51.037356],[-114.024963,51.037343],[-114.024969,51.037327],[-114.02497,51.037313],[-114.024965,51.037293],[-114.024961,51.037281],[-114.024948,51.037265],[-114.024937,51.037255],[-114.024927,51.03726],[-114.024907,51.037248],[-114.024901,51.037245],[-114.024923,51.037222],[-114.024975,51.037224],[-114.024972,51.037067],[-114.024903,51.037067],[-114.024866,51.037105],[-114.024807,51.037083],[-114.024832,51.037],[-114.024151,51.03691],[-114.024146,51.036915],[-114.024118,51.036904],[-114.024073,51.036885]]]]}'), 4326), '{"roof":7}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 8, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.020229,51.036341],[-114.020077,51.03647],[-114.020076,51.036471],[-114.020359,51.036602],[-114.020361,51.036604],[-114.020396,51.036572],[-114.020401,51.036575],[-114.020488,51.0365],[-114.020483,51.036448],[-114.020424,51.036419],[-114.020434,51.036412],[-114.020317,51.036361],[-114.020305,51.03637],[-114.020234,51.036336],[-114.020229,51.036341]]]]}'), 4326), '{"roof":8}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 8, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.021927,51.036195],[-114.021932,51.035424],[-114.021932,51.035421],[-114.021716,51.035422],[-114.021716,51.035574],[-114.021735,51.035573],[-114.021733,51.035752],[-114.021601,51.03575],[-114.021599,51.035849],[-114.021604,51.035849],[-114.021603,51.035891],[-114.021732,51.035889],[-114.021731,51.035907],[-114.021598,51.035908],[-114.021597,51.036039],[-114.021927,51.036195]]]]}'), 4326), '{"roof":8}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 7, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.021148,51.035686],[-114.021037,51.035635],[-114.021034,51.035633],[-114.02091,51.03574],[-114.021024,51.035793],[-114.021034,51.035784],[-114.021147,51.035687],[-114.021148,51.035686]]]]}'), 4326), '{"roof":7}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 8, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.053598,51.044504],[-114.053599,51.044441],[-114.053594,51.044441],[-114.053594,51.044418],[-114.053434,51.044415],[-114.053413,51.044428],[-114.053399,51.044595],[-114.053452,51.04459],[-114.053488,51.044583],[-114.053519,51.044576],[-114.053546,51.044567],[-114.053564,51.044558],[-114.053578,51.044546],[-114.053587,51.044533],[-114.053595,51.044519],[-114.053598,51.044504]]]]}'), 4326), '{"roof":8}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 7, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.054165,51.044631],[-114.054313,51.044636],[-114.054324,51.0445],[-114.054176,51.044496],[-114.054165,51.044631]]]]}'), 4326), '{"roof":7}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 6, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.052345,51.044432],[-114.052162,51.044426],[-114.052162,51.044435],[-114.051986,51.044427],[-114.051985,51.044427],[-114.051985,51.044434],[-114.05198,51.044492],[-114.051975,51.044556],[-114.051973,51.044581],[-114.051973,51.044581],[-114.052088,51.044583],[-114.052117,51.04459],[-114.052107,51.044726],[-114.052107,51.044735],[-114.052323,51.044741],[-114.052345,51.044432]]]]}'), 4326), '{"roof":6}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 4, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.030477,51.039902],[-114.030347,51.040043],[-114.030699,51.040179],[-114.030638,51.040242],[-114.031185,51.040455],[-114.031323,51.040314],[-114.031325,51.040315],[-114.031347,51.040292],[-114.031336,51.040288],[-114.03135,51.040274],[-114.031355,51.040264],[-114.031351,51.040255],[-114.031343,51.040243],[-114.031332,51.040232],[-114.031285,51.040214],[-114.031289,51.04021],[-114.031254,51.040196],[-114.031248,51.040202],[-114.030477,51.039902]]]]}'), 4326), '{"roof":4}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 8, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.033172,51.041097],[-114.033231,51.041121],[-114.033185,51.041169],[-114.033365,51.041239],[-114.03337,51.041241],[-114.033552,51.041054],[-114.033307,51.040959],[-114.033309,51.040957],[-114.033188,51.04091],[-114.03299,51.041113],[-114.03311,51.04116],[-114.033172,51.041097]]]]}'), 4326), '{"roof":8}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 4, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.026987,51.03876],[-114.027015,51.038772],[-114.027016,51.038771],[-114.027087,51.038699],[-114.027153,51.038631],[-114.026919,51.03854],[-114.026782,51.03868],[-114.026787,51.038682],[-114.026832,51.038699],[-114.026943,51.038743],[-114.026987,51.03876]]]]}'), 4326), '{"roof":4}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 8, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.032867,51.040965],[-114.032714,51.041119],[-114.032711,51.041122],[-114.032887,51.041191],[-114.033166,51.04091],[-114.033072,51.040873],[-114.033067,51.040878],[-114.032947,51.04083],[-114.032908,51.04087],[-114.03285,51.040932],[-114.032888,51.040944],[-114.032867,51.040965]]]]}'), 4326), '{"roof":8}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 5, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.032229,51.040547],[-114.032051,51.040729],[-114.032047,51.040733],[-114.032115,51.04076],[-114.032206,51.040667],[-114.032297,51.040574],[-114.032229,51.040547]]]]}'), 4326), '{"roof":5}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 0, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.030297,51.039813],[-114.030063,51.040051],[-114.030115,51.04007],[-114.030085,51.040101],[-114.030218,51.040153],[-114.030481,51.039885],[-114.030297,51.039813]]]]}'), 4326), '{"roof":0}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 1, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.032361,51.040377],[-114.032427,51.040402],[-114.032564,51.040261],[-114.032498,51.040234],[-114.032475,51.040259],[-114.032363,51.040216],[-114.032249,51.040334],[-114.032361,51.040377]]]]}'), 4326), '{"roof":1}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 8, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.032484,51.040423],[-114.032665,51.040494],[-114.032856,51.040302],[-114.032675,51.04023],[-114.032664,51.040241],[-114.032606,51.040219],[-114.032431,51.0404],[-114.032486,51.040421],[-114.032484,51.040423]]]]}'), 4326), '{"roof":8}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 6, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.027205,51.038592],[-114.027042,51.038761],[-114.027198,51.03882],[-114.0271,51.038922],[-114.027134,51.038936],[-114.027121,51.038949],[-114.027253,51.039],[-114.027288,51.038964],[-114.027327,51.038978],[-114.027566,51.03873],[-114.027514,51.038711],[-114.027505,51.03872],[-114.027454,51.0387],[-114.027465,51.038689],[-114.027414,51.03867],[-114.027405,51.03868],[-114.027338,51.038654],[-114.027345,51.038647],[-114.027291,51.038627],[-114.027285,51.038633],[-114.027238,51.038615],[-114.027245,51.038608],[-114.027205,51.038592]]]]}'), 4326), '{"roof":6}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 6, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.028451,51.038571],[-114.028447,51.03857],[-114.028397,51.038621],[-114.028399,51.038622],[-114.028362,51.03866],[-114.028326,51.038646],[-114.028269,51.038705],[-114.028268,51.038707],[-114.028275,51.03871],[-114.028308,51.038722],[-114.028402,51.038758],[-114.028547,51.038608],[-114.028451,51.038571]]]]}'), 4326), '{"roof":6}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 2, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.029838,51.039613],[-114.029724,51.039732],[-114.029886,51.039794],[-114.030001,51.039676],[-114.029839,51.039614],[-114.029839,51.039614],[-114.029838,51.039613]]]]}'), 4326), '{"roof":2}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 5, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.029869,51.039057],[-114.029716,51.038998],[-114.029484,51.039235],[-114.029638,51.039295],[-114.029869,51.039057]]]]}'), 4326), '{"roof":5}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 8, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.030005,51.039685],[-114.029814,51.039884],[-114.029929,51.039928],[-114.030037,51.039817],[-114.030107,51.039843],[-114.030191,51.039757],[-114.030005,51.039685]]]]}'), 4326), '{"roof":8}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 1, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.03344,51.040553],[-114.033335,51.040512],[-114.033163,51.040689],[-114.033267,51.040729],[-114.03344,51.040553]]]]}'), 4326), '{"roof":1}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 4, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.033308,51.040526],[-114.033261,51.040507],[-114.033271,51.040498],[-114.033274,51.040499],[-114.033315,51.040457],[-114.033294,51.040449],[-114.033345,51.040396],[-114.033236,51.040352],[-114.03314,51.04045],[-114.033203,51.040475],[-114.033196,51.040481],[-114.033143,51.040461],[-114.033003,51.040607],[-114.033011,51.040609],[-114.033001,51.040619],[-114.033111,51.040662],[-114.033119,51.040652],[-114.033166,51.040671],[-114.033308,51.040526]]]]}'), 4326), '{"roof":4}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 4, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.033475,51.040788],[-114.033656,51.040604],[-114.033694,51.040565],[-114.033522,51.040498],[-114.033287,51.040737],[-114.033404,51.040782],[-114.033419,51.040767],[-114.033475,51.040788]]]]}'), 4326), '{"roof":4}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 1, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.030416,51.039609],[-114.030539,51.039656],[-114.030662,51.03953],[-114.030653,51.039526],[-114.03054,51.039482],[-114.030416,51.039609],[-114.030416,51.039609]]]]}'), 4326), '{"roof":1}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 0, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.033684,51.041451],[-114.033651,51.041485],[-114.033648,51.041488],[-114.033723,51.041518],[-114.033726,51.041515],[-114.03376,51.04148],[-114.03389,51.041532],[-114.03409,51.04133],[-114.03407,51.041322],[-114.03408,51.041312],[-114.034071,51.041286],[-114.034053,51.041278],[-114.034059,51.041272],[-114.033817,51.041176],[-114.033802,51.041191],[-114.033774,51.041181],[-114.033772,51.041182],[-114.033714,51.041241],[-114.033715,51.041241],[-114.033785,51.041269],[-114.03375,51.041305],[-114.033672,51.041383],[-114.033632,51.041423],[-114.033689,51.041446],[-114.033684,51.041451]]]]}'), 4326), '{"roof":0}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 4, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.032852,51.040571],[-114.032862,51.040575],[-114.032974,51.040617],[-114.033095,51.040491],[-114.032973,51.040444],[-114.032852,51.040571]]]]}'), 4326), '{"roof":4}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 1, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.031788,51.040492],[-114.031881,51.040526],[-114.031821,51.040589],[-114.032061,51.040683],[-114.032208,51.040531],[-114.031965,51.040439],[-114.031961,51.040443],[-114.031741,51.040356],[-114.031706,51.040361],[-114.031581,51.040495],[-114.031729,51.040552],[-114.031738,51.040543],[-114.031788,51.040492]]]]}'), 4326), '{"roof":1}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 8, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.029696,51.039578],[-114.029389,51.039459],[-114.029298,51.039551],[-114.029182,51.039506],[-114.029188,51.039499],[-114.029069,51.039453],[-114.029062,51.03946],[-114.028995,51.039434],[-114.028932,51.039409],[-114.028759,51.039586],[-114.029433,51.039847],[-114.029696,51.039578]]]]}'), 4326), '{"roof":8}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 4, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.032467,51.040053],[-114.032415,51.040033],[-114.032401,51.040047],[-114.032375,51.040036],[-114.032385,51.040025],[-114.032337,51.040007],[-114.032319,51.040026],[-114.032241,51.039996],[-114.03226,51.039977],[-114.03221,51.039957],[-114.032201,51.039967],[-114.032173,51.039956],[-114.032183,51.039945],[-114.032135,51.039926],[-114.032062,51.04],[-114.032078,51.040007],[-114.032054,51.040031],[-114.032037,51.040025],[-114.031983,51.04008],[-114.032006,51.040089],[-114.03198,51.040117],[-114.031957,51.040108],[-114.031904,51.040162],[-114.031932,51.040173],[-114.031917,51.040187],[-114.032247,51.040316],[-114.032489,51.040067],[-114.032463,51.040057],[-114.032467,51.040053]]]]}'), 4326), '{"roof":4}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 0, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.030801,51.039774],[-114.0308,51.039775],[-114.0309,51.039814],[-114.030901,51.039813],[-114.031059,51.039651],[-114.031127,51.039582],[-114.031023,51.039541],[-114.030966,51.0396],[-114.030971,51.039601],[-114.030926,51.039647],[-114.030915,51.039643],[-114.030908,51.03965],[-114.03089,51.039643],[-114.03081,51.039724],[-114.030839,51.039735],[-114.030801,51.039774]]]]}'), 4326), '{"roof":0}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 5, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.026897,51.038531],[-114.026812,51.038497],[-114.026718,51.03859],[-114.026803,51.038624],[-114.026897,51.038531]]]]}'), 4326), '{"roof":5}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 2, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.032901,51.040272],[-114.032735,51.040438],[-114.032899,51.040503],[-114.033065,51.040337],[-114.032901,51.040272]]]]}'), 4326), '{"roof":2}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 6, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.03397,51.040715],[-114.03392,51.040695],[-114.033782,51.040835],[-114.03382,51.04085],[-114.033806,51.040864],[-114.033836,51.040875],[-114.033849,51.040862],[-114.033872,51.040871],[-114.033951,51.04079],[-114.033912,51.040774],[-114.03397,51.040715]]]]}'), 4326), '{"roof":6}'::jsonb
from public.cities where slug = 'calgary';
insert into public.business_buildings (business_id, city_id, roof_index, geom, properties)
select null, id, 2, st_setsrid(st_geomfromgeojson('{"type":"MultiPolygon","coordinates":[[[[-114.025461,51.037943],[-114.025317,51.037943],[-114.025319,51.038095],[-114.025368,51.038095],[-114.025445,51.038095],[-114.025446,51.03799],[-114.025462,51.037989],[-114.025461,51.037943]]]]}'), 4326), '{"roof":2}'::jsonb
from public.cities where slug = 'calgary';

insert into public.attractions (id, city_id, name, emoji, blurb, geom)
select 'zoo', id, 'Calgary Zoo', '🦁', 'A citywide discovery pin near the Bow River and Inglewood.', st_setsrid(st_makepoint(-114.0307, 51.0457), 4326)::geography
from public.cities where slug = 'calgary'
on conflict (id) do update set
  name = excluded.name,
  emoji = excluded.emoji,
  blurb = excluded.blurb,
  geom = excluded.geom,
  updated_at = now();
insert into public.attractions (id, city_id, name, emoji, blurb, geom)
select 'fort-calgary', id, 'The Confluence', '🏛️', 'Historic gathering place and cultural destination.', st_setsrid(st_makepoint(-114.0446, 51.0476), 4326)::geography
from public.cities where slug = 'calgary'
on conflict (id) do update set
  name = excluded.name,
  emoji = excluded.emoji,
  blurb = excluded.blurb,
  geom = excluded.geom,
  updated_at = now();
insert into public.attractions (id, city_id, name, emoji, blurb, geom)
select 'riverwalk', id, 'RiverWalk', '🚶', 'A friendly route for strolling into the neighbourhood.', st_setsrid(st_makepoint(-114.0418, 51.04685), 4326)::geography
from public.cities where slug = 'calgary'
on conflict (id) do update set
  name = excluded.name,
  emoji = excluded.emoji,
  blurb = excluded.blurb,
  geom = excluded.geom,
  updated_at = now();

commit;
