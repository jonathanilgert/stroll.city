# stroll.city Phase 4 Portal + Stripe Groundwork

Phase 4 converts the earlier portal preview into a working test-mode claim flow while keeping credentials out of source.

## Implemented

- Added `/portal` as a browser-based Calgary claim form.
- Added `POST /api/v1/:city/claims` to accept claim submissions.
- Added runtime persistence for claims and claimed-business presentation changes under `.stroll/runtime/<city>/`.
- Added logo upload preview support with image data URLs in the runtime overlay.
- Updated public business reads so claimed businesses return `logo_url`, `claim_status`, and `plan_tier`.
- Updated the Calgary map loader to merge public API data over the static JSON fallback, so a submitted test claim upgrades the marker after reload.
- Added Supabase-ready tables for `business_assets` and `subscriptions` to complement `business_claims`.

## Current runtime flow

1. Visit `/portal` or click “Claim your business” from `/calgary`.
2. Choose a real business from the Calgary licence-derived dataset.
3. Enter claimant details, choose a plan, and upload a logo image.
4. Submit the test-mode claim.
5. Reload `/calgary`; the business marker now renders the uploaded logo instead of the monogram/star.

## Stripe/Supabase production wiring still needed

The route is shaped for production but intentionally does not use real secrets in source:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PK`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

When these are configured in deployment, replace the runtime overlay bridge in `src/app/api/v1/_lib/data.ts` with writes to:

- `business_claims`
- `business_assets` / Supabase Storage bucket `business-assets`
- `subscriptions`
- `businesses.logo_url`, `businesses.claim_status`, and `businesses.plan_tier`

## Security notes

- Claims are public inserts only; review/admin reads should require service-role access.
- Subscription records must never be mutable by agent API keys.
- Uploaded assets should remain pending until the claim is approved.
- Test-mode runtime files are not a production database.
