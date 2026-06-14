# app — CRM Demo Worker

A Cloudflare Worker that powers the Zoom Contact Centre CRM integration demo. It serves a branded web UI and provides a REST API that ZCC flows and demo frontends use to look up customer records, create/update cases, and manage demo data.

**Deployed at:** `app.eno.solutions/admin` LIVE 14.6.26

## What it does

- Serves a single-page demo application with branding presets for 7 CRMs (Salesforce, ServiceNow, HubSpot, Zendesk, Microsoft Dynamics, Halo, and a generic CRM), plus a **Multi-CRM combination mode**
- Performs customer lookups by phone number or email — against live Salesforce or a mock CRM backend
- Creates and updates customer records and support cases
- Provides an admin panel for seeding and resetting demo data

### Multi-CRM Combination Modes

Select **Multi-CRM** in the admin CRM Branding tab to combine any two or more CRMs into a single view. The first CRM selected is "primary" and drives the contact card styling and labels. The agent app then renders a branded panel per CRM below the contact card — each styled with that CRM's own colours and logo — allowing side-by-side demos of multiple integrations in one screen.

## Architecture

| Component | Details |
|---|---|
| Runtime | Cloudflare Worker (JavaScript) |
| Database | Cloudflare D1 (`zcc_crm_demo`) |
| Storage | Inline HTML served from the worker bundle |
| Auth | Cloudflare Access (Google SSO) — see `ACCESS.md` |

## API endpoints

| Endpoint | Description |
|---|---|
| `GET /` | Main demo app UI |
| `GET /admin` | Admin panel |
| `GET /api/config` | Returns current brand/CRM configuration |
| `POST /api/lookup` | Look up a customer by phone or email |
| `POST /api/customer/update` | Update customer record |
| `POST /api/record/update` | Update an existing case/record |
| `POST /api/record/create` | Create a new case/record |
| `POST /api/admin/seed` | Seed a demo scenario |
| `POST /api/admin/reset-all` | Reset all demo data |
| `POST /api/admin/config` | Update brand/CRM config |
| `GET /api/admin/seeds` | List seeded scenarios |
| `POST /api/admin/seeds/add` | Add a seed scenario |
| `POST /api/admin/seeds/delete` | Delete a seed scenario |

## CRM backends

**Salesforce** — Authenticates via client credentials OAuth and queries contacts + cases using SOQL. Configured via worker secrets (`SALESFORCE_TOKEN_URL`, `SALESFORCE_CLIENT_ID`, etc.).

**All other CRMs** — Use the mock CRM backend at `portal.zoomdemos.com`, authenticated with a per-user token. This allows demos without live CRM credentials.

## Development

```bash
npm run dev      # local dev server via wrangler
npm run deploy   # deploy to Cloudflare
npm test         # run vitest tests
```

Requires `wrangler` and a Cloudflare account with the D1 database provisioned. Run `wrangler d1 execute zcc_crm_demo --file=schema.sql` to initialise the database schema, then `seed.sql` for sample data.

### Database migrations

After the initial schema setup, apply any migrations in order:

```bash
npx wrangler d1 execute zcc_crm_demo --file=migrations/0001_add_combination_crms.sql --remote
```
