#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "${1:?usage ./scripts/check.sh /path/to/repo}" && pwd)"
python3 - "$ROOT" <<'PY'
from pathlib import Path
import sys
r=Path(sys.argv[1]); rt=(r/'backend/cmd/server/main.go').read_text(); cl=(r/'mobile/src/api/client.ts').read_text(); screen=(r/'mobile/src/screens/v2/RegistrationScreen.tsx').read_text()
for key in ['registration.Migrate(db)','registration.RegisterRoutes(api, db)','fail-closed API hardening v2']:
 assert key in (rt+cl), key
for path in ['backend/internal/registration/routes.go','backend/internal/registration/schema.go','mobile/src/api/reservations.ts','mobile/src/platform/sessionStore.ts']:
 assert (r/path).is_file(),path
assert 'bookShift(' in screen and 'fetchAvailability(' in screen
for old in ['demo-jwt-token','restored-offline-token','sig_hmac','using local shift logging']:
 assert old not in cl, f'unsafe fallback still in client: {old}'
print('Static contract/wiring checks: PASS')
PY
if command -v gofmt >/dev/null; then find "$ROOT/backend/internal/registration" -name '*.go' -print0 | xargs -0 -r gofmt -l; fi
echo 'Next: go test ./...; npx tsc --noEmit; staging integration with JWT, real database'
