# Stroll — Build Handoff & Technical Spec

**Prepared for:** Nicholas (developer)
**From:** Jonathan
**Date:** June 2026
**Companion file:** `inglewood-stroll-watercolor.html` (the working prototype — open it in a browser first)

---

## 1. The vision in one paragraph

Stroll is a "friendlier Google Maps" for a city's trendy streets. Instead of a utilitarian grey grid, it's an **illustrated, hand-painted top-down map** of a neighbourhood's main strip, showing the real building footprints with each business's **logo stamped on its rooftop as a clickable button**. Hovering a logo pops a curated photo; clicking opens a slide-over "mini-app" profile for that business **without ever leaving the map** (no new tabs). Businesses pay a monthly fee to curate their logo, photos and profile. The map also surfaces bike paths, events, and citywide tourist attractions to make it a genuine city-discovery tool, not just a directory.

---

## 2. What the prototype already proves (and what's placeholder)

The single HTML file is a **functional proof of concept**, not production code. It demonstrates:

- Real building footprints + street network + tree canopy from City of Calgary open data.
- 140 real Inglewood businesses placed on their **verified licence addresses**, snapped onto their actual building footprint.
- Painted roofs, hover photo cards, click-to-open slide-over panels, category filters.
- Citywide basemap (CARTO), bike + pathway overlays, "Fit to strip" / "Whole city" navigation.

**Placeholders to replace in the real build:**

- Business **photos** are generic stock stand-ins (need per-business real photos).
- Most **logos** are monogram badges (only ~18 pull a real favicon); real logos come from businesses uploading them.
- Business **hours / blurbs / highlights** are partly generated; need real data.
- It's one giant HTML file with embedded data — fine for a demo, wrong for production.

---

## 3. Recommended architecture

Do **not** ship the single-file prototype. Rebuild as a proper app:

- **Frontend:** React (Next.js) + **MapLibre GL JS** for the map. (MapLibre is open-source and free; Mapbox GL JS is an alternative if you want their tooling/tiles — it needs a paid key.)
- **Backend / API:** Node (or your preference) serving a REST/GraphQL API.
- **Database:** **PostgreSQL + PostGIS** (geospatial). Stores businesses, footprints, subscriptions, events, attractions, neighbourhoods.
- **Business self-serve portal:** the paid layer — businesses log in, claim their building, upload logo + photos, edit their profile, and subscribe. This is the revenue engine.
- **Auth:** Clerk/Auth0/Supabase Auth.
- **Payments:** **Stripe** (subscriptions).
- **Hosting:** Vercel/Netlify (frontend) + Supabase or Render/Fly.io (Postgres + API). Cloudflare for CDN/image caching.

