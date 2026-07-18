# Constance business-enrichment workflow

Constance can safely help with stroll.city content if she uses a narrowly scoped API key rather than an admin key.

## Recommended scope

Use a dedicated key labelled `constance-business-enrichment` with only these scopes:

- `businesses:read`
- `businesses:write`
- optional later: `events:write`, `attractions:write`

Do **not** give content agents DNS, GitHub, server SSH, Stripe, or Supabase service-role credentials.

## Read businesses

```bash
curl https://stroll.city/api/v1/calgary/businesses
```

## Patch one business

```bash
curl -X PATCH https://stroll.city/api/v1/calgary/businesses/75154b1f16b5 \
  -H "Authorization: Bearer $STROLL_CONSTANCE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "website": "https://brooklyndumplingshop.com",
    "domain": "brooklyndumplingshop.com",
    "phone": "+1 825-540-1650",
    "logo_url": "/media/businesses/logos/brooklyn-dumplings-shop-75154b1f16b5-logo.png",
    "photo": "/media/businesses/heroes/brooklyn-dumplings-shop-75154b1f16b5-hero.jpg",
    "needsReview": false
  }'
```

## Supported patch fields

- `category`
- `blurb`
- `hours`
- `website`
- `phone`
- `domain`
- `photo`
- `logo_url`
- `highlights`
- `needsReview`
- `source`

## Operating notes

- Updates currently land in a runtime overlay on the server. Nicholas should periodically reconcile approved overlay updates back into `app/public/data/stroll-data.json` and commit them.
- Media assets should still be cached locally under `/media/businesses/...`; Constance should not hotlink random third-party images in production unless Nicholas adds a proper upload/media-cache endpoint.
- The key should be delivered through Bitwarden or another secure channel, never in chat or Git.
