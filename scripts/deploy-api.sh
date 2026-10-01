#!/usr/bin/env bash
set -euo pipefail
: "${AZURE_RESOURCE_GROUP:?Required}"
: "${AZURE_API_NAME:?Required}"
: "${DEPLOY_ENVIRONMENT:?Required}"
artifact="${1:?Provide the API zip path}"
slot_args=()
if [[ "$DEPLOY_ENVIRONMENT" == production && "${AZURE_USE_RELEASE_SLOT:-false}" == true ]]; then
  slot_args=(--slot release)
elif [[ "$DEPLOY_ENVIRONMENT" != dev && "$DEPLOY_ENVIRONMENT" != production ]]; then
  echo 'Unsupported deployment environment' >&2
  exit 1
fi

az webapp deploy --resource-group "$AZURE_RESOURCE_GROUP" --name "$AZURE_API_NAME" \
  "${slot_args[@]}" --src-path "$artifact" --type zip --clean true --track-status false --output none

host=$(az webapp show --resource-group "$AZURE_RESOURCE_GROUP" --name "$AZURE_API_NAME" \
  "${slot_args[@]}" --query defaultHostName --output tsv)
# Zip deployment returns before the Linux worker and its private-network routing are ready.
curl --fail --silent --show-error --retry 30 --retry-all-errors --retry-delay 10 \
  --connect-timeout 10 --max-time 30 "https://$host/health/live" --output /dev/null

# Run inside App Service so PostgreSQL stays private. Compare run IDs to avoid accepting an older success.
job_found=false
for _attempt in $(seq 1 30); do
  jobs=$(az webapp webjob triggered list --resource-group "$AZURE_RESOURCE_GROUP" --name "$AZURE_API_NAME" \
    "${slot_args[@]}" --output json)
  if [[ $(printf '%s' "$jobs" | node scripts/webjob-status.mjs exists) == true ]]; then job_found=true; break; fi
  sleep 5
done
if [[ "$job_found" != true ]]; then echo 'Initialization WebJob was not discovered' >&2; exit 1; fi
previous=$(printf '%s' "$jobs" | node scripts/webjob-status.mjs id)
az webapp webjob triggered run --resource-group "$AZURE_RESOURCE_GROUP" --name "$AZURE_API_NAME" \
  "${slot_args[@]}" --webjob-name initialize --output none
initialized=false
for _attempt in $(seq 1 90); do
  jobs=$(az webapp webjob triggered list --resource-group "$AZURE_RESOURCE_GROUP" --name "$AZURE_API_NAME" \
    "${slot_args[@]}" --output json)
  status=$(printf '%s' "$jobs" | node scripts/webjob-status.mjs status "$previous")
  if [[ "$status" == Success ]]; then initialized=true; break; fi
  if [[ "$status" == Failed || "$status" == Aborted ]]; then
    echo 'Database initialization failed. Inspect the initialize WebJob logs in Azure.' >&2
    exit 1
  fi
  sleep 10
done
if [[ "$initialized" != true ]]; then echo 'Database initialization timed out' >&2; exit 1; fi

host=$(az webapp show --resource-group "$AZURE_RESOURCE_GROUP" --name "$AZURE_API_NAME" \
  "${slot_args[@]}" --query defaultHostName --output tsv)
bash scripts/smoke.sh "https://$host"
if [[ "$DEPLOY_ENVIRONMENT" == production && "${AZURE_USE_RELEASE_SLOT:-false}" == true ]]; then
  az webapp deployment slot swap --resource-group "$AZURE_RESOURCE_GROUP" --name "$AZURE_API_NAME" \
    --slot release --target-slot production --output none
fi
host=$(az webapp show --resource-group "$AZURE_RESOURCE_GROUP" --name "$AZURE_API_NAME" --query defaultHostName --output tsv)
bash scripts/smoke.sh "https://$host"
