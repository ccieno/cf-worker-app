# app — Eno Solutions Management UI

Browser-facing tool hub for managing Zoom Contact Centre demos. Admin routes are behind Cloudflare Access SSO (Google sign-in). The main app route is publicly accessible so it loads correctly when embedded in Zoom CC.

**Deployed at:** `app.eno.solutions`

## Routes

| Path | SSO required | Description |
|---|---|---|
| `GET /` | Yes | Landing page — tool grid with links to all tools |
| `GET /app` | No | CRM Demo App (embedded in Zoom CC) |
| `GET /triggers` | No | ZCC Variables control panel |
| `GET /nhs` | No | NHS MSO Status toggle |
| `GET /webleads` | No | Webleads address book form |
| `GET /sms` | No | Outbound SMS tool |
| `GET /email` | No | Outbound Email engagement tool |
| `GET /admin` | **Yes** | Admin panel |
| `GET /harness` | No | Test harness |
| `GET /api/*` | No | Data API routes |
| `GET /api/admin/*` | **Yes** | Admin API routes (returns 401 JSON if unauthenticated) |

## Authentication

Cloudflare Access handles authentication entirely at the CDN level — unauthenticated requests to protected routes are intercepted by Access before reaching the Worker. The Worker itself has no auth guard; it reads `Cf-Access-Authenticated-User-Email` only to personalise pages (e.g. landing page footer).

Routes like `/app` that are embedded in Zoom Contact Centre must remain unprotected by Access, as Zoom CC performs its own auth via the App SDK (ZAK token).

The authenticated user's email (when present) is injected into pages as `<meta name="cf-user">` and displayed in the landing page footer.

## Architecture

| Component | Details |
|---|---|
| Runtime | Cloudflare Worker (JavaScript) |
| Database | Cloudflare D1 (`zcc_crm_demo`) |
| HTML | Imported at build time from `src/ui/*.html` |
| Auth | Cloudflare Access (Google SSO) — admin routes only |
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
- **Path:** `/admin` (and `/api/admin/*` separately, or use path prefixes)
- **Policy:** Allow — Email ends in `@zoom.us` (or your domain)
