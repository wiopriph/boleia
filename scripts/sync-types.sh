#!/usr/bin/env sh
# Copies the generated Supabase types from boleia-db. The contract lives there; never edit the copy by hand.
set -eu
src="${BOLEIA_DB_DIR:-$(dirname "$0")/../../boleia-db}/types/database.ts"
dst="$(dirname "$0")/../types/database.ts"
[ -f "$src" ] || { echo "not found: $src" >&2; exit 1; }
{
  echo "// Generated in boleia-db (scripts/gen-types.sh). Do not edit: run npm run sync-types."
  cat "$src"
} > "$dst"
echo "synced $(wc -l < "$dst" | tr -d ' ') lines -> $dst"
