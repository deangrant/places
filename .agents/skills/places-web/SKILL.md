---
name: places-web
description: >-
  Design and implement the Places Vite React SPA: services composition,
  Places context slices, NDJSON HTTP client, Mapbox map, SearchFilters, and
  design tokens. Use when changing apps/web UI, MapView, or HttpPlacesApiClient.
trigger: >-
  places web, apps/web, Mapbox, SearchFilters, HttpPlacesApiClient, PlacesLayout,
  ServicesProvider, NDJSON, VITE_API_BASE_URL, PlacesContext
---

# Places web SPA

Apply these rules when you design, implement, or review [`apps/web`](../../../apps/web).

Lookup tables and file map: [reference.md](reference.md).

Keywords in this document:

| Keyword | Meaning |
| --- | --- |
| **must** | Required. Do not deviate. |
| **must not** | Forbidden. |
| **should** | Strongly preferred unless a reviewer agrees otherwise. |
| **may** | Optional. |

Use together with:

- [typescript-project-structure](../typescript-project-structure/SKILL.md) for folder layout
- [places-api-bff](../places-api-bff/SKILL.md) when changing the HTTP contract the client consumes
- [places-core](../places-core/SKILL.md) for shared DTO/taxonomy ownership
- [react-doctor](../react-doctor/SKILL.md) after large UI refactors
- [jsdoc-typescript-docs](../jsdoc-typescript-docs/SKILL.md) for comments

Conflict rule: folder layout from project-structure; OSM outbound policy from this skill + BFF (browser never hits Nominatim/Overpass).

---

## 1. Scope / posture

- The SPA **must** talk only to `VITE_API_BASE_URL` (Places BFF) plus Mapbox for map display.
- The browser **must not** call Nominatim or Overpass directly.
- Web HTTP **must** use existing `fetch` via `HttpPlacesApiClient`; **must not** add axios/ky/openapi clients.
- Deploy web and API from the same revision; cast success JSON to `places-core` DTOs with only light shape checks.

---

## 2. Composition root and DI

- Wire services once with [`createServices()`](../../../apps/web/src/services/create-services.ts) at the React boundary (`pages/Places`).
- UI and contexts **must** depend on `AppServices` ports (`placeSearch`, `placeExport`, `taxonomy`), not concrete HTTP types, except inside the HTTP adapter module.
- Wrap the tree in `ServicesProvider` + `PlacesProvider`.

---

## 3. Places context slices

Prefer the narrow hooks over `usePlaces()` when a component only needs one concern:

| Hook | Concern |
| --- | --- |
| `usePlacesSearch` | criteria, run/cancel search, loading, error, attempts, places |
| `usePlacesMap` | camera / fit-bounds |
| `usePlacesSelection` | selected place |
| `usePlaces` | full context (layouts that need several slices) |

---

## 4. HTTP client (NDJSON)

- Search requests **must** send `Accept: application/x-ndjson` and stream attempt/progress events before the final result body.
- Surface Overpass attempt progress through Places context (`overpassAttempts`); do not drop the stream for a single JSON parse unless the API contract changes.
- Resolve base URL only via `resolveApiBaseUrl()` / `VITE_API_BASE_URL`.

---

## 5. Mapbox and bundle

- Style **must** remain Mapbox light (`MAPBOX_STYLE_URL` → `mapbox://styles/mapbox/light-v11`) unless product explicitly changes it.
- Keep Mapbox in a lazy chunk: lazy `MapView`, Vite `manualChunks` for `mapbox-gl`, and Suspense fallbacks in `PlacesLayout`.
- Cluster/layer paint constants **should** stay centralized under `MapView/map-layers` (not scattered hex in random CSS).

---

## 6. UI structure and filters

- Places page UI **must** stay under `pages/Places/` (page-local containers). Do **not** recreate `components/containers/` for single-page use.
- Shared leaf controls live in `components/core/` (Button, Input, Select, …).
- Country Select **should** stay `searchable` (full ISO list from `places-core`).
- Brand is a **plain text** filter (exact OSM `brand` match on the API); **must not** reintroduce a brand autocomplete catalog unless product asks.

---

## 7. Design tokens

- Agent design-token description and recipes: [`DESIGN.md`](../../docs/DESIGN.md).
- Prefer CSS variables from [`styles/global.css`](../../../apps/web/src/styles/global.css): `--color-*`, `--space-*`, `--radius-*`, `--font-sans` (Sora).
- **Must not** invent a new purple/cream/light theme that fights the established dark green Places look when editing this app.
- User-global “expressive landing” design rules **must not** override this app’s existing system on Places surfaces.

---

## 8. Safety helpers

- External http(s) links **must** go through `safeHttpUrl`.
- `tel:` links **must** go through `safeTelHref`.

---

## 9. Verification

After non-trivial web changes:

```bash
pnpm --filter web exec vitest run <touched-test-files>
pnpm doctor:full
pnpm exec biome ci apps/web/src/<touched-path>
```
