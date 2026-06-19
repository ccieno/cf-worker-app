# app — Eno Solutions Management UI

Browser-facing tool hub for managing Zoom Contact Centre demos. All routes are behind Cloudflare Access SSO (Google sign-in). Can be embedded as a Zoom App.

**Deployed at:** `app.eno.solutions`

## Routes

| Path | Description |
|---|---|
| `GET /` | Landing page — tool grid with links to all tools |
| `GET /app` | CRM Demo App |
| `GET /triggers` | ZCC Variables control panel |
| `GET /nhs` | NHS MSO Status toggle |
| `GET /webleads` | Webleads address book form |
| `GET /sms` | Outbound SMS tool |
| `GET /email` | Outbound Email engagement tool |
| `GET /admin` | Admin panel |
| `GET /harness` | Test harness |
| `GET /api/*` | Internal API routes (returns 401 JSON if unauthenticated) |

## Authentication

All routes are protected by Cloudflare Access. The `Cf-Access-Authenticated-User-Email` header is injected by the Access proxy and checked by the worker on every request. Unauthenticated requests receive a sign-in prompt page (HTML) or a 401 JSON error (API routes).

The authenticated user's email is injected into pages as `<meta name="cf-user">` and displayed in the landing page footer.

## Architecture

| Component | Details |
|---|---|
| Runtime | Cloudflare Worker (JavaScript) |
| Database | Cloudflare D1 (`zcc_crm_demo`) |
| HTML | Imported at build time from `src/ui/*.html` |
| Auth | Cloudflare Access (Google SSO) |
| API calls | All tool UIs call `https://api.eno.solutions` cross-origin |

## Content Security Policy

All pages set:
- `connect-src` includes `https://api.eno.solutions` (for tool API calls)
- `script-src` includes `https://appssdk.zoom.us` (for Zoom App SDK)
- `frame-ancestors https://zoom.us https://*.zoom.us` (for Zoom App embedding)

## CRM backends

**Salesforce** — Client credentials OAuth, SOQL queries for contacts and cases.

**All other CRMs** — Mock CRM backend at `portal.zoomdemos.com`.

## Development

```bash
npm run dev      # local dev server via wrangler
npm run deploy   # deploy to Cloudflare
npm test         # run vitest tests
```

## Cloudflare Access setup (dashboard)

Create an Access Application:
- **Domain:** `app.eno.solutions`
- **Path:** `/*`
- **Policy:** Allow — Email ends in `@zoom.us` (or your domain)
