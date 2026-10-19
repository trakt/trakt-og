#!/usr/bin/env bash
# Deploy origin/main to og.trakt.tv from a fresh temporary worktree, after running `deno task ci` on it.
# Humans only, as a manual fallback: merges to main already deploy through GitHub Actions.
set -euo pipefail

root=$(git rev-parse --show-toplevel)
env_file="$root/projects/client/.env.production"
client_id=$(sed -n 's/^TRAKT_CLIENT_ID=//p' "$env_file" 2>/dev/null || true)
if [[ -z "$client_id" ]]; then
  echo "Add TRAKT_CLIENT_ID=<og.trakt.tv production app ID> to projects/client/.env.production before deploying." >&2
  exit 1
fi
echo "Building with TRAKT_CLIENT_ID ${client_id:0:6}… from .env.production"
# A shell export would override the file, so the production key always comes from it.
unset TRAKT_CLIENT_ID

git -C "$root" fetch --quiet origin main
dir=$(mktemp -d "${TMPDIR:-/tmp}/og-deploy.XXXXXX")
trap 'git -C "$root" worktree remove --force "$dir" >/dev/null 2>&1 || true' EXIT
git -C "$root" worktree add --quiet --detach "$dir" origin/main
cp "$env_file" "$dir/projects/client/.env.production"
cd "$dir"
deno install --frozen
deno task client:ci
cd projects/client
deno run -A npm:wrangler deploy --message "main $(git rev-parse --short HEAD), deployed locally"
