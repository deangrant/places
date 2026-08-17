# Places

A **Places explorer** for live [OpenStreetMap](https://www.openstreetmap.org/) data.

Filter by industry, brand, place name, geography, and optional OSM tags. Browse results on a Mapbox map and in a side panel. Stream Overpass attempt progress while a search runs. Export place geometry (point, polygon, or multipolygon) as CSV.

Nominatim and Overpass stay behind a Node BFF that uses only Node builtins plus shared `places-core` (no Express, Zod, or other third-party runtime deps). The browser talks only to that API (and Mapbox for the map).

## Architecture at a glance

```text
Browser (Vite React SPA) ──► Places API (Node BFF) ──► Nominatim
         │                          │
         └──► Mapbox GL             └──► Overpass (mirrored)
                      ╲            ╱
                       places-core
```

| Package | Role |
| --- | --- |
| [`apps/web`](apps/web) | Vite React SPA — filters, Mapbox map, results, geometry export |
| [`apps/api`](apps/api) | Node HTTP BFF — validate, geocode, Overpass, NDJSON progress, RFC 9457 errors |
| [`packages/places-core`](packages/places-core) | Shared types, taxonomy, full ISO country list, OSM/Overpass constants |

Deeper module maps and data flow: [`.agents/docs/ARCHITECTURE.md`](.agents/docs/ARCHITECTURE.md).

## Requirements

- Node.js `>=22`
- [pnpm](https://pnpm.io/) `11.8.0` (pinned via `packageManager` in root `package.json`)

```bash
corepack enable
pnpm install
```

## Configuration

```bash
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
```

| App | Required | Notes |
| --- | --- | --- |
| Web | `VITE_MAPBOX_GL_JS_PUBLIC` | Public Mapbox token (`pk.*`). Restrict origins in the [Mapbox token UI](https://docs.mapbox.com/accounts/guides/tokens/#url-restrictions) — include `http://localhost:5173` for local dev. |
| Web | `VITE_API_BASE_URL` | API origin, no trailing slash (default `http://localhost:8787`). |
| API | `NOMINATIM_USER_AGENT` | Identifying User-Agent for Nominatim policy. |
| API | `NOMINATIM_EMAIL` | **Reachable** contact email — placeholders like `example.com` often get HTTP 403. |
| API | `CORS_ORIGINS` | Comma-separated browser origins (defaults cover common Vite ports). |

Optional API knobs (rate limits, Overpass mirrors, listen host/port) are documented in [`apps/api/.env.example`](apps/api/.env.example).

## Develop

```bash
pnpm dev
```

| Process | URL |
| --- | --- |
| Places API | [http://localhost:8787](http://localhost:8787) |
| Vite app | [http://localhost:5173](http://localhost:5173) |

- Run one side alone: `pnpm dev:api` or `pnpm dev:web`.
- If Vite picks a different port because `:5173` is busy, add that origin to `CORS_ORIGINS` (or free the stale process).
- Missing Nominatim env usually means `apps/api/.env` was never created from the example.

## Build and preview

```bash
pnpm build    # places-core → api → web
pnpm preview  # Vite preview of apps/web
```

## Test and quality

```bash
pnpm test         # Vitest: core, api, web
pnpm check        # Biome format + lint
pnpm doctor:full  # React Doctor on the web app
```

CI (see [`.github/workflows/`](.github/workflows/)):

- `test.yml` — Vitest + production build
- `lint.yml` — Biome CI, lockfile check, React Doctor
- `audit.yml` — dependency audit

## Scripts

| Script | Description |
| --- | --- |
| `pnpm dev` | API + web in parallel |
| `pnpm dev:api` / `pnpm dev:web` | Single process |
| `pnpm build` | Build core → api → web |
| `pnpm test` | Vitest across the workspace |
| `pnpm check` | Biome check (format + lint) |
| `pnpm format` / `pnpm lint` | Format or lint only |
| `pnpm doctor` / `pnpm doctor:full` | React Doctor |
| `pnpm preview` | Preview the web production build |

## What you can search

| Filter | Behavior |
| --- | --- |
| Category / subcategory | Curated OSM industry taxonomy from `places-core` |
| Brand | Plain text; **exact** case-insensitive match on OSM `brand` |
| Place name | Substring / contains |
| Country | Searchable full ISO 3166-1 alpha-2 list (API accepts any 2-letter code) |
| State / region, city | Resolved via Nominatim for Overpass spatial scope |
| Advanced OSM tag | Allowlisted top-level OSM feature keys + exact value |

A search needs at least one of: category, brand, name, or OSM tag (geography alone is not enough). Results are capped at `RESULT_LIMIT` (2500); the UI surfaces truncation when Overpass returns a full page.

While Overpass runs, the SPA requests NDJSON (`Accept: application/x-ndjson`) so the API can stream mirror/attempt progress before the final result. Geometry export re-queries through `POST /places/export` — never Overpass from the browser.

## Data sources and attribution

- Admin areas / place search: public [Nominatim](https://nominatim.org/) and [Overpass](https://wiki.openstreetmap.org/wiki/Overpass_API) via `apps/api` only — **not** from the browser
- Map: [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/) (light style)

Place data © OpenStreetMap contributors ([ODbL](https://www.openstreetmap.org/copyright)). Map display © Mapbox / OpenStreetMap.

## Known limitations

- **Brand is exact, not fuzzy.** There is no brand autocomplete catalog. Type the OSM `brand` tag as it appears in the data.
- **Category labels are first-match.** If an element matches more than one taxonomy entry, the first match in the bundled list wins — not a scored “best” industry.
- **Country UI vs API.** The dropdown is a full static ISO list from `places-core`; the API still accepts any ISO alpha-2 code.
- **Co-versioned DTOs.** The SPA casts Places API success JSON to `places-core` types with only a light shape check. Deploy `apps/web` and `apps/api` from the same revision.
- **Public OSM capacity.** Searches depend on public Nominatim/Overpass fairness. Identify yourself with a real User-Agent and email; expect rate limits and occasional upstream failures.
- **Retail-area export coverage.** Advanced export “Include Retail Area” only finds enclosing `landuse=retail` / `shop=mall` polygons present in OSM for the search scope; otherwise the place footprint is kept.
- **Hosting.** Local Node + Vite is first-class. Long Overpass wall-clock budgets fit long-running Node/Containers better than short-lived Workers.

## Agents and docs

| Doc | Purpose |
| --- | --- |
| [`AGENTS.md`](AGENTS.md) | Agent orientation, skills, commands |
| [`.agents/docs/ARCHITECTURE.md`](.agents/docs/ARCHITECTURE.md) | System architecture |
| [`.agents/skills/`](.agents/skills/) | Package and workflow skills |

## License

MIT — see [LICENSE](./LICENSE).
