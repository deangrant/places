# Places API BFF — reference

## Problem `type` catalogue

Use stable URIs under a Places docs base (adjust host when public docs exist):

| `type` suffix | HTTP | When |
| --- | --- | --- |
| `/errors/bad-request` | 400 | Malformed JSON or unreadable body |
| `/errors/payload-too-large` | 413 | Body exceeds size cap |
| `/errors/validation` | 422 | Semantic field validation failed (including unknown `categoryId`, missing filters, unresolvable location, unsupported OSM tags) |
| `/errors/not-found` | 404 | Unknown route |
| `/errors/method-not-allowed` | 405 | Wrong verb for path |
| `/errors/rate-limited` | 429 | Per-IP Places quota exceeded |
| `/errors/service-unavailable` | 503 | Per-IP concurrent Places cap exceeded |
| `/errors/upstream-timeout` | 504 | Nominatim/Overpass client timeout |
| `/errors/upstream-unavailable` | 502 | Upstream failed after retries/failover |
| `/errors/upstream-rejected` | 502 | Upstream returned non-retryable error (not client validation) |
| `/errors/internal` | 500 | Unexpected server failure |

Example validation body:

```json
{
  "type": "https://places.local/errors/validation",
  "title": "Validation failed",
  "status": 422,
  "detail": "One or more fields are invalid",
  "errors": {
    "countryCode": ["must be a supported ISO country code"]
  }
}
```

## Status pairing (quick)

| Outcome | Status |
| --- | --- |
| Search/export OK | 200 |
| Live/ready OK | 200 |
| Ready cannot take traffic | 503 |
| Malformed | 400 |
| Too large | 413 |
| Validation | 422 |
| Missing route | 404 |
| Client over Places quota | 429 |
| Client concurrent Places overload | 503 |
| Upstream timeout | 504 |
| Upstream failure | 502 |

Never return `200` with an error object.

Domain/client validation failures (unknown category, missing filters, bad
OSM tags, unresolvable location) **must** be **422** `/validation`, not
**502**. Reserve **502**/**504** for true Nominatim/Overpass outages and
timeouts.

Rate-limit responses **must** include `Retry-After`, `RateLimit-Limit`,
`RateLimit-Remaining`, and `RateLimit-Reset`.

## Environment variables (`apps/api`)

| Variable | Purpose |
| --- | --- |
| `PORT` | Listen port (default `8787`) |
| `CORS_ORIGINS` | Comma-separated allowlist (e.g. `http://localhost:5173`) |
| `NOMINATIM_USER_AGENT` | Identifying User-Agent for Nominatim |
| `NOMINATIM_EMAIL` | Contact email for Nominatim usage policy |
| `NOMINATIM_ENDPOINT` | Optional override of Nominatim search URL |
| `OVERPASS_ENDPOINTS` | Optional comma-separated interpreter URLs |
| `RATE_LIMIT_PLACES_BURST` | Token-bucket capacity for search/export (default `5`) |
| `RATE_LIMIT_PLACES_REFILL_PER_MINUTE` | Sustained refill rate (default `5`) |
| `RATE_LIMIT_PLACES_MAX_CONCURRENT` | Max in-flight search/export per IP (default `2`) |

Web:

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | API origin (e.g. `http://localhost:8787`) |

## Locked routes

| Method | Path | Body / notes |
| --- | --- | --- |
| `GET` | `/health/live` | No body; not rate-limited |
| `GET` | `/health/ready` | No body; not rate-limited |
| `POST` | `/places/search` | `PlaceSearchCriteria` → `PlaceSearchResult`; rate-limited |
| `POST` | `/places/export` | Criteria + geometry mode → places for CSV; rate-limited |

## Rate limiting notes

- In-memory per process; keyed by `socket.remoteAddress` + `places-expensive`.
- Does not trust `X-Forwarded-For` (spoof risk without trusted-proxy config).
- Multi-instance deployments need edge or shared-store limits for fleet-wide caps.
- No third-party rate-limit package unless the absolute-necessity bar is met.

## When a third-party dependency is allowed

Allowed only if:

1. A Node/Web builtin cannot meet a hard requirement, and
2. The PR documents the requirement and the rejected builtin alternatives.

Not allowed for: routers, validation libraries, HTTP client wrappers, rate
limiters, or “Cloudflare-ready” frameworks in this pass.

## Cloudflare migration notes

| Concern | Guidance |
| --- | --- |
| Static web | Cloudflare Pages fits Vite `dist` |
| API process | Prefer Containers / long-running Node for Overpass ~180s budgets |
| Workers | Wall-clock usually too short for current sync Overpass policy |
| Rate limits | App-layer per-IP limits are required; edge limits recommended as defense-in-depth |
| Handlers | Keep domain logic free of `node:http` specifics where practical so an adapter can wrap later |
