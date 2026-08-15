/** Public Overpass interpreters (equal weight; shuffled per query). */
export const OVERPASS_ENDPOINTS = [
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://z.overpass-api.de/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
] as const;

/** Nominatim search endpoint. */
export const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search";

/** Soft cap on Overpass result elements. */
export const RESULT_LIMIT = 2500;

/** Overpass server-side timeout in seconds (QL `[timeout:…]`). */
export const OVERPASS_TIMEOUT_SECONDS = 300;

/** Per-attempt client abort and UI countdown budget in seconds. */
export const OVERPASS_CLIENT_TIMEOUT_SECONDS = 180;

/** Max interpreters tried per query after shuffle. */
export const OVERPASS_MAX_ENDPOINT_ATTEMPTS = 3;

/** Mercator world extent used for maxBounds and the initial fit. */
export const MAP_WORLD_BOUNDS: [[number, number], [number, number]] = [
  [-180, -85],
  [180, 85],
];

/** Default map view on first load (full flat Mercator world; MapView refits exactly). */
export const DEFAULT_MAP_VIEW = {
  lat: 0,
  lon: 0,
  zoom: 0,
} as const;

/** Fixed Mapbox light style (no style picker / dark variant). */
export const MAPBOX_STYLE_URL = "mapbox://styles/mapbox/light-v11";