Data pipeline: write **import scripts** (the prototype's Python scripts are a working reference) that pull from the open-data APIs, snap businesses to footprints, and load Postgres. Re-run on a schedule so the map stays current.

---

## 4. Data sources (all verified working in the prototype)

| Data | Source | Dataset ID / endpoint | Use |
|---|---|---|---|
| Building footprints | City of Calgary Open Data (Socrata) | `uc4c-6kbd` | Real building shapes |
| Street centrelines | City of Calgary | `4dx8-rtm5` | Road geometry / labels |
| **Business licences** (name, address, coords) | City of Calgary | `vdjc-pybd` | **Verified business locations** |
| Public trees | City of Calgary | `tfs4-3wwa` | Greenery/illustration |
| Bikeways (on-street) | City of Calgary | `jjqk-9b73` | Cycling layer |
| Parks/river pathways | City of Calgary | `qndb-27qm` | Pathway layer |
| City events | City of Calgary | `n625-9k5x` | Events tab (official city events) |
| Parcel address points | City of Calgary | `9zvu-p8uz` | Geocoding fallback |
| Building footprints / POIs (fallback) | OpenStreetMap (Overpass) | overpass-api.de | Other cities / POI names |
| Basemap (illustrated-parchment) | CARTO | `rastertiles/voyager` (keyless) | Citywide roads |
| Basemap (true watercolour) | Stadia Maps "Stamen Watercolor" | needs API key | Optional painted basemap |

Socrata query pattern used: `https://data.calgary.ca/resource/{id}.geojson?$where=within_box({col},{NWlat},{NWlon},{SElat},{SElon})&$limit=N`

---

## 5. Essential tools & API keys (the list you asked for)

| Service | Purpose | Account / key | Cost | Priority |
|---|---|---|---|---|
| **MapLibre GL JS** | Map rendering engine | None (open source) | Free | Required |
| **City of Calgary Open Data (Socrata)** | All the geographic + business data | Free "app token" (raises rate limits) | Free | Required |
| **Google Maps Platform — Places API** | Real per-business photos, hours, ratings, phone | API key + billing account | Pay-as-you-go (free monthly credit) | **Required** for real photos/hours |
| **Google Street View Static API** | Actual storefront photos by coordinate | Same Google key | Pay-as-you-go | Recommended |
| **Google Geocoding API** | Address → coordinate cleanup | Same Google key | Pay-as-you-go | Optional |
| **Stripe** | Subscription billing (the paid business layer) | Stripe account | % per transaction | **Required** for monetization |
| **Eventbrite API** | Community/festival events | Free API key/OAuth | Free tier | Recommended (events) |
| **Ticketmaster Discovery API** | Ticketed concerts/shows | Free API key | Free tier | Optional (events) |
| **Stadia Maps** | True watercolour ("Stamen") basemap | Free API key | Free tier, paid at scale | Optional (look) |
| **Mapbox** | Alt. map engine + custom illustrated styles | API key | Free tier, then paid | Optional (instead of MapLibre+CARTO) |
| **Hosting** (Vercel + Supabase/Render) | App + Postgres/PostGIS | Accounts | Free tiers to start | Required |
| **Auth** (Clerk/Supabase Auth) | Business logins | Account | Free tier | Required for portal |
| **Cloudflare** | Image CDN / caching | Account | Free tier | Optional |
| **Domain registrar** | yourdomain.com | Account | ~$15/yr | Required |

**Minimum to start:** Calgary Open Data token (free) + Google Maps Platform key (photos/hours) + Stripe (billing) + hosting. Everything else is optional polish.

---

## 6. Features to build

**A. The core map** — painted basemap + real footprints + logo-button markers + hover card + slide-over panel + category filters. (All prototyped — replicate with live data from Postgres.)

**B. Verified logo placement** — reproduce the prototype's method: take each business's licence coordinate (`vdjc-pybd`), find the building footprint (`uc4c-6kbd`) that contains the point (point-in-polygon) or the nearest within ~30 m, and place the logo at that building's centroid. Allow multiple logos per building (multi-tenant).

**C. Neighbourhood / strip selector (Jonathan's "sub-buttons" idea)** — yes, easy. Build a **neighbourhoods table** (name, centre, bounds, bearing). Render "Fit to strip" as a dropdown listing every mapped strip: Inglewood, Bridgeland, Kensington, Marda Loop, 17th Ave (Mission/Beltline), Bowness, Kensington, etc. Selecting one flies the camera to its bounds. Adding a new strip = one DB row + running the import script for that bbox.

**D. Bike + pathway layers** — already wired (`jjqk-9b73`, `qndb-27qm`) with toggles. Keep.

**E. Events tab** — see Section 7.

**F. Tourist attractions / activities layer** — see Section 8.

**G. Business self-serve portal (monetization)** — login → claim your building → upload logo + photos → edit profile/hours/highlights → choose plan → Stripe checkout. Free tier = logo only; paid tier = full mini-app card + photos + events/promos. This is the whole business model.

---

## 7. Events tab — how to actually source it

Jonathan asked if we can pull events from Tourism Calgary / calgary.guide / yycinglewood. Honest answer:

- **Those three sites have no public API.** Options are (a) a **data partnership** (ask them for a feed — best, and good for relationships), or (b) **scraping** their pages (works but fragile, breaks when they redesign, and must respect their Terms of Service — get permission). Some may expose an **iCal/RSS** feed worth checking.
- **Clean API alternatives (use these first):**
  - **City of Calgary Events** open dataset (`n625-9k5x`) — official, free, no scraping.
  - **Eventbrite API** — community events, festivals, markets (e.g., Inglewood Night Market). Free key.
  - **Ticketmaster Discovery API** — ticketed concerts/shows. Free key.
- **Recommended approach:** aggregate City Open Data + Eventbrite + Ticketmaster into our events table, geocode each event to a coordinate, and show **"happening today"** pins on the map with a filterable **Events tab**. Pursue Tourism Calgary as a partner feed in parallel rather than depending on scraping.

---

## 8. Tourist attractions / activities layer

Yes — add an **attractions** layer (Calaway Park, WinSport downhill carts & zip lines, public pools, the Zoo, Heritage Park, Peace Bridge, etc.). Sourcing:

- **Google Places API** — search by type (amusement_park, tourist_attraction, swimming_pool) for names, coordinates, photos, hours, ratings. Best single source.
- **City of Calgary recreation facilities** open data — official pools/arenas/rec centres.
- **OpenStreetMap** `tourism=*` / `leisure=*` tags — free, broad coverage.
- Curate a hand-picked "must-do" set for quality, enriched by the above.

Render as a distinct category (with filter toggle) so attractions can be shown/hidden alongside the business categories, citywide rather than per-strip.

---

## 9. Neighbourhoods to map next (priority order suggestion)

Inglewood (done) → **17th Ave SW / Beltline**, **Kensington**, **Marda Loop**, **Bridgeland**, **Mission/4th St SW**, **Bowness Main St**, **Britannia/Elbow**, **Bridgeland**, **Crescent Heights/Edmonton Trail**. Each is the same pipeline with a new bounding box.

---

## 10. Suggested build phases

1. **Foundation:** Postgres/PostGIS + import scripts for Inglewood; React + MapLibre map; render footprints + logo markers from the DB.
2. **Profiles & UX:** hover cards, slide-over panels, category filters, neighbourhood selector.
3. **Real content:** Google Places integration for photos/hours; business self-serve portal + Stripe (the paid layer).
4. **City layers:** bike/pathways, events tab, attractions layer.
5. **Scale:** add neighbourhoods; polish the illustrated styling (optionally Stadia watercolour); SEO; launch.

---

## 11. Reproducing the data accuracy (notes for Nicholas)

- All Calgary geometry returns as **WGS84 lat/long GeoJSON** from Socrata — feeds straight into MapLibre/PostGIS.
- Business→building snapping: point-in-polygon against `uc4c-6kbd`, fallback to nearest centroid < 30 m.
- Simplify large line layers (bikeways were 11 MB raw) with Douglas–Peucker (~4 m tolerance) before serving.
- The prototype's Python scripts (`build3.py`, `build4.py`, `assign.py`) are a working reference for all of the above and can be handed over if useful.

---

## 12. Open decisions for Jonathan

- **Map engine:** MapLibre + CARTO (free) vs Mapbox (paid, more tooling) vs Stadia watercolour (paid, best look).
- **Pricing tiers** for the business subscription (flat $10/mo vs tiered — recommend tiered).
- **Events:** pursue Tourism Calgary partnership, or launch on Eventbrite/Ticketmaster/City data only?
- **Logos/photos:** require businesses to self-upload (paid layer) vs auto-pull from Google Places at launch for coverage.
