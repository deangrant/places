/** Default public Overpass interpreter endpoint. */
export const OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter";

/** Nominatim search endpoint. */
export const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search";

/** Soft cap on Overpass result elements. */
export const RESULT_LIMIT = 5000;

/** Overpass server-side timeout in seconds. */
export const OVERPASS_TIMEOUT_SECONDS = 500;

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
