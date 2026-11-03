#!/usr/bin/env bash
# Fetch third-party tools. They are gitignored, so run this after a fresh clone.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WHAT="${1:-all}"

get() {  # name url
  local dir="$ROOT/tools/$1"
  if [ -d "$dir/.git" ] || [ -f "$dir/package.json" ]; then
    echo "  $1 already present — skipping"
  else
    echo "  cloning $1 ..."
    git clone --depth 1 -q "$2" "$dir"
  fi
}

[ "$WHAT" = "all" ] || [ "$WHAT" = "nullmotion" ] && \
  get nullmotion https://github.com/blixvip/NullMotion

echo "done. Null Motion: cd tools/nullmotion && npm start  -> http://127.0.0.1:4343"
