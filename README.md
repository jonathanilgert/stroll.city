# stroll.city

Map-first neighbourhood discovery MVP for stroll.city. The current live city is Calgary/Inglewood, built with Next.js, MapLibre, City of Calgary open data, local business media enrichment, public API route groundwork, and a claim/portal preview.

## Structure

```text
app/          Next.js app, API routes, scripts, public static data/media
build-scripts/ Source data import/prototype scripts from the handoff package
docs/         Phase notes and deployment docs
reports/      Enrichment reports
supabase/     Supabase/PostGIS schema and seed output
```

## Local development

```bash
cd app
npm install
npm run lint
npm run build
npm run start -- --hostname 127.0.0.1 --port 3017
```

Static export fallback:

```bash
cd app
npm run build:static
npx --yes serve@latest out -l tcp://127.0.0.1:3017
```

## Deployment

Production is intended to run as a dynamic Next.js app behind Nginx so the `/api/v1/...` routes and `/portal` claim preview remain available.

Runtime-only files are intentionally excluded from Git:

- `.env*`
- `app/.stroll/` runtime overlays/claims
- `app/.next/`, `app/out/`, `app/node_modules/`
- credential handoff PDF / API keys

See `docs/deployment-digitalocean.md` for the current DigitalOcean deployment notes.
