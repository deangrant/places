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
