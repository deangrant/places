# Places

A SafeGraph-inspired Places explorer for live OpenStreetMap data. Filter by industry/category, brand, and geography; browse results on a map and in a table. Overpass QL stays behind the scenes in `apps/api`.

## Requirements

- Node.js `>=22`
- [pnpm](https://pnpm.io/) `11.8.0` (pinned via `packageManager` in `package.json`)

```bash
corepack enable
pnpm install
```

Copy env examples and set required values:

```bash
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
# edit apps/web/.env: VITE_MAPBOX_GL_JS_PUBLIC= and VITE_API_BASE_URL=
# edit apps/api/.env: NOMINATIM_USER_AGENT= and NOMINATIM_EMAIL=
```

The Mapbox token must allow your app origin(s) under Mapbox [URL restrictions](https://docs.mapbox.com/accounts/guides/tokens/#url-restrictions). For local development, include `http://localhost:5173`. Add each preview and production HTTPS origin the same way when you deploy.

## Develop

```bash
pnpm dev
```

Starts the Places API on [http://localhost:8787](http://localhost:8787) and the Vite app on [http://localhost:5173](http://localhost:5173). The browser talks only to the API (plus Mapbox); Nominatim and Overpass are called from `apps/api`.

If Vite reports that port 5173 (or 5174) is in use, it will try the next port. Either free the stale process so the app stays on `:5173`, or add the actual origin (for example `http://localhost:5175`) to `CORS_ORIGINS` in `apps/api/.env`.

Missing `NOMINATIM_USER_AGENT` / `NOMINATIM_EMAIL` means `apps/api/.env` was not created — run `cp apps/api/.env.example apps/api/.env` and set those values. Use a **real** reachable email (Nominatim returns HTTP 403 for placeholders like `example.com`).

Use `pnpm dev:api` or `pnpm dev:web` to run one process alone.

## Build

```bash
pnpm build
pnpm preview
```

`pnpm build` builds `places-core`, `api`, and `web`.

## Test

```bash
pnpm test
```

CI runs `pnpm test` and `pnpm build` on every pull request (see `.github/workflows/test.yml`).

## Scripts

| Script | Description |
| --- | --- |
| `pnpm dev` | Start API + web in parallel |
| `pnpm build` | Build `places-core`, `api`, and `web` |
| `pnpm test` | Run Vitest for core, api, and web |
| `pnpm check` | Run Biome check (format + lint) |
| `pnpm doctor` | Run React Doctor |

## Package layout

| Package | Role |
| --- | --- |
| `apps/web` | Vite React SPA |
| `apps/api` | Node HTTP BFF (Nominatim + Overpass) |
| `packages/places-core` | Shared types, taxonomy, brand catalog, OSM helpers |

## Data sources

- Places search / admin areas: public [Overpass](https://wiki.openstreetmap.org/wiki/Overpass_API) and [Nominatim](https://nominatim.org/) via `apps/api` (not from the browser)
- Map: [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/) (light style)

Place data © OpenStreetMap contributors (ODbL). Map display © Mapbox / OpenStreetMap.

## Known limitations

- **Brand search is exact.** Autocomplete suggests substring matches from a popular-chains list, but search requires a case-insensitive exact match on the OSM `brand` tag (unlike place name, which is a substring filter). Type or pick the full brand as tagged in OSM.
- **Category labels use first-match order.** When an OSM element matches more than one curated industry, the app assigns the first matching category in the bundled taxonomy list—not a scored “best” industry.
- **Country filter is a curated allowlist.** The country dropdown offers a short set of ISO codes, not every country. The API still accepts any 2-letter ISO code.
- **Web trusts co-versioned API DTOs.** The SPA casts Places API success JSON to shared `places-core` types with only a light `places` array shape check. Deploy `apps/web` and `apps/api` from the same revision; full response schemas wait until a multi-client versioned API exists.

## License

MIT — see [LICENSE](./LICENSE).
