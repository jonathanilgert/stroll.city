# stroll.city — Build Instructions for AI Developer Agent

**From:** Jonathan
**Design source of truth:** `strollyyc-mvp.html` (in this folder — open it in a browser before writing any code)
**Data reference:** `Stroll-Build-Handoff-for-Nicholas.md`, `build-scripts/` (working Python import scripts)
**Domain:** `stroll.city` (registered at Porkbun; API access available)
**First city:** Calgary at `stroll.city/calgary`

---

## 1. What you are building

Stroll is a "friendlier Google Maps" for a city's trendy streets: an illustrated top-down map with real building footprints, each business's logo stamped on its rooftop as a clickable button. Hover shows a photo card; click opens a slide-over profile without leaving the map. Businesses pay a monthly subscription to curate their presence. The MVP file `strollyyc-mvp.html` demonstrates the exact look, feel, and interactions required — **match it, don't reinterpret it.**

**Multi-city is a core requirement.** One codebase, one backend, path-based cities: `stroll.city/calgary`, later `stroll.city/edmonton`, etc. Every city shares identical functionality but has its own theme (colours, brand accent, logo arch colours), its own neighbourhoods, and its own data. Nothing city-specific may be hard-coded.

---

## 2. Architecture

| Layer | Choice | Notes |
|---|---|---|
| Frontend | **Next.js 14+ (App Router) + MapLibre GL JS** | Route: `app/[city]/page.tsx`. MapLibre is free/open-source. |
| Styling | CSS variables injected per city from DB | The MVP's `:root` block becomes a per-city theme record. |
| Backend API | Next.js API routes (or NestJS if preferred) | REST, JSON. |
| Database | **PostgreSQL + PostGIS** (Supabase) | Geospatial queries, point-in-polygon snapping. |
| Auth (business portal) | Supabase Auth | Email + OAuth. |
| Payments | Stripe subscriptions | Tiers below. |
| Hosting | Vercel (frontend + API) + Supabase (DB) | Free tiers to start. |
| Basemap | CARTO `rastertiles/voyager` (keyless) | Same tiles as MVP. |

### URL structure

```
stroll.city                  → landing page: city picker (Calgary live, others coming soon)
stroll.city/calgary          → the map app (Inglewood default strip)
stroll.city/calgary?hood=inglewood        → deep-link to a strip
stroll.city/calgary?biz=<slug>            → deep-link opens that business's panel
stroll.city/portal           → business self-serve portal (claim/subscribe)
stroll.city/api/v1/...       → public + agent API
```

---

## 3. Database schema (minimum)

```sql
cities        (id, slug, name, tagline, center geometry(Point), default_zoom,
               theme jsonb, status text)          -- theme = the CSS variable set
neighbourhoods(id, city_id, slug, name, status,   -- 'live' | 'soon'
               bounds geometry(Polygon), bearing, center geometry(Point))
buildings     (id, city_id, source_id, footprint geometry(Polygon), roof_variant int)
businesses    (id, city_id, neighbourhood_id, building_id, slug, name, category,
               licence_id, address, lon, lat, blurb, hours, highlights jsonb,
               logo_url, photo_urls jsonb, website, phone,
               tier text,                          -- 'free' | 'stroll' | 'stroll_plus'
               claimed_by uuid, verified boolean)
events        (id, city_id, name, venue, starts_at, ends_at, source text,
               lon, lat, emoji, url, created_by_key uuid)
attractions   (id, city_id, name, emoji, lon, lat, blurb, photo_url)
layers        (id, city_id, kind,                  -- 'bike' | 'pathway' | 'trees'
               geojson jsonb, updated_at)
api_keys      (id, key_hash text, label text, city_id nullable,
               scopes text[], created_at, last_used_at, revoked boolean)
subscriptions (id, business_id, stripe_customer_id, stripe_sub_id, tier, status)
```

### City theme (`cities.theme` jsonb) — Calgary's exact values

Taken from the MVP; these are the official City of Calgary + Blue Sky City colours:

