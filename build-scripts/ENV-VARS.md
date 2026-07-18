# Expected environment variables / secrets (store in Bitwarden → inject at deploy)

| Variable | Service | Notes |
|----------|---------|-------|
| CALGARY_APP_TOKEN | Calgary Open Data (Socrata) | Raises rate limits; send as `X-App-Token` header |
| GOOGLE_MAPS_API_KEY | Google Maps Platform | Places + Street View + Geocoding; restrict by referrer/IP |
| STRIPE_SECRET_KEY | Stripe | Server-side billing |
| STRIPE_WEBHOOK_SECRET | Stripe | Verify subscription webhooks |
| STRIPE_PUBLISHABLE_KEY | Stripe | Client-side checkout |
| SUPABASE_URL | Supabase | Project URL |
| SUPABASE_ANON_KEY | Supabase | Client-side |
| SUPABASE_SERVICE_ROLE_KEY | Supabase | Server-side (keep secret) |
| EVENTBRITE_TOKEN | Eventbrite API | Events tab |
| TICKETMASTER_API_KEY | Ticketmaster Discovery API | Events tab |
| STADIA_API_KEY | Stadia Maps | Optional watercolour basemap |
| MAPBOX_TOKEN | Mapbox | Only if using Mapbox instead of MapLibre+CARTO |

**Never commit these to the repo.** Inject from Bitwarden / the host's secret manager.
