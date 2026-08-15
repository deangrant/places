# Places API BFF — reference

## Problem `type` catalogue

Use stable URIs under a Places docs base (adjust host when public docs exist):

| `type` suffix | HTTP | When |
| ------------- | ---- | ---- |
| `/errors/bad-request` | 400 | Malformed JSON or unreadable body |
| `/errors/payload-too-large` | 413 | Body exceeds size cap |
| `/errors/validation` | 422 | Semantic field validation failed |
| `/errors/not-found` | 404 | Unknown route |
| `/errors/method-not-allowed` | 405 | Wrong verb for path |
| `/errors/upstream-timeout` | 504 | Nominatim/Overpass client timeout |
| `/errors/upstream-unavailable` | 502 | Upstream failed after retries/failover |
| `/errors/upstream-rejected` | 502 | Upstream returned non-retryable error |
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
| ------- | ------ |
| Search/export OK | 200 |
| Live/ready OK | 200 |
| Ready cannot take traffic | 503 |
| Malformed | 400 |
| Too large | 413 |
| Validation | 422 |
| Missing route | 404 |
| Upstream timeout | 504 |
| Upstream failure | 502 |

Never return `200` with an error object.

## Environment variables (`apps/api`)

| Variable | Purpose |
| -------- | ------- |
| `PORT` | Listen port (default `8787`) |
| `CORS_ORIGINS` | Comma-separated allowlist (e.g. `http://localhost:5173`) |
| `NOMINATIM_USER_AGENT` | Identifying User-Agent for Nominatim |
| `NOMINATIM_EMAIL` | Contact email for Nominatim usage policy |
| `NOMINATIM_ENDPOINT` | Optional override of Nominatim search URL |
| `OVERPASS_ENDPOINTS` | Optional comma-separated interpreter URLs |

Web:

| Variable | Purpose |
| -------- | ------- |
| `VITE_API_BASE_URL` | API origin (e.g. `http://localhost:8787`) |

## Locked routes

| Method | Path | Body / notes |
| ------ | ---- | ------------ |
| `GET` | `/health/live` | No body |
| `GET` | `/health/ready` | No body |
| `POST` | `/places/search` | `PlaceSearchCriteria` → `PlaceSearchResult` |
| `POST` | `/places/export` | Criteria + geometry mode → places for CSV |

## When a third-party dependency is allowed

Allowed only if:

1. A Node/Web builtin cannot meet a hard requirement, and
2. The PR documents the requirement and the rejected builtin alternatives.

Not allowed for: routers, validation libraries, HTTP client wrappers, rate
limiters, or “Cloudflare-ready” frameworks in this pass.

## Cloudflare migration notes

| Concern | Guidance |
| ------- | -------- |
| Static web | Cloudflare Pages fits Vite `dist` |
| API process | Prefer Containers / long-running Node for Overpass ~180s budgets |
| Workers | Wall-clock usually too short for current sync Overpass policy |
| Rate limits | Still deferred at app layer; edge limits may appear at CF later |
| Handlers | Keep domain logic free of `node:http` specifics where practical so an adapter can wrap later |

## Deferred rate limiting (later)

When implementing:

- Per-IP token bucket (tighter on search/export)
- **429** + `Retry-After` + `RateLimit-*` for client over quota
- **503** + `Retry-After` for process overload
- No third-party rate-limit package unless the absolute-necessity bar is met