```json
{
  "primary":  "#C8102E",  "primaryDark": "#A00D25",
  "grey": "#4b4f55", "sky": "#009ADE", "skyDark": "#0077AD",
  "sun": "#F2A900", "green": "#43893E", "ink": "#26282c",
  "categories": {
    "restaurant": "#C8102E", "cafe": "#A96B3F", "bar": "#E0A100",
    "shop": "#00847E", "services": "#B25C87", "gallery": "#5E63B6"
  },
  "archColors": ["#C8102E", "#009ADE", "#F2A900"],
  "headerStripe": ["#C8102E", "#009ADE", "#F2A900"],
  "welcomeGradient": ["#0E86C4", "#2FA5DC", "#8FD0EE", "#DCF1FB"],
  "brandTag": "Blue Sky City · street map",
  "welcomeLine": "Calgary is the Blue Sky City. This is its friendliest map — real streets, real buildings, and every local business one tap away."
}
```

A new city = one `cities` row with a different theme + neighbourhoods + running the import pipeline. Zero code changes.

---

## 4. Frontend spec — replicate the MVP exactly

Open `strollyyc-mvp.html`. Every component below exists there; port it to React components with the same visuals, spacing, animation timing and behaviour.

**Typography:** Archivo (weights 400–900, incl. stretched 108–115% for display) + Public Sans (body). Google Fonts.

**Components to build (names suggested):**

1. `WelcomeOverlay` — full-screen Blue Sky gradient, drifting clouds, three-colour arch SVG logo, `stroll.city` wordmark, city tagline, "Start strolling →" button. Shows on first visit per city (localStorage flag); brand click reopens it.
2. `Header` — white, 4px tri-colour top stripe, arch logo + wordmark, `NeighbourhoodPicker` dropdown (live/coming-soon badges; "soon" flies camera + toast), `SearchBox` (live results, select → flyTo + open panel), Whole city / Fit to strip buttons, red "Claim your business" CTA.
3. `Sidebar` — two tabs. **Explore:** category filters with counts/checkboxes, select-all/clear-all, "Getting around" layer toggles (pathways solid green, bikeways dashed sky-blue), "Beyond the strip" attractions toggle, blue open-data note. **Events:** event cards (date chip in city primary colour, source pill); click flies to event and shows red event pins.
4. `StrollMap` — MapLibre with: CARTO voyager raster base, tree-canopy soft circles (minzoom 14.5), pathway/bike line layers, building shadow + painted roof fills (9-colour ROOF palette from the MVP) + soft edge lines, bearing −25° on strip fit.
5. `BizMarker` — 30px white circle, 2.5px category-colour ring, logo image or monogram, springy hover scale (1.35, `cubic-bezier(.34,1.56,.64,1)`).
6. `HoverThumb` — 200px anchored card: photo (gradient + emoji fallback), category tag, "click to open ›", name, blurb, open-status; hover-bridge so the cursor can travel into the card.
7. `BizPanel` — 400px slide-over (never a new tab): hero photo/gradient, "✕ keep strolling", name in Archivo 800, open status, blurb, highlights, find-it block, "Is this your business? Claim this page" row, actions (Visit page / Directions / Reviews). Esc + scrim close it.
8. `AttractionPin` (blue teardrop, emoji) + `AttractionPanel` — citywide layer, visible at low zoom.
9. `PortalModal` → becomes the real portal page: 4-step claim flow, three tiers — **Free $0** (verified pin, name/category/address, monogram), **Stroll $29/mo** (real logo, photo gallery, curated profile, hours/highlights/links, open-now), **Stroll+ $59/mo** (everything + post events/promos to map, featured placement, analytics). Stripe checkout; licence lookup verifies claims against the businesses table.
10. `Toast` — grey pill, bold Archivo lead-in, used for onboarding hint / coming-soon / demo notices.
11. **Mobile** (≤920px): sidebar becomes a bottom sheet, bottom pill bar (Filters / Events / Re-centre), full-width map.

**Data fidelity rules (from the handoff doc, § 11):** businesses snap to the footprint containing their licence point, else nearest centroid within 30 m; multiple logos per building allowed; simplify heavy line layers (Douglas–Peucker ~4 m) before serving; all geometry WGS84 GeoJSON.

