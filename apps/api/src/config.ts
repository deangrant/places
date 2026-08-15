/**
 * Loads API process configuration from environment variables.
 */
export interface ApiConfig {
  /** Allowed browser origins (exact match). */
  corsOrigins: readonly string[];
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
    maxBodyBytes: 1_048_576,
    nominatimEmail,
    nominatimEndpoint: env.NOMINATIM_ENDPOINT?.trim() || undefined,
    nominatimUserAgent,
    overpassEndpoints:
      overpassEndpoints && overpassEndpoints.length > 0
        ? overpassEndpoints
        : undefined,
    port,
  };
}
