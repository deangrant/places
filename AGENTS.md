# Contributor Guidance

Guidance for AI agents and humans working in this repository.

**New task?** Glance → route → skill → change → verify.

This file is the entry point for repository conventions. Keep detailed architecture,
implementation guidance, and task-specific instructions in the referenced files rather
than duplicating them here.

Canonical agent assets live under [`.agents/`](.agents/); [`.cursor/rules`](.cursor/rules),
[`.cursor/commands`](.cursor/commands), and [`.cursor/hooks.json`](.cursor/hooks.json)
symlink or point there for editor integration.

## Repository at a glance

Places is a monorepo for exploring live OpenStreetMap data: filter POIs, map results,
export geometry as CSV.

| Package | Path | Role |
| ------- | ---- | ---- |
| Web SPA | `apps/web` | React + Mapbox UI; calls BFF only (`fetch`) |
| API BFF | `apps/api` | Node HTTP; Nominatim + Overpass; zero runtime deps |
| Shared core | `packages/places-core` | DTOs, taxonomy, constants; zero runtime deps |

**Hard invariants (never violate):**

- Browser must not call Nominatim or Overpass — only `apps/api` may.
- `places-core` and `apps/api` must have zero third-party runtime dependencies.
- DTO shapes live in `places-core` once; web and api must not fork them.
- Deploy web and api together from the same revision.

**Runtime:** Node.js `>=22`, pnpm `11.8.0`. Local dev: API `:8787`, Vite `:5173`.
Build order: `places-core` → `api` → `web` (`pnpm build`).

## Instruction Precedence

When instructions conflict, apply the most specific applicable instruction:

1. Repository-level `AGENTS.md`
2. Applicable files under `.agents/rules/`
3. Applicable files under `.agents/skills/`
4. Relevant documentation under `.agents/docs/`
5. Existing local implementation conventions

More specific guidance takes precedence over general guidance.

Rules define repository constraints and invariants. Skills provide task-specific
implementation guidance. Documentation provides architectural and product context.

Always-on rules under `.agents/rules/` are injected by Cursor on every turn.
This file tells you **when to load** skills and docs; rules state **what you must not do**.
If a skill suggests something a rule forbids, the rule wins.

## Operating Principles

- Make the smallest change that correctly solves the task.
- Preserve existing architecture, package boundaries, and public contracts unless the task requires changing them.
- Prefer existing workspace packages, utilities, and patterns before introducing new abstractions or dependencies.
- Do not refactor unrelated code while completing a task.
- Do not weaken, bypass, or remove repository rules to make a change easier.
- Keep changes focused, reviewable, and consistent with the surrounding code.
- Treat generated files, configuration, schemas, and public API contracts as potentially significant; inspect their existing conventions before modifying them.

## Common mistakes

- Adding `axios`, `zod`, Express, or Fastify to `apps/api` — use Node builtins and existing patterns.
- Calling Overpass or Nominatim from `apps/web` — always go through the BFF.
- Editing `places-core` without rebuilding `dist` before api/web tests.
- Forking a DTO in web or api instead of changing `places-core` once.
- Weakening validation or filter rules to make a feature easier.
- Claiming CI or verification passed without running the commands.

## Workflow

Before changing code:

1. Inspect the repository status and relevant diff.
2. Identify the package(s), files, and architectural area affected.
3. Read the applicable rules.
4. Read the matching skill(s) before modifying that area.
5. Check relevant architecture or product documentation when the change crosses package or product boundaries.
6. Make the smallest appropriate change.
7. Run the narrowest relevant tests, checks, and builds first.
8. Run `/places-verify` before considering the change complete when practical.
9. Review the final diff for unintended changes.

Do not read every skill or document by default. Load only the guidance relevant to
the task being performed.

## Task routing

Read the matching skill **before** editing that area. Load only what the task needs.

| If you are changing… | Read first |
| -------------------- | ---------- |
| BFF routes, validation, Overpass/Nominatim | [`places-api-bff`](.agents/skills/places-api-bff/) |
| React UI, Mapbox, export modal, HTTP client | [`places-web`](.agents/skills/places-web/) |
| Types, taxonomy, countries, OSM allowlists, constants | [`places-core`](.agents/skills/places-core/) |
| Filter semantics, export limits, retail area | [`places-product-limits`](.agents/skills/places-product-limits/) |
| Tests (any package) | [`places-vitest`](.agents/skills/places-vitest/) |
| New components / folder layout | [`typescript-project-structure`](.agents/skills/typescript-project-structure/) |
| Services, DI, module boundaries | [`solid-typescript-design`](.agents/skills/solid-typescript-design/) |
| JSDoc / comments | [`jsdoc-typescript-docs`](.agents/skills/jsdoc-typescript-docs/) |
| React structure / a11y / bundle issues | [`react-doctor`](.agents/skills/react-doctor/) |

