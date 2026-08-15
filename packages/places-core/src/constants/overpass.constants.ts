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

/**
 * Overall Places client / route AbortSignal and UI countdown budget in seconds.
 * Must remain larger than attempt timeout × max attempts so soft-timeout
 * failover can run within the shared caller signal.
 */
export const OVERPASS_CLIENT_TIMEOUT_SECONDS = 180;

/**
 * Soft abort budget per Overpass interpreter attempt in seconds.
 * Shorter than the overall client budget so hanging endpoints can fail over.
 */
export const OVERPASS_ATTEMPT_TIMEOUT_SECONDS = 50;

/** Max interpreters tried per query after shuffle. */
export const OVERPASS_MAX_ENDPOINT_ATTEMPTS = 3;

/**
 * Base delay in milliseconds for exponential backoff between interpreter
 * failover attempts (before the second try, then doubled per subsequent gap).
 */
export const OVERPASS_RETRY_BASE_MS = 500;

/**
 * Cap on the exponential portion of failover backoff (jitter is added on top).
 * Kept small so retries fit within OVERPASS_CLIENT_TIMEOUT_SECONDS.
 */
export const OVERPASS_RETRY_MAX_MS = 2000;