---

## 5. Data pipeline

Port the working Python scripts (`build-scripts/`) into scheduled jobs (Supabase cron or GitHub Actions) writing to Postgres:

| Data | Source | ID |
|---|---|---|
| Building footprints | Calgary Socrata | `uc4c-6kbd` |
| Street centrelines | Calgary Socrata | `4dx8-rtm5` |
| Business licences | Calgary Socrata | `vdjc-pybd` |
| Public trees | Calgary Socrata | `tfs4-3wwa` |
| Bikeways | Calgary Socrata | `jjqk-9b73` |
| Parks/river pathways | Calgary Socrata | `qndb-27qm` |
| City events | Calgary Socrata | `n625-9k5x` |
| Events (supplement) | Eventbrite + Ticketmaster APIs | free keys |
| Photos/hours (paid tier assist) | Google Places API | billed key |

Query pattern: `https://data.calgary.ca/resource/{id}.geojson?$where=within_box({col},{NWlat},{NWlon},{SElat},{SElon})&$limit=N`. Get a free Socrata app token. The pipeline takes `(city, neighbourhood bbox)` as parameters — this is what makes "adding a strip = one DB row + one pipeline run" true.

---

## 6. Agent API — automated backend access (Jonathan's requirement)

Jonathan runs other AI agents that must programmatically update events, attractions, businesses, etc. Build a versioned REST API with **API-key authentication**.

### 6.1 Key management — build this, then generate keys

**Do not hard-code any key.** Implement:

- Keys are random 32-byte tokens, format `sk_stroll_<base62>`, shown **once** at creation; only a SHA-256 hash is stored in `api_keys`.
- Each key has: label, optional city scope (null = all cities), scopes array, revoked flag.
- Scopes: `events:write`, `events:read`, `attractions:write`, `businesses:write`, `businesses:read`, `layers:write`, `admin`.
- Management: CLI script (`npm run keys:create -- --label "events-agent" --city calgary --scopes events:write`) and/or admin-only endpoint. Rotation = create new + revoke old.

**At the end of the build:** generate (1) one `admin` key for Jonathan and (2) one `events:write,attractions:write`-scoped key labelled `backend-agents`, and deliver them to Jonathan through a secure channel (not committed to the repo, not in chat logs, not in `.env.example`). Jonathan: store them in a password manager; give downstream agents only the scoped key, never the admin key.

### 6.2 Endpoints (`/api/v1`)

Auth header: `Authorization: Bearer sk_stroll_...`

```
Public (no key):
GET  /api/v1/:city/businesses?hood=&cat=&q=
GET  /api/v1/:city/businesses/:slug
GET  /api/v1/:city/events?from=&to=
GET  /api/v1/:city/attractions
GET  /api/v1/:city/layers/:kind          -- bike | pathway | trees
GET  /api/v1/:city/neighbourhoods
GET  /api/v1/cities

Agent (key required, scope in parentheses):
POST   /api/v1/:city/events              (events:write)   -- upsert by (name, starts_at, venue)
PATCH  /api/v1/:city/events/:id          (events:write)
DELETE /api/v1/:city/events/:id          (events:write)
POST   /api/v1/:city/attractions         (attractions:write)
PATCH  /api/v1/:city/attractions/:id     (attractions:write)
PATCH  /api/v1/:city/businesses/:id      (businesses:write) -- hours, blurb, highlights, photos
POST   /api/v1/:city/pipeline/run        (admin)            -- re-import a neighbourhood bbox
POST   /api/v1/keys                      (admin)
DELETE /api/v1/keys/:id                  (admin)
```

Example agent call:

```bash
curl -X POST https://stroll.city/api/v1/calgary/events \
  -H "Authorization: Bearer sk_stroll_xxx" \
  -H "Content-Type: application/json" \
  -d '{"name":"Inglewood Night Market","venue":"9 Ave SE between 12 & 13 St",
       "starts_at":"2026-07-24T17:00:00-06:00","ends_at":"2026-07-24T22:00:00-06:00",
       "lon":-114.0330,"lat":51.0424,"emoji":"🏮","source":"Eventbrite"}'
```

