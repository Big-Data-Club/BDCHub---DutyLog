#!/usr/bin/env bash
set -euo pipefail
MOBILE="${1:-}"
if [[ -z "$MOBILE" || ! -f "$MOBILE/package.json" ]]; then echo 'Usage: ./scripts/run-expo-web.sh /path/to/repo/mobile' >&2;exit 2; fi
: "${DUTYLOG_UPSTREAM:?Set DUTYLOG_UPSTREAM to approved staging base URL}"
: "${DUTYLOG_AUTH_UPSTREAM:?Set DUTYLOG_AUTH_UPSTREAM to approved staging auth base URL}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export EXPO_PUBLIC_API_URL="http://localhost:8090/dutylogapiv1"
export EXPO_PUBLIC_AUTH_URL="http://localhost:8090/apiv1"
(cd "$MOBILE" && npx expo start --web --port 8081 --clear) & EXPO_PID=$!
trap 'kill "$EXPO_PID" 2>/dev/null || true' EXIT INT TERM
node "$SCRIPT_DIR/dev-web-proxy.mjs"
