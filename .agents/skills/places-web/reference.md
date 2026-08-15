# Places web — reference

## Key paths

| Path | Role |
| --- | --- |
| `apps/web/src/pages/Places/index.tsx` | Composition: `createServices` + providers |
| `apps/web/src/services/create-services.ts` | `AppServices` wiring |
| `apps/web/src/services/http/http-places-api-client.ts` | BFF client (NDJSON search, export) |
| `apps/web/src/contexts/PlacesContext/` | Search / map / selection state |
| `apps/web/src/contexts/ServicesContext/` | Injected services |
| `apps/web/src/pages/Places/PlacesLayout/` | Filters + map + side panel shell |
| `apps/web/src/pages/Places/components/SearchFilters/` | Filter chrome (hook + sections) |
| `apps/web/src/pages/Places/components/MapView/` | Mapbox GL + clusters |
| `apps/web/src/components/core/` | Button, Input, Select, Modal, … |
| `apps/web/src/styles/global.css` | Design tokens (CSS variables) |
| `.agents/docs/DESIGN.md` | Agent design-token catalog and component recipes |
| `apps/web/vite.config.ts` | Alias `@`, Mapbox chunk, Vitest jsdom |

## Env

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Places BFF origin (required) |
| `VITE_MAPBOX_GL_JS_PUBLIC` | Mapbox GL access token |

Copy from `apps/web/.env.example`.

## Context hook fields (search slice)

Typical `usePlacesSearch()` surface: `criteria`, `setCriteria`, `runSearch`, `cancelSearch`, `loading`, `error`, `places`, `truncated`, `overpassAttempts`.

## Select searchable

Country uses core `Select` with `searchable` + `searchPlaceholder="Filter countries…"`. Filter matches label or ISO code via `filter-select-options.ts`.
