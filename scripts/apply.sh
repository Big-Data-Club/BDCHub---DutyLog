#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-}"
if [[ -z "$ROOT" || ! -f "$ROOT/backend/cmd/server/main.go" || ! -f "$ROOT/mobile/src/api/client.ts" ]]; then
  echo 'Usage: ./scripts/apply.sh /path/to/BDCHub---DutyLog (real checked-out repository)' >&2
  exit 2
fi
ROOT="$(cd "$ROOT" && pwd)"
BASE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP="$ROOT/.git/dutylog-ui-v2-backups/$(date +%Y%m%d-%H%M%S)"
if [[ ! -d "$ROOT/.git" ]]; then BACKUP="$ROOT/.dutylog-ui-v2-backup-$(date +%Y%m%d-%H%M%S)"; fi
mkdir -p "$BACKUP"
python3 "$BASE/scripts/preflight.py" "$ROOT"
# Preserve overwritten files byte-for-byte, including existing local user changes.
while IFS= read -r -d '' f; do
  rel="${f#$BASE/}"
  if [[ "$rel" == scripts/* || "$rel" == docs/* ]]; then continue; fi
  if [[ -f "$ROOT/$rel" ]]; then mkdir -p "$BACKUP/$(dirname "$rel")"; cp "$ROOT/$rel" "$BACKUP/$rel"; fi
done < <(find "$BASE/backend" "$BASE/mobile" -type f -print0)
mkdir -p "$BACKUP/backend/cmd/server" "$BACKUP/mobile/src/api"
cp "$ROOT/backend/cmd/server/main.go" "$BACKUP/backend/cmd/server/main.go"
cp "$ROOT/mobile/src/api/client.ts" "$BACKUP/mobile/src/api/client.ts"
while IFS= read -r -d '' f; do
  rel="${f#$BASE/}"
  mkdir -p "$ROOT/$(dirname "$rel")"
  cp "$f" "$ROOT/$rel"
done < <(find "$BASE/backend" "$BASE/mobile" -type f -print0)
python3 "$BASE/scripts/patch-router.py" "$ROOT/backend/cmd/server/main.go"
python3 "$BASE/scripts/harden-client.py" "$ROOT/mobile/src/api/client.ts"
mkdir -p "$ROOT/docs/dutylog-v2"
cp "$BASE/docs/"* "$ROOT/docs/dutylog-v2/"
echo "Applied UI + additive booking API overlay. Backup: $BACKUP"
echo "Now run: cd '$ROOT/backend' && go test ./... && go vet ./..."
echo "Then: cd '$ROOT/mobile' && npx tsc --noEmit && npx expo start --web"
