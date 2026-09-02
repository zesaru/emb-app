#!/usr/bin/env bash
set -euo pipefail

# Start EMB's isolated Supabase project, then run Next.js with local keys.
# Production .env.local is intentionally not modified or sourced.
npx supabase start >/dev/null

status_env="$(npx supabase status -o env)"
read_status_var() {
  printf '%s\n' "$status_env" | awk -F= -v key="$1" '$1 == key { value = substr($0, index($0, "=") + 1); gsub(/^"|"$/, "", value); print value; exit }'
}

export NEXT_PUBLIC_SUPABASE_URL="$(read_status_var API_URL)"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="$(read_status_var ANON_KEY)"
export SUPABASE_SERVICE_ROLE_KEY="$(read_status_var SERVICE_ROLE_KEY)"
export DATABASE_URL="$(read_status_var DB_URL)"
export NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"

if [[ -z "$NEXT_PUBLIC_SUPABASE_URL" || -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]]; then
  echo "No se pudieron obtener las credenciales locales de Supabase" >&2
  exit 1
fi

exec ./node_modules/.bin/next dev --port "${PORT:-3000}"
