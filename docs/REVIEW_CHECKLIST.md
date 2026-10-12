# PR review / staged rollout gates

- [ ] Maintain existing v1 router endpoints + schema unchanged
- [ ] Backend tests and Go vet pass against checked-out module
- [ ] PostgreSQL migration applied to staging and retried safely
- [ ] Test org membership from Auth sync and user_id JWT formats
- [ ] Set real JWT_SECRET (no default), rate limits and TLS
- [ ] Concurrency capacity-1 test (>100 simultaneous requests)
- [ ] Browser CORS proxy uses approved staging, not production
- [ ] `npx tsc --noEmit` and Expo Web smoke pass
- [ ] Web auth remains secure after page refresh/logout
- [ ] Booking create/delete and idempotency tested from UI
- [ ] Existing scanner/barcode/QR routes do not return fake success on failure
- [ ] Check-in/checkout RBAC and replay audit performed (pending in this overlay)
- [ ] Kafka/outbox/offline queue explicitly remain separate until verified
- [ ] CI env secrets, rollout, backup/restore plans approved
- [ ] Reconcile BACKEND_GAPS tracker only after integration evidence linked
