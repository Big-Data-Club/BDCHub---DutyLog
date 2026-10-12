#!/usr/bin/env python3
import sys
from pathlib import Path
p=Path(sys.argv[1]); s=p.read_text()
if 'registration.RegisterRoutes(api, db)' in s:
 print('Router already patched');raise SystemExit(0)
imp='appdb "github.com/Big-Data-Club/BDCHub-DutyLog/backend/internal/db"'
assert s.count(imp)==1
s=s.replace(imp,imp+'\n\t"github.com/Big-Data-Club/BDCHub-DutyLog/backend/internal/registration"')
anchor='\t// ── Organisation & Member sync: pull from Auth Service'
assert s.count(anchor)==1
s=s.replace(anchor, '\t// Additive booking migration; fail startup if schema is not ready.\n\tif err := registration.Migrate(db); err != nil { log.Fatalf("[MAIN] %v", err) }\n'+anchor)
anchor='\t\tapi.Use(middleware.OptionalAuth())'
assert s.count(anchor)==1
s=s.replace(anchor,anchor+'\n\t\tregistration.RegisterRoutes(api, db)')
p.write_text(s)
print('Added reservation import, V004 migration and routes; existing routes untouched.')
