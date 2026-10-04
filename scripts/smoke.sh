#!/usr/bin/env bash
set -euo pipefail
origin="${1:?Provide the API origin}"
for path in /health/live /health/ready /; do
  curl --fail --silent --show-error --retry 12 --retry-all-errors --retry-delay 5 \
    --connect-timeout 10 --max-time 30 "$origin$path" --output /dev/null
done
node scripts/verify-catalog.mjs "$origin"
