# Agent and contributor guidance

Structured conventions for AI agents and humans working in this repository. For
fuller product context, setup, and scripts, see [README.md](README.md).

## Docs

- [`.agents/docs/ARCHITECTURE.md`](.agents/docs/ARCHITECTURE.md) — monorepo shape, search/export flow, package module maps, hosting invariants
- [`.agents/docs/DESIGN.md`](.agents/docs/DESIGN.md) — Places web design tokens, typography, and component recipes
- [DeepWiki](https://deepwiki.com/deangrant/places) — indexed project wiki (architecture, API, pipeline)

## Rules

- [`.agents/rules/`](.agents/rules/) (symlinked from [`.cursor/rules`](.cursor/rules))
- [`.agents/rules/places-monorepo.mdc`](.agents/rules/places-monorepo.mdc) — always-on package roles and hard invariants
- [`.agents/rules/workspace-deps.mdc`](.agents/rules/workspace-deps.mdc) — always-on catalog / exact versions / zero-deps core and api
- [`.agents/rules/no-browser-osm.mdc`](.agents/rules/no-browser-osm.mdc) — browser must not call Nominatim or Overpass
- [`.agents/rules/web-design-tokens.mdc`](.agents/rules/web-design-tokens.mdc) — Places CSS tokens and Mapbox paint ownership
- [`.agents/rules/api-esm-extensions.mdc`](.agents/rules/api-esm-extensions.mdc) — `.js` suffixes on relative imports (NodeNext)

## Skills

Canonical skills live under [`.agents/skills/`](.agents/skills/). Read the matching skill before changing that area.

- [`.agents/skills/places-api-bff/`](.agents/skills/places-api-bff/) — Node BFF, HTTP contracts, Nominatim/Overpass, RFC 9457
- [`.agents/skills/places-web/`](.agents/skills/places-web/) — Vite SPA, Mapbox, Places UI, NDJSON client
- [`.agents/skills/places-core/`](.agents/skills/places-core/) — shared types, taxonomy, countries, OSM constants
- [`.agents/skills/places-vitest/`](.agents/skills/places-vitest/) — Vitest harnesses; no live OSM in unit tests
- [`.agents/skills/places-product-limits/`](.agents/skills/places-product-limits/) — filter semantics, result cap, geometry export
- [`.agents/skills/typescript-project-structure/`](.agents/skills/typescript-project-structure/) — React/TS folder layout
- [`.agents/skills/solid-typescript-design/`](.agents/skills/solid-typescript-design/) — module boundaries and DI
- [`.agents/skills/jsdoc-typescript-docs/`](.agents/skills/jsdoc-typescript-docs/) — TypeScript comment conventions
- [`.agents/skills/react-doctor/`](.agents/skills/react-doctor/) — React Doctor scan and triage

## Commands

Slash commands under [`.agents/commands/`](.agents/commands/) (symlinked from [`.cursor/commands`](.cursor/commands)):

- `/places-verify` — local CI checklist (test, build, check, doctor)
- `/places-doctor` — React Doctor scan and triage

## Hooks

- Config: [`.cursor/hooks.json`](.cursor/hooks.json)
- `afterFileEdit` → [`.agents/hooks/biome-after-file-edit.sh`](.agents/hooks/biome-after-file-edit.sh) formats/lints edited files with Biome
- `afterFileEdit` → [`.agents/hooks/react-doctor-after-file-edit.sh`](.agents/hooks/react-doctor-after-file-edit.sh) runs React Doctor on relevant web edits
