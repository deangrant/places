---
name: places-product-limits
description: >-
  Places product search and export limits backed by code: brand exact match,
  name substring, taxonomy first-match, required filters, RESULT_LIMIT, full
  ISO country UI, and geometry export modes. Use when changing filter semantics
  or documenting Known limitations.
trigger: >-
  brand exact, RESULT_LIMIT, PlaceGeometryType, country ISO, first-match
  taxonomy, places product limits, export geometry
---

# Places product limits

Apply these rules when changing search semantics, filters, or export geometry.
Ownership of implementation stays with [places-core](../places-core/SKILL.md)
and [places-web](../places-web/SKILL.md) / [places-api-bff](../places-api-bff/SKILL.md).

Keywords in this document:

| Keyword | Meaning |
| --- | --- |
| **must** | Required. Do not deviate. |
| **must not** | Forbidden. |
| **should** | Strongly preferred unless a reviewer agrees otherwise. |
| **may** | Optional. |

---

## 1. Filters

| Filter | Semantics |
| ------ | --------- |
| Brand | Case-insensitive **exact** match on OSM `brand`. Plain text input; **no** brand autocomplete catalog. |
| Place name | **Substring** / contains match. |
| Category | Curated taxonomy; assigned label is **first-match** in `CATEGORY_DEFINITIONS`, not scored best-match. |
| Country | UI offers full static ISO 3166-1 alpha-2 (`COUNTRY_OPTIONS`). API accepts any 2-letter code. |
| OSM tag | Advanced key must be on `OSM_TAG_KEY_ALLOWLIST`. |

A search **must** include at least one of: category, brand, name, or OSM tag (plus optional geography)—do not weaken the “enough filters” validation without a product decision.

---

## 2. Result cap

- Overpass / result pages use `RESULT_LIMIT` (**2500**) from `places-core`.
- `truncated: true` means a full page was returned; do not silently raise the cap in one app only.

---

## 3. Geometry export

Supported `PlaceGeometryType` values:

- `POINT`
- `POLYGON`
- `MULTIPOLYGON`

Export re-queries through the BFF (`POST /places/export`); the browser **must not** call Overpass for geometry.

---

## 4. Docs drift

If product limits change, update this skill, [ARCHITECTURE.md](../../docs/ARCHITECTURE.md), and root `README.md` Known limitations in the same change set.
