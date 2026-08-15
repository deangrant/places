---
name: places-vitest
description: >-
  Write and run Places Vitest suites for places-core, apps/api, and apps/web:
  harness reuse, jsdom/RTL setup, colocated tests, and no live OSM in unit
  tests. Use when adding or fixing tests across the monorepo.
trigger: >-
  vitest, withServer, http-listener-harness, testing-library, jsdom,
  places test, mockServices, colocated test
---

# Places Vitest

Apply these rules when you add or change tests under `packages/places-core`,
`apps/api`, or `apps/web`.

Keywords in this document:

| Keyword | Meaning |
| --- | --- |
| **must** | Required. Do not deviate. |
| **must not** | Forbidden. |
| **should** | Strongly preferred unless a reviewer agrees otherwise. |
| **may** | Optional. |

Use together with package skills ([places-api-bff](../places-api-bff/SKILL.md),
[places-web](../places-web/SKILL.md), [places-core](../places-core/SKILL.md)).

---

## 1. Shared rules

- Prefer **colocated** `*.test.ts` / `*.test.tsx` next to the module under test.
- Unit and listener tests **must not** call live Nominatim or Overpass.
- Do **not** introduce a second test runner (Jest, Playwright, Cypress) for unit work.
- Run the package filter that owns the change; use `pnpm test` before claiming a full green tree.

---

## 2. `places-core`

- Vitest via package script `pnpm --filter places-core test`.
- After changing exports consumed by api/web, **must** run `pnpm --filter places-core build` so `dist/` matches source.

---

## 3. `apps/api`

- Config: [`vitest.config.ts`](../../../apps/api/vitest.config.ts) — `environment: "node"`.
- HTTP tests **should** reuse [`src/test/http-listener-harness.ts`](../../../apps/api/src/test/http-listener-harness.ts):
  - `testConfig()` / `mockServices()` / `withServer()`
- Mock domain ports (`placeSearch`, geocoding, Overpass) instead of hitting the network.
- Relative imports **must** keep `.js` suffixes (NodeNext).

```bash
pnpm --filter api test
```

---

## 4. `apps/web`

- Config: Vite Vitest — `environment: "jsdom"`, `setupFiles: ["./src/test/setup.ts"]`, test env `VITE_API_BASE_URL`.
- Use Testing Library (`@testing-library/react`, jest-dom matchers from setup).
- Prefer rendering public components with providers/`createServices()` isolation over brittle internals.
- Do **not** fetch the real BFF or OSM from unit tests; stub `fetch` or inject services.

```bash
pnpm --filter web exec vitest run <path-to-test>
```

---

## 5. What not to do

- Do **not** add e2e frameworks in this skill’s scope without an explicit product decision.
- Do **not** skip the API harness to hand-roll `createServer` listen/close in every file.
- Do **not** assert against live Overpass latency or Nominatim content.
