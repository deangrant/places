# Places

A SafeGraph-inspired Places explorer for live OpenStreetMap data. Filter by industry/category, brand, and geography; browse results on a map and in a table. Overpass QL stays behind the scenes.

## Requirements

- Node.js `>=22`
- [pnpm](https://pnpm.io/) `11.8.0` (pinned via `packageManager` in `package.json`)

```bash
corepack enable
pnpm install
```

Copy [`apps/web/.env.example`](apps/web/.env.example) to `apps/web/.env` and set a Mapbox access token:

```bash
cp apps/web/.env.example apps/web/.env
# edit VITE_MAPBOX_GL_JS_PUBLIC=
```

The token must allow your app origin(s) under Mapbox [URL restrictions](https://docs.mapbox.com/accounts/guides/tokens/#url-restrictions). For local development, include `http://localhost:5173`. Add each preview and production HTTPS origin the same way when you deploy.
## Develop

```bash
pnpm dev
```

Opens the Places app at [http://localhost:5173](http://localhost:5173).

## Build

```bash
pnpm build
pnpm preview
```

## Scripts

| Script | Description |
| --- | --- |
| `pnpm dev` | Start the Places Vite dev server |
| `pnpm build` | Typecheck and build `apps/web` |
| `pnpm check` | Run Biome check (format + lint) |
| `pnpm doctor` | Run React Doctor |

## Data sources

- Places search: [Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API)
- Jump-to-location / admin areas: [Nominatim](https://nominatim.org/)
- Map: [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/) (light style)

Place data © OpenStreetMap contributors (ODbL). Map display © Mapbox / OpenStreetMap.

## Known limitations

- **Category labels use first-match order.** When an OSM element matches more than one curated industry, the app assigns the first matching category in the bundled taxonomy list—not a scored “best” industry.
- **Country filter is a short allowlist.** The country dropdown offers a curated set of ISO codes, not every country.
- **Brand search is exact.** Brand autocomplete suggests substring matches from a popular-chains list, but the Overpass query requires a case-insensitive exact match on the OSM `brand` tag (unlike place name, which is a substring filter). Type or pick the full brand value as tagged in OSM.

## License

MIT — see [LICENSE](./LICENSE).
