# 22 · Deploying DutyLog through CoreApplication

> **Status:** Compose topology observed; K3s production must be inspected separately · **Reviewed:** October 13, 2026

## Compose integration

The referenced `CoreApplication/docker-compose.yml` builds `dutylog-service` from `./dutylog/backend`, sets `PORT=8086`, connects to `postgres-lms`, and uses `redis-lms` with database index 4. JWT settings come from Core configuration. Traefik exposes `/dutylogapiv1` and rewrites that prefix to the application's internal `/api/v1` routing. Kafka is present in CoreApplication, but DutyLog's active event producer/consumer behavior is not established.

```text
https://<gateway>/dutylogapiv1/rooms/CS1-303-B9/occupancy
           | Traefik path rewrite
           v
http://dutylog-service:8086/api/v1/rooms/CS1-303-B9/occupancy
```

## Local development versus full deployment

For Expo Web visual testing, connect to an approved staging backend through the dev proxy. To test the Go API locally, use PostgreSQL, Redis, and correctly scoped test Auth claims. There is no need to run all CoreApplication services, Kafka, or a full Kubernetes cluster on a two-core Dell laptop solely to review frontend layout.

## K3s verification procedure

1. Inspect checked-in manifests and the **actual cluster state**; do not extrapolate from Compose.
2. Check deployment/service names, namespace, exposed port, Traefik host and path rules, TLS, CORS, readiness probes, secret references, and ConfigMaps.
3. Verify image digest and run `kubectl rollout status` after an approved rollout.
4. Apply additive migrations on staging first; confirm backup and recovery procedures.
5. Update CoreApplication's DutyLog submodule SHA through an independently reviewed pull request.

Read-only inspection commands (adjust names and namespace to your deployment):

```bash
kubectl -n default get deployments,svc,ingress | grep -i dutylog
kubectl -n default get deploy dutylog-service -o wide
kubectl -n default rollout status deploy/dutylog-service --timeout=120s
kubectl -n default logs deploy/dutylog-service --tail=100
```

Do not paste logs that contain personal information. Never restart a production deployment merely to test a UI change without change authorization.

## Incident clues

| Observation | Likely investigation |
|---|---|
| Health returns OK, organizations blank | Organization sync freshness, Auth URL, authorization, client parsing. |
| Gateway 404 | Incorrect prefix rewrite, ingress route, or missing Go route. |
| Gateway 502 | Upstream DNS, service port, process availability. |
| Migration failure | Incompatible schema; stop rollout and investigate backup/recovery. |
| UI booking flow before backend deployment | Disable/feature-flag booking; never fabricate confirmation. |

## Source references

- [docker-compose.yml](https://github.com/Big-Data-Club/CoreApplication/blob/main/docker-compose.yml)
- [k3s](https://github.com/Big-Data-Club/CoreApplication/tree/main/k3s)

---
[Home](Home) · [API Contract](API-Contract) · [Roadmap & Backend Gaps](Roadmap-and-Backend-Gaps)
