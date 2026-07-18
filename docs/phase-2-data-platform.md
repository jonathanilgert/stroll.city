# stroll.city Phase 2 Data Platform Groundwork

Phase 2 starts moving the Phase 1 static MVP toward a real data/product platform without breaking the static preview.

## Implemented in this slice

- Added `supabase/schema.sql` for the future Supabase/PostGIS database.
- Added `npm run export:supabase-seed` to generate `supabase/seed.sql` from the current static Calgary JSON.
- Kept credentials out of the repo/files. This phase uses no API keys.
- Added front-end product-path previews:
  - claim/business portal modal
  - plan tiers: Free, Stroll, Stroll+
  - attraction profile panels for citywide discovery pins
  - safer panel closing via Escape/scrim

## Files

- `supabase/schema.sql` — database tables, indexes, RLS, and public read/write policies.
- `supabase/seed.sql` — generated seed from `app/public/data/stroll-data.json`.
- `app/scripts/export-supabase-seed.mjs` — repeatable seed exporter.
- `app/src/app/StrollCityApp.tsx` — Phase 2 UI/product-flow preview.
- `app/src/app/page.module.css` — modal, attraction panel, and mobile styles.

## How to regenerate seed SQL

From `app/`:

```bash
npm run export:supabase-seed
```

This reads:

```text
app/public/data/stroll-data.json
```

and writes:

```text
supabase/seed.sql
```

## Supabase apply path later

Once the real Supabase project is ready and credentials are configured outside source control:

```bash
psql "$SUPABASE_DB_URL" -f supabase/schema.sql
psql "$SUPABASE_DB_URL" -f supabase/seed.sql
```

or use Supabase CLI migrations after creating a project.

## Current seed coverage

The exporter covers:

- city record
- neighbourhoods
- businesses
- business-building footprints
- attraction/demo discovery pins

Events are intentionally left as a later live-feed/import step because Phase 1 currently uses UI sample events, not a durable event source.

## Next Phase 2 steps

1. Create the Supabase project and apply schema/seed.
2. Add read-only Supabase client with fallback to static JSON.
3. Add admin/claim submission endpoint for `business_claims`.
4. Connect Stripe only after claim workflow copy/pricing is approved.
