import type { PlacesRateLimitConfig } from "./http/rate-limit.js";

/**
 * Loads API process configuration from environment variables.
 */
export interface ApiConfig {
  /** Allowed browser origins (exact match). */
  corsOrigins: readonly string[];
  /** Listen address (default loopback; use 0.0.0.0 / :: only when intentional). */
  host: string;
  /** Max JSON body bytes for POST routes. */
  maxBodyBytes: number;
  /** Nominatim contact email. */
  nominatimEmail: string;
  /** Optional Nominatim search URL override. */
  nominatimEndpoint?: string;
  /** Nominatim User-Agent header. */
  nominatimUserAgent: string;
  /** Optional Overpass interpreter URL list override. */
  overpassEndpoints?: readonly string[];
  /** Listen port. */
  port: number;
  /** Per-IP limits for `/places/search` and `/places/export`. */
  rateLimit: PlacesRateLimitConfig;
}

/**
 * Parses `apps/api` environment into a typed config object.
 * @param env Process environment (defaults to `process.env`).
 */
export function loadApiConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  const port = Number(env.PORT ?? "8787");
  if (!Number.isFinite(port) || port <= 0) {
    throw new Error("PORT must be a positive number.");
  }

  const hostRaw = env.HOST;
  const host = hostRaw === undefined ? "127.0.0.1" : hostRaw.trim();
  if (host === "") {
    throw new Error(
      "HOST must be a non-empty listen address (default 127.0.0.1). Use 0.0.0.0 or :: only when intentional LAN/container binding is required.",
    );
  }

  const nominatimUserAgent = env.NOMINATIM_USER_AGENT?.trim();
  const nominatimEmail = env.NOMINATIM_EMAIL?.trim();
  if (!nominatimUserAgent) {
    throw new Error(
      "NOMINATIM_USER_AGENT is required. Copy apps/api/.env.example to apps/api/.env and set NOMINATIM_USER_AGENT and NOMINATIM_EMAIL.",
    );
  }
  if (!nominatimEmail) {
    throw new Error(
      "NOMINATIM_EMAIL is required. Copy apps/api/.env.example to apps/api/.env and set NOMINATIM_USER_AGENT and NOMINATIM_EMAIL.",
    );
  }

  const corsOrigins = (env.CORS_ORIGINS ?? "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (corsOrigins.length === 0) {
    throw new Error("CORS_ORIGINS must list at least one origin.");
  }

  const overpassRaw = env.OVERPASS_ENDPOINTS?.trim();
  const overpassEndpoints = overpassRaw
    ? overpassRaw
        .split(",")
        .map((endpoint) => endpoint.trim())
        .filter(Boolean)
    : undefined;

  return {
    corsOrigins,
    host,
    maxBodyBytes: 1_048_576,
    nominatimEmail,
    nominatimEndpoint: env.NOMINATIM_ENDPOINT?.trim() || undefined,
    nominatimUserAgent,
    overpassEndpoints:
      overpassEndpoints && overpassEndpoints.length > 0
        ? overpassEndpoints
        : undefined,
    port,
    rateLimit: {
      burst: readPositiveInt(
        env.RATE_LIMIT_PLACES_BURST,
        5,
        "RATE_LIMIT_PLACES_BURST",
      ),
      maxConcurrent: readPositiveInt(
        env.RATE_LIMIT_PLACES_MAX_CONCURRENT,
        2,
        "RATE_LIMIT_PLACES_MAX_CONCURRENT",
      ),
      refillPerMinute: readPositiveInt(
        env.RATE_LIMIT_PLACES_REFILL_PER_MINUTE,
        5,
        "RATE_LIMIT_PLACES_REFILL_PER_MINUTE",
      ),
    },
  };
}

/**
 * Parses a positive integer env var with a default.
 * @param raw Env string or undefined.
 * @param fallback Default when unset.
 * @param name Variable name for errors.
 */
function readPositiveInt(
  raw: string | undefined,
  fallback: number,
  name: string,
): number {
  if (raw === undefined || raw.trim() === "") {
    return fallback;
  }
  const value = Number(raw);
  if (!(Number.isFinite(value) && Number.isInteger(value)) || value <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }
  return value;
}