### 6.3 API guardrails (required)

- Rate limit: 60 req/min per key (429 on excess). Log every write with key id.
- Validate coordinates fall inside the target city's bounding box; reject otherwise.
- Sanitize all string fields (these render into the map UI — no HTML injection).
- Writes from agents land as `pending` OR are auto-published but soft-deletable — keep an audit trail so a misbehaving agent can be rolled back with one query.
- Never let any key scope touch `subscriptions`/Stripe data.

---

## 7. Domain & DNS (Porkbun)

The domain `stroll.city` is at Porkbun and agents have Porkbun API credentials. Steps:

1. Deploy frontend to Vercel; add `stroll.city` and `www.stroll.city` as project domains.
2. Via Porkbun API (`https://api.porkbun.com/api/json/v3/dns/create/stroll.city`, body includes `apikey` + `secretapikey`):
   - `A` record, host `@` → Vercel's apex IP (check Vercel's current docs; historically `76.76.21.21`).
   - `CNAME`, host `www` → `cname.vercel-dns.com`.
   - Delete Porkbun's default parking records first (`dns/retrieve` then `dns/delete`).
3. Verify HTTPS is issued by Vercel, and that `stroll.city/calgary` serves the app.
4. Porkbun API keys: keep in the deployment environment only. **Do not** store them in the repo or expose them to the events/attractions agents — DNS access and content access must be separate keys with separate blast radii.

---

## 8. Environment variables

```
DATABASE_URL=                    # Supabase Postgres
SUPABASE_URL= / SUPABASE_ANON_KEY= / SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY= / STRIPE_WEBHOOK_SECRET= / NEXT_PUBLIC_STRIPE_PK=
SOCRATA_APP_TOKEN=               # free, data.calgary.ca
GOOGLE_MAPS_API_KEY=             # Places/Street View (paid tier features)
EVENTBRITE_TOKEN= / TICKETMASTER_KEY=
API_KEY_PEPPER=                  # server-side secret mixed into key hashing
```

---

## 9. Build phases & acceptance criteria

**Phase 1 — Foundation.** DB schema + Calgary import pipeline (Inglewood bbox) + Next.js `[city]` route rendering the map from Postgres. ✅ *Accept:* `stroll.city/calgary` shows the same 140 Inglewood businesses on the same painted footprints as `strollyyc-mvp.html`, side-by-side indistinguishable.

**Phase 2 — Full UX.** All components in §4 incl. mobile. ✅ *Accept:* hover cards, panels, filters, search, neighbourhood picker, welcome overlay, toasts behave identically to the MVP; Lighthouse mobile ≥ 85.

**Phase 3 — Agent API.** §6 complete with tests. ✅ *Accept:* a scoped key can create/update/delete an event via curl and it appears on the live map's Events tab within one reload; revoked keys get 401; out-of-city coords get 422.

**Phase 4 — Portal + Stripe.** Claim flow, tiers, logo/photo upload (Supabase Storage), Stripe subscriptions. ✅ *Accept:* test-mode claim of a real Inglewood licence upgrades the marker from monogram to uploaded logo.

**Phase 5 — Multi-city proof.** Add a second city record (can be a stub, e.g. Edmonton, status `soon`) with a different theme. ✅ *Accept:* `stroll.city/edmonton` renders the shell in that city's colours with zero code changes; `stroll.city` landing lists both.

**Phase 6 — Launch polish.** DNS live (§7), SEO/meta per city, error/empty states, analytics.

---

## 10. Hard rules

1. `strollyyc-mvp.html` is the visual spec. When in doubt, open it and copy what it does.
2. No city-specific values in code — everything themable lives in the `cities` table.
3. Secrets never enter the repo. Keys are delivered to Jonathan once, securely, then only hashes exist server-side.
4. The map never opens new tabs for business content — the slide-over panel is the product's identity.
5. Real data only for geometry and licences (City open data); placeholder photos/logos are acceptable until businesses claim their pages.
