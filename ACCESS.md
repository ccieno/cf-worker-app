# Cloudflare Access setup

The Worker checks `Cf-Access-Authenticated-User-Email` — any request missing that header gets a 401. Cloudflare Access sits in front and handles the Google SSO flow before requests reach the Worker.

## Script setup

Create a Cloudflare API token with:

- Account scope: your Cloudflare account
- Permission: `Access: Apps and Policies Write`

Then run:

```sh
export CLOUDFLARE_API_TOKEN="..."
export ALLOW_EMAIL="your-email@example.com"
scripts/configure-access.sh
```

The script creates or updates:

- Self-hosted Access app: `app.eno.solutions`
- Allow policy: `Allow owner`
- Include rule: exact email from `ALLOW_EMAIL`
- `auto_redirect_to_identity: true` — users are sent straight to Google login

## Dashboard setup (alternative)

Cloudflare Zero Trust > Access > Applications > Add application:

- Type: Self-hosted
- Name: App Eno Solutions
- Domain: `app.eno.solutions`
- Policy action: Allow
- Include: Emails, `your-email@example.com`
- Session duration: 24 hours
- Enable: Auto-redirect to identity provider

## Additional allowed users

To grant access to more users, add more `email` rules to the policy include list, or switch to an `email_domain` rule to allow a whole domain (e.g. `zoom.us`).
