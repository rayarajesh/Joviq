#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
: "${TestAccounts__AdminPassword:?Configure the test administrator password in Key Vault}"
: "${TestAccounts__StudentPassword:?Configure the test student password in Key Vault}"
export TestAccounts__Enabled=true
dotnet Joviq.Lms.Api.dll --seed-test-accounts
