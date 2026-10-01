#!/usr/bin/env bash
set -euo pipefail
output="${1:-artifacts/api}"
dotnet publish api/src/Joviq.Lms.Api/Joviq.Lms.Api.csproj --configuration Release --output "$output"
mkdir -p "$output/App_Data/jobs/triggered/initialize"
cp api/deployment/run.sh api/deployment/settings.job "$output/App_Data/jobs/triggered/initialize/"
chmod +x "$output/App_Data/jobs/triggered/initialize/run.sh"
node -e 'const fs=require("node:fs"); fs.writeFileSync(process.argv[1], JSON.stringify({commit:process.env.GITHUB_SHA || "local", builtAt:new Date().toISOString()}))' "$output/release.json"
mkdir -p "$output/wwwroot"
cp "$output/release.json" "$output/wwwroot/release.json"
