# stroll.city Phase 3 API + Agent Access

Phase 3 adds the first working versioned API surface for Stroll while preserving the public map experience.

## Implemented endpoints

Public read endpoints:

```text
GET /api/v1/:city/businesses?cat=&q=
GET /api/v1/:city/businesses/:slug
GET /api/v1/:city/events?from=&to=
GET /api/v1/:city/attractions
GET /api/v1/:city/layers/:kind
```

Supported layers:

```text
bike
pathway
pathways
trees
streets
```

Agent write endpoints:

```text
POST   /api/v1/:city/events
PATCH  /api/v1/:city/events/:id
DELETE /api/v1/:city/events/:id
POST   /api/v1/:city/attractions
PATCH  /api/v1/:city/attractions/:id
```

## Authentication

Write endpoints require:

```text
Authorization: Bearer <api-key>
```

Server environment variables:

```text
STROLL_API_KEY_PEPPER=<server-side pepper>
STROLL_API_KEYS_JSON=[{"label":"backend-agents","city":"calgary","scopes":["events:write","attractions:write"],"hash":"..."}]
```

Keys are not committed. Hashes are SHA-256 over:

```text
<pepper>:<api-key>
```

## Create a key

From `app/` with a server-side pepper set:

```bash
STROLL_API_KEY_PEPPER='<secret pepper>' npm run keys:create -- --label backend-agents --city calgary --scopes events:write,attractions:write
```

The script prints:

1. the raw key, shown once, for the password manager
2. the JSON record to place in server env

Do not paste the raw key in chat or commit it.

## Current persistence mode

Until Supabase is connected, writes use a local runtime overlay under:

```text
app/.stroll/runtime/:city/events.json
app/.stroll/runtime/:city/attractions.json
```

This makes the local/preview API testable now, but production should move writes to Supabase tables from Phase 2.

## Static export compatibility

Phase 3 introduced real API route handlers, so the default build is now dynamic Next/Vercel compatible:

```bash
npm run build
npm run start
```

The old static preview/export path is still available when needed:

```bash
npm run build:static
```

## Example public reads

```bash
curl https://stroll.city/api/v1/calgary/businesses?q=coffee
curl https://stroll.city/api/v1/calgary/events
curl https://stroll.city/api/v1/calgary/layers/trees
```

## Example agent write

```bash
curl -X POST https://stroll.city/api/v1/calgary/events \
  -H "Authorization: Bearer ***" \
  -H "Content-Type: application/json" \
  -d '{"name":"Neighbourhood patio night","venue":"9 Ave SE","starts_at":"2026-08-01T18:00:00-06:00","emoji":"🌇","lon":-114.037,"lat":51.039}'
```
