#!/usr/bin/env bash
set -euo pipefail

ACCOUNT_ID="${ACCOUNT_ID:-b1311a3efb25667db13a32cf4760998f}"
APP_DOMAIN="${APP_DOMAIN:-app.eno.solutions}"
APP_NAME="${APP_NAME:-App Eno Solutions}"
ALLOW_EMAIL="${ALLOW_EMAIL:-github@ccieno.com}"
SESSION_DURATION="${SESSION_DURATION:-24h}"

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "Set CLOUDFLARE_API_TOKEN to a token with Access: Apps and Policies Write." >&2
  exit 1
fi

api() {
  local method="$1"
  local path="$2"
  local data="${3:-}"

  if [[ -n "$data" ]]; then
    curl -sS -X "$method" "https://api.cloudflare.com/client/v4$path" \
      -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
      -H "Content-Type: application/json" \
      --data "$data"
  else
    curl -sS -X "$method" "https://api.cloudflare.com/client/v4$path" \
      -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"
  fi
}

apps_path="/accounts/$ACCOUNT_ID/access/apps"
existing_app_id="$(api GET "$apps_path" | jq -r --arg domain "$APP_DOMAIN" '.result[]? | select(.domain == $domain) | .id' | head -n 1)"

app_body="$(jq -n \
  --arg name "$APP_NAME" \
  --arg domain "$APP_DOMAIN" \
  --arg duration "$SESSION_DURATION" \
  '{
    name: $name,
    domain: $domain,
    type: "self_hosted",
    session_duration: $duration,
    app_launcher_visible: true,
    auto_redirect_to_identity: true,
    service_auth_401_redirect: true,
    destinations: [{ type: "public", uri: $domain }]
  }')"

if [[ -n "$existing_app_id" ]]; then
  echo "Updating Access application $existing_app_id for $APP_DOMAIN"
  app_response="$(api PUT "$apps_path/$existing_app_id" "$app_body")"
else
  echo "Creating Access application for $APP_DOMAIN"
  app_response="$(api POST "$apps_path" "$app_body")"
fi

echo "$app_response" | jq -e '.success == true' >/dev/null
app_id="$(echo "$app_response" | jq -r '.result.id')"

policy_path="$apps_path/$app_id/policies"
existing_policy_id="$(api GET "$policy_path" | jq -r '.result[]? | select(.name == "Allow owner") | .id' | head -n 1)"

policy_body="$(jq -n \
  --arg email "$ALLOW_EMAIL" \
  --arg duration "$SESSION_DURATION" \
  '{
    name: "Allow owner",
    decision: "allow",
    include: [{ email: { email: $email } }],
    require: [],
    exclude: [],
    session_duration: $duration
  }')"

if [[ -n "$existing_policy_id" ]]; then
  echo "Updating Access policy $existing_policy_id for $ALLOW_EMAIL"
  policy_response="$(api PUT "$policy_path/$existing_policy_id" "$policy_body")"
else
  echo "Creating Access policy for $ALLOW_EMAIL"
  policy_response="$(api POST "$policy_path" "$policy_body")"
fi

echo "$policy_response" | jq -e '.success == true' >/dev/null
echo "Access is configured for https://$APP_DOMAIN"
