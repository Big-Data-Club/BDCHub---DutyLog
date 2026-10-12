#!/usr/bin/env python3
import sys
from pathlib import Path
root=Path(sys.argv[1])
router=(root/'backend/cmd/server/main.go').read_text()
client=(root/'mobile/src/api/client.ts').read_text()
checks={
 'Go module':(root/'backend/go.mod').exists(),
 'Gin route group':'api := r.Group("/api/v1")' in router,
 'migration call':'appdb.RunMigrations(db)' in router,
 'appdb import':'appdb "github.com/Big-Data-Club/BDCHub-DutyLog/backend/internal/db"' in router,
 'mobile API token':'export function getAuthToken()' in client,
 'mobile auth request':'export async function loginWithCredentials(' in client,
 'mobile barcode':'export async function performCheckIn(' in client,
}
for name,okay in checks.items(): print(f'{"OK" if okay else "FAIL"}: {name}')
if not all(checks.values()):
 raise SystemExit('Repo version unexpected; patch deliberately stopped before editing.')
