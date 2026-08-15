---
name: places-core
description: >-
  Own shared Places types, taxonomy, country options, OSM tag allowlists, and
  Overpass timing constants in packages/places-core with zero runtime
  dependencies. Use when changing DTOs, CATEGORY_DEFINITIONS, COUNTRY_OPTIONS,
  or OSM helpers consumed by api and web.
trigger: >-
  places-core, CATEGORY_DEFINITIONS, COUNTRY_OPTIONS, OSM_TAG_KEY_ALLOWLIST,
  PlaceSearchCriteria, taxonomy, RESULT_LIMIT, Overpass endpoints
---

# Places core package

Apply these rules when you design, implement, or review
[`packages/places-core`](../../../packages/places-core).

Keywords in this document:

| Keyword | Meaning |
| --- | --- |
| **must** | Required. Do not deviate. |
| **must not** | Forbidden. |
| **should** | Strongly preferred unless a reviewer agrees otherwise. |
| **may** | Optional. |

Use together with:

- [places-api-bff](../places-api-bff/SKILL.md) when API validation or Overpass QL depends on these constants
- [places-web](../places-web/SKILL.md) when the SPA consumes DTOs or taxonomy
- [solid-typescript-design](../solid-typescript-design/SKILL.md) for service boundaries
- [jsdoc-typescript-docs](../jsdoc-typescript-docs/SKILL.md) for comments

---

## 1. Scope / posture

- `places-core` **must** remain a pure shared library: types, constants, taxonomy, geometry helpers.
- **Must** have **zero runtime dependencies** (devDependencies: TypeScript, Vitest only).
- Consumers import the package export; after changes, **must** run `pnpm --filter places-core build` so `dist/` matches source.
- Apps **must not** fork DTO shapes or duplicate taxonomy/timeouts; change them here once.

---

## 2. Owned surfaces

| Export area | Role |
| --- | --- |
| `types/places.types.ts` | `Place`, `PlaceSearchCriteria`, geocode/OSM DTOs |
| `CATEGORY_DEFINITIONS` | Curated industry taxonomy + OSM tag predicates |
| `CategoryTaxonomy` | Lookup / first-match labeling |
| `COUNTRY_OPTIONS` | Full ISO 3166-1 alpha-2 UI list (English names A–Z) |
| `OSM_TAG_KEY_ALLOWLIST` | Advanced filter tag keys |
| Overpass constants | Endpoints, timeouts, `RESULT_LIMIT`, retry backoff |
| Geometry utils | Normalization / WKT helpers used by export |

---

## 3. Taxonomy

- Category assignment **must** stay **first-match** order in `CATEGORY_DEFINITIONS` (not scored best-match) unless product explicitly changes that rule.
- Prefer extending the definitions table over inventing parallel category maps in api/web.

---

## 4. Countries and brand

- `COUNTRY_OPTIONS` **must** remain a static full ISO alpha-2 set for the UI; API validation still accepts any 2-letter code.
- There is **no** brand catalog in core today. Brand search is exact OSM `brand` text. **Must not** add a brand autocomplete catalog unless product reintroduces it.

---

## 5. Module style

- ESM with `.js` extensions on relative imports (NodeNext), matching api/core consumers.
- Keep constants in dedicated `*.constants.ts` files (e.g. `countries.constants.ts`, not bloating categories).
- Document exported constants and services with concise JSDoc.

---

## 6. Verification

```bash
pnpm --filter places-core test
pnpm --filter places-core build
```

If api/web import new exports, rebuild core before running those packages’ tests.
