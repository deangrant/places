---
name: places-api-bff
description: >-
  Design and implement the Places Node BFF (Nominatim/Overpass): REST routes,
  CORS, RFC 9457 errors, validation, outbound resilience, health probes, and
  zero-dependency posture. Use when scaffolding apps/api, changing Places HTTP
  contracts, or reviewing BFF behavior before Cloudflare hosting.
trigger: >-
  places api, apps/api, Node BFF, Nominatim proxy, Overpass API, places search
  endpoint, problem+json, CORS_ORIGINS
---

# Places API BFF

Apply these rules when you design, implement, or review [`apps/api`](../../../apps/api)
and the Places HTTP contract used by [`apps/web`](../../../apps/web).

Lookup tables, problem `type`s, and env vars: [reference.md](reference.md).

Keywords in this document:

| Keyword | Meaning |
| --- | --- |
| **must** | Required. Do not deviate. |
| **must not** | Forbidden. |
| **should** | Strongly preferred unless a reviewer agrees otherwise. |
| **may** | Optional. |

Use together with:

- [solid-typescript-design](../solid-typescript-design/SKILL.md) for modules and DI
- [jsdoc-typescript-docs](../jsdoc-typescript-docs/SKILL.md) for comments
- [typescript-project-structure](../typescript-project-structure/SKILL.md) for web layout and `*-service.ts` naming

Conflict rule: HTTP/BFF contract rules come from this skill; TypeScript module design from SOLID; comments from JSDoc; React/web folder layout from project-structure.

---

## 1. Scope / posture

- `apps/api` **must** be the only process that calls public Nominatim and Overpass.
- The browser **must not** call Nominatim or Overpass directly.
- This app is the product API for one web client over Nominatim/Overpass. Keep
  orchestration thin: validate, resolve area, build QL, query, normalize, return
  DTOs. Do not invent fake “core microservices” underneath.
- Cloudflare later **may** act as edge/gateway (TLS, global limits). Prefer
  long-running Node or Containers for Overpass wall-clock; Workers are a poor
  fit for ~180s sync budgets without redesign.
- Local development **must** remain first-class: Node API + Vite web, no Wrangler
  required for day-to-day work.

---

## 2. Dependencies (zero third-party by default)

| Area | Rule |
| ---- | ---- |
| `packages/places-core` | **Must** have zero runtime dependencies |
| `apps/api` | **Must** use Node builtins (`node:http`, `node:url`, `fetch`, `AbortSignal`, etc.) |
| Web HTTP adapters | **Must** use existing `fetch`; **must not** add axios/ky/openapi clients |
| Validation | Type guards / allowlists — **must not** add zod/valibot/yup |
| Rate limiting | In-process token bucket with Node builtins only (see §13) |

**Absolutely necessary bar:** add a third-party package only if a builtin cannot
meet a hard requirement (for example platform crypto) and document why in the
PR. Convenience, “everyone uses X”, or Cloudflare adapters do **not** meet the
bar. Express, Fastify, and similar frameworks do **not** meet the bar.

Reuse workspace catalog tooling (`typescript`, `vitest`) already used by `web`.
Do not add new test/build frameworks for the split.

---

## 3. URI and verbs

- Paths **must** use plural `places` and kebab-case.
- Controller-style actions **must** be:
  - `POST /places/search`
  - `POST /places/export`
- Health **must** be:
  - `GET /health/live`
  - `GET /health/ready`
- Target Richardson Maturity Model **Level 2** (resources + HTTP verbs + status
  codes). Do **not** require HATEOAS.
- `GET` **must not** mutate state. Do **not** tunnel all operations through a
  single RPC-style `POST` unrelated to these actions.
- Versioning **may** wait until a public multi-client surface exists.

---

## 4. CORS

- **Must** use an explicit origin allowlist from config (`CORS_ORIGINS`).
- **Must** handle `OPTIONS` preflight.
- **Must not** use `Access-Control-Allow-Origin: *` with credentials.
- Allow-Methods / Allow-Headers **must** match real routes (`POST`, `GET`,
  `OPTIONS`, `Content-Type`, `Accept`).
- CORS **must not** be treated as authorization.

---

## 5. Request validation

- **Must** validate request bodies server-side with allowlists before business
  logic.
- Reject unknown properties when practical (`additionalProperties`-style).
- Cap body size; oversized payloads **must** return **413**.
- Malformed JSON **must** return **400**; semantic validation failures **must**
  return **422** with field `errors` (see §7).
- Overpass QL construction **must** escape/allowlist inputs so user strings
  cannot break out of QL literals.