Cross-package changes (e.g. new DTO + BFF route + UI): read
[`ARCHITECTURE.md`](.agents/docs/ARCHITECTURE.md) and every affected skill.

## Repository Documentation

- [`.agents/docs/ARCHITECTURE.md`](.agents/docs/ARCHITECTURE.md) — monorepo structure, package responsibilities, search/export flow, module maps, and hosting invariants
- [`.agents/docs/DESIGN.md`](.agents/docs/DESIGN.md) — Places web design tokens, typography, component recipes, and UI conventions
- [DeepWiki](https://deepwiki.com/deangrant/places) — indexed project wiki for additional architecture, API, and pipeline context

## Rules

Canonical repository rules live under [`.agents/rules/`](.agents/rules/). The directory
is symlinked from [`.cursor/rules`](.cursor/rules).

Read all rules marked as always-on and any additional rules applicable to the files
being changed.

### Always-on

- [`.agents/rules/places-monorepo.mdc`](.agents/rules/places-monorepo.mdc) — package roles, boundaries, and hard repository invariants
- [`.agents/rules/workspace-deps.mdc`](.agents/rules/workspace-deps.mdc) — workspace dependency catalog, exact versions, and zero-dependency core/API constraints

### Area-specific

- [`.agents/rules/no-browser-osm.mdc`](.agents/rules/no-browser-osm.mdc) — browser must not call Nominatim or Overpass
- [`.agents/rules/web-design-tokens.mdc`](.agents/rules/web-design-tokens.mdc) — Places CSS tokens and Mapbox paint ownership
- [`.agents/rules/api-esm-extensions.mdc`](.agents/rules/api-esm-extensions.mdc) — `.js` suffixes on relative imports for NodeNext

## Skills

Canonical skills live under [`.agents/skills/`](.agents/skills/).

Read the matching skill before changing the corresponding area. Skills are
task-specific guidance and should not be loaded unless relevant.

- [`.agents/skills/places-api-bff/`](.agents/skills/places-api-bff/) — Node BFF, HTTP contracts, Nominatim/Overpass integration, and RFC 9457
- [`.agents/skills/places-web/`](.agents/skills/places-web/) — Vite SPA, Mapbox, Places UI, and NDJSON client
- [`.agents/skills/places-core/`](.agents/skills/places-core/) — shared types, taxonomy, countries, and OSM constants
- [`.agents/skills/places-vitest/`](.agents/skills/places-vitest/) — Vitest harnesses and testing conventions; no live OSM in unit tests
- [`.agents/skills/places-product-limits/`](.agents/skills/places-product-limits/) — filter semantics, result limits, and geometry export
- [`.agents/skills/typescript-project-structure/`](.agents/skills/typescript-project-structure/) — React/TypeScript project and folder structure
- [`.agents/skills/solid-typescript-design/`](.agents/skills/solid-typescript-design/) — module boundaries, dependency direction, and dependency injection
- [`.agents/skills/jsdoc-typescript-docs/`](.agents/skills/jsdoc-typescript-docs/) — TypeScript documentation and comment conventions
- [`.agents/skills/react-doctor/`](.agents/skills/react-doctor/) — React Doctor scanning, interpretation, and triage

## Commands

Canonical slash commands live under [`.agents/commands/`](.agents/commands/).
The directory is symlinked from [`.cursor/commands`](.cursor/commands).

Prefer repository commands over manually recreating equivalent workflows.

- `/places-verify` — local CI verification: tests, build, checks, and React Doctor
- `/places-doctor` — React Doctor scan and triage

## Hooks

Hook configuration lives in [`.cursor/hooks.json`](.cursor/hooks.json).

Hooks may auto-format after edit; they do not guarantee correctness. Always run
verification explicitly before claiming done.

- `afterFileEdit` → [`.agents/hooks/biome-after-file-edit.sh`](.agents/hooks/biome-after-file-edit.sh) — formats and lints edited files with Biome
- `afterFileEdit` → [`.agents/hooks/react-doctor-after-file-edit.sh`](.agents/hooks/react-doctor-after-file-edit.sh) — runs React Doctor on relevant web edits

## Definition of done

A change is complete when:

1. Only intended files changed (review `git diff`).
2. Applicable rules and skills were followed for touched packages.
3. Narrow tests for touched paths passed (see table below).
4. `/places-verify` was run when the change is merge-ready, or you explicitly report what was skipped and why.
5. Product limits, README, or ARCHITECTURE were updated if behavior or contracts changed.

| Touched area | Minimum verification |
| ------------ | -------------------- |
| `places-core` | `pnpm --filter places-core test` + `build` |
| `apps/api` | above + `pnpm --filter api test` |
| `apps/web` | colocated Vitest for changed paths, or full `pnpm --filter web test` |
| React UI structure | also `pnpm doctor:full` |
| Any merge-ready claim | `pnpm check` + `pnpm build` |

- Do not claim a check passed unless it was actually run and passed.
- If verification cannot be completed, clearly state what was not run and why.