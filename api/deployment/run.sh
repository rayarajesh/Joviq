#!/usr/bin/env bash
set -euo pipefail
cd /home/site/wwwroot
dotnet Joviq.Lms.Api.dll --initialize