---

## 6. Success responses

- Success bodies **must** be bare JSON DTOs (`PlaceSearchResult`, export places
  payload). **Must not** wrap in `{ data, meta }` envelopes.
- Clients **must** branch on HTTP status first; never encode failure as `200`
  with an error object.
- Prefer **200** with a body for completed search/export.

---

## 7. Errors (RFC 9457)

- Error responses **must** use `Content-Type: application/problem+json`.
- Problem bodies **must** include `type`, `title`, `status`, and `detail`.
- Validation failures **should** include an `errors` map of field → messages.
- **Must not** leak stack traces, secrets, or internal host details in
  production responses.
- Catalogue stable `type` URIs in [reference.md](reference.md).

---

## 8. Data formats

- JSON property names **must** be camelCase.
- Enumerations **must** be strings.
- Timestamps, if present, **must** be RFC 3339 UTC (`…Z`).
- Document null vs omit consistently for optional fields.

---

## 9. Outbound resilience (Nominatim / Overpass)

- Nominatim requests **must** send a real `User-Agent` and configured contact
  email (not `places-explorer@localhost`).
- Overpass clients **must** send the same identifying `User-Agent` (and a JSON
  `Accept`) on interpreter requests; public mirrors often return 406 without it.
- Overpass clients **must** use explicit timeouts and limited failover across
  configured interpreters.
- Retry **only** transient failures (for example 406/408/429/502/503/504,
  network blips). Use exponential backoff with jitter when retrying.
- **Must not** amplify load with unbounded retries against public OSM endpoints.
- Long Overpass timeout **must not** mean infinite retries.

---

## 10. Long-running work policy

- This pass **must** use synchronous request/response with documented Overpass
  and client timeouts (today on the order of ~180s client / ~300s QL).
- Graduate to **202** + job resources only when hosting cannot hold the
  connection (for example Workers wall-clock) or public SLAs require it.
- Do **not** half-implement webhooks or job polling in this pass.

---

## 11. Health probes

- `GET /health/live` **must** mean process up (no dependency checks that cause
  restart storms).
- `GET /health/ready` **must** mean the process can take traffic. Public Overpass
  blips **should not** flip ready to 503 in a way that causes orchestrator
  thrash; treat upstream OSM as degraded carefully.
- Probes **must** be unauthenticated and cheap.

---

## 12. Security (pre-auth)

- Secrets and contact identity **must** come from env (see [reference.md](reference.md)).
- **Must** scrub logs of tokens and full query dumps when not needed for debug.
- Enforce body size caps, CORS allowlists, and Places route rate limits (§13).
- Authn/authz **must not** be inventented in this pass; document as deferred.
- When publicly hosted, TLS/HSTS **should** be terminated at the edge (for
  example Cloudflare). CORS **must not** be treated as authorization.

---

## 13. Rate limiting (required for public hosting)

- **Must** apply an in-process per-IP token bucket on `POST /places/search` and
  `POST /places/export` (Node builtins only; no third-party limiter package).
- **Must** also cap per-IP concurrent expensive requests (defense against
  parallel ~180s Overpass calls).
- Client over quota → **429** + `Retry-After` + `RateLimit-*`.
- Concurrent overload for that client → **503** + `Retry-After`.
- Health probes **must** remain unlimited.
- Key identity **must** use `socket.remoteAddress` (normalize IPv4-mapped IPv6).
  **Must not** trust `X-Forwarded-For` until an explicit trusted-proxy mode exists.
- In-memory limits are per process; multi-instance fleets **should** add edge or
  shared-store limits later. Edge (Cloudflare) limits remain recommended
  defense-in-depth when publicly hosted.
- Follow `api-rate-limiting` conventions for headers and 429 vs 503.

---

## 14. Checklist

- [ ] Browser never calls Nominatim/Overpass directly?
- [ ] No new third-party runtime deps unless the absolute-necessity bar is met?
- [ ] Routes match §3 (`/places/search`, `/places/export`, live/ready)?
- [ ] CORS allowlist + preflight configured?
- [ ] Success bodies bare DTOs; errors `application/problem+json`?
- [ ] Validation returns 400/413/422 appropriately?
- [ ] Nominatim `User-Agent` + contact email from env?
- [ ] Outbound timeouts + bounded Overpass failover?
- [ ] Per-IP rate limit + concurrency cap on search/export with 429/503 headers?
- [ ] Handlers separable for a future CF/Containers adapter?
- [ ] SOLID + JSDoc + project-structure skills followed on changed TypeScript?
