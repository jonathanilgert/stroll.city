# DigitalOcean deployment notes

## Host

- Host alias: `dirtlink`
- OS hostname: `Henry`
- Public IP: `159.89.125.8`
- App path: `/var/www/stroll.city/current/app`
- Nginx site: `/etc/nginx/sites-available/stroll.city`
- Systemd service: `stroll-city.service`

## Runtime model

The site runs as a dynamic Next.js app, not as only static `out/`, because Phase 3+ includes API routes:

- `/api/v1/calgary/businesses`
- `/api/v1/calgary/events`
- `/api/v1/calgary/attractions`
- `/portal`

## Deploy commands

From the app directory on the server:

```bash
npm ci
npm run build
systemctl restart stroll-city.service
nginx -t && systemctl reload nginx
```

## DNS and TLS

`stroll.city` and `www.stroll.city` point to `159.89.125.8`.

TLS is issued by Let's Encrypt via Certbot:

```bash
certbot --nginx --cert-name stroll.city -d stroll.city -d www.stroll.city
```

## Secrets

No secrets are committed to the repository. API write access should be configured by environment variables or runtime secret storage only.
