import type { IncomingMessage, ServerResponse } from "node:http";
import type { OverpassAttemptListener } from "places-core/overpass-attempt";
import type { ApiConfig } from "./config.js";
import type { ApiServices } from "./create-services.js";
import { applyCors } from "./http/cors.js";
import { mapDomainError } from "./http/map-domain-error.js";
import {
  beginNdjsonProgress,
  overpassAttemptLine,
  problemLine,
  resultLine,
  wantsNdjsonProgress,
  writeNdjsonLine,
} from "./http/ndjson-progress.js";
import {
  parseJsonBody,
  problem,
  readBody,
  sendJson,
  sendProblem,
} from "./http/problem.js";
import {
  clientIpFromRequest,
  PlacesRateLimiter,
  rateLimitHeaders,
} from "./http/rate-limit.js";
import {
  createPlacesRouteTimeoutSignal,
  errorForDomainMapping,
  isResponseClosed,
  shouldQuietEndOnAbort,
} from "./http/request-abort-signal.js";
import {
  validatePlaceExportBody,
  validatePlaceSearchCriteria,
} from "./validation/places-body.js";

/**
 * Creates the Node request listener for the Places API.
 * @param config Process configuration.
 * @param services Wired domain services.
 * @param rateLimiter Optional limiter (defaults to a new in-memory instance).
 */
export function createRequestListener(
  config: ApiConfig,
  services: ApiServices,
  rateLimiter: PlacesRateLimiter = new PlacesRateLimiter(config.rateLimit),
): (req: IncomingMessage, res: ServerResponse) => void {
  return (req, res) => {
    handleRequest(req, res, config, services, rateLimiter).catch(
      (error: unknown) => {
        if (isResponseClosed(res)) {
          return;
        }
        sendProblem(res, mapUnexpectedError(error));
      },
    );
  };
}

async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
  config: ApiConfig,
  services: ApiServices,
  rateLimiter: PlacesRateLimiter,
): Promise<void> {
  try {
    if (!applyCors(req, res, config.corsOrigins)) {
      sendProblem(
        res,
        problem(
          403,
          "Origin not allowed",
          "The request Origin is not in CORS_ORIGINS.",
          "/forbidden",
        ),
      );
      return;
    }

    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }

    const url = new URL(req.url ?? "/", "http://localhost");
    const path = url.pathname;

    if (path === "/health/live" || path === "/health/ready") {
      handleHealth(req, res, path);
      return;
    }

    if (req.method === "POST" && path === "/places/search") {
      await handleSearch(req, res, config, services, rateLimiter);
      return;
    }

    if (req.method === "POST" && path === "/places/export") {
      await handleExport(req, res, config, services, rateLimiter);
      return;
    }

    if (path === "/places/search" || path === "/places/export") {
      sendProblem(
        res,
        problem(
          405,
          "Method not allowed",
          `${req.method ?? "UNKNOWN"} is not allowed for ${path}.`,
          "/method-not-allowed",
        ),
      );
      return;
    }

    sendProblem(
      res,
      problem(404, "Not found", `No route for ${path}.`, "/not-found"),
    );
  } catch (error) {
    if (isResponseClosed(res)) {
      return;
    }
    sendProblem(res, mapUnexpectedError(error));
  }
}

/**
 * Serves liveness and readiness probes.
 * @param req Incoming request.
 * @param res Outgoing response.
 * @param path Matched health path.
 */
function handleHealth(
  req: IncomingMessage,
  res: ServerResponse,
  path: "/health/live" | "/health/ready" | string,
): void {
  if (req.method !== "GET") {
    sendProblem(
      res,
      problem(
        405,
        "Method not allowed",
        `${req.method ?? "UNKNOWN"} is not allowed for ${path}.`,
        "/method-not-allowed",
      ),
    );
    return;
  }
  if (path === "/health/live") {
    sendJson(res, 200, { status: "ok" });
    return;
  }
  sendJson(res, 200, {
    checks: {
      process: "ok",
      upstream: "not_probed",
    },
    status: "ready",
  });
}

async function handleSearch(
  req: IncomingMessage,
  res: ServerResponse,
  config: ApiConfig,
  services: ApiServices,
  rateLimiter: PlacesRateLimiter,
): Promise<void> {
  const acquired = acquirePlacesLimit(req, res, rateLimiter);
  if (!acquired) {
    return;
  }

  try {
    const body = await readJson(req, config.maxBodyBytes);
    const validated = validatePlaceSearchCriteria(body);
    if (!validated.ok) {
      sendProblem(res, validated.problem);
      return;
    }

    const stream = wantsNdjsonProgress(req.headers.accept);
    const onAttempt = stream ? ndjsonAttemptWriter(res) : undefined;
    const routeSignal = createPlacesRouteTimeoutSignal();

    try {
      if (stream && onAttempt) {
        beginNdjsonProgress(res);
      }
      const result = await services.placeSearch.search(
        validated.value,
        routeSignal,
        onAttempt,
      );
      if (isResponseClosed(res)) {
        return;
      }
      if (stream) {
        writeNdjsonLine(res, resultLine(result));
        res.end();
        return;
      }
      sendJson(res, 200, result);
    } catch (error) {
      if (isResponseClosed(res)) {
        return;
      }
      if (shouldQuietEndOnAbort(error, routeSignal)) {
        if (!res.writableEnded) {
          res.end();
        }
        return;
      }
      const mapped = mapDomainError(errorForDomainMapping(error, routeSignal));
      if (stream && res.headersSent) {
        writeNdjsonLine(res, problemLine(mapped));
        res.end();
        return;
      }
      sendProblem(res, mapped);
    }
  } finally {
    acquired.release();
  }
}

async function handleExport(
  req: IncomingMessage,
  res: ServerResponse,
  config: ApiConfig,
  services: ApiServices,
  rateLimiter: PlacesRateLimiter,
): Promise<void> {
  const acquired = acquirePlacesLimit(req, res, rateLimiter);
  if (!acquired) {
    return;
  }

  try {
    const body = await readJson(req, config.maxBodyBytes);
    const validated = validatePlaceExportBody(body);
    if (!validated.ok) {
      sendProblem(res, validated.problem);
      return;
    }

    const stream = wantsNdjsonProgress(req.headers.accept);
    const onAttempt = stream ? ndjsonAttemptWriter(res) : undefined;
    const routeSignal = createPlacesRouteTimeoutSignal();

    try {
      if (stream && onAttempt) {
        beginNdjsonProgress(res);
      }
      const places = await services.placeExport.exportByGeometry(
        validated.value.criteria,
        validated.value.geometryType,
        routeSignal,
        onAttempt,
        { includeRetailArea: validated.value.includeRetailArea },
      );
      if (isResponseClosed(res)) {
        return;
      }
      if (stream) {
        writeNdjsonLine(res, resultLine({ places }));
        res.end();
        return;
      }
      sendJson(res, 200, { places });
    } catch (error) {
      if (isResponseClosed(res)) {
        return;
      }
      if (shouldQuietEndOnAbort(error, routeSignal)) {
        if (!res.writableEnded) {
          res.end();
        }
        return;
      }
      const mapped = mapDomainError(errorForDomainMapping(error, routeSignal));
      if (stream && res.headersSent) {
        writeNdjsonLine(res, problemLine(mapped));
        res.end();
        return;
      }
      sendProblem(res, mapped);
    }
  } finally {
    acquired.release();
  }
}

/**
 * Writes Overpass attempt events as NDJSON lines (starts the stream on first event).
 * @param res Node response.
 */
function ndjsonAttemptWriter(res: ServerResponse): OverpassAttemptListener {
  return (event) => {
    if (isResponseClosed(res)) {
      return;
    }
    if (!res.headersSent) {
      beginNdjsonProgress(res);
    }
    writeNdjsonLine(res, overpassAttemptLine(event));
  };
}

/**
 * Acquires a places-expensive slot or writes 429/503 and returns null.
 * @param req Incoming request.
 * @param res Outgoing response.
 * @param rateLimiter Shared limiter.
 */
function acquirePlacesLimit(
  req: IncomingMessage,
  res: ServerResponse,
  rateLimiter: PlacesRateLimiter,
): { release: () => void } | null {
  const key = PlacesRateLimiter.placesExpensiveKey(clientIpFromRequest(req));
  const result = rateLimiter.tryAcquire(key);
  if (result.ok) {
    return { release: result.release };
  }

  const headers = rateLimitHeaders(result.snapshot);
  if (result.reason === "concurrency") {
    sendProblem(
      res,
      problem(
        503,
        "Service unavailable",
        "Too many concurrent Places queries from this client. Retry shortly.",
        "/service-unavailable",
      ),
      headers,
    );
    return null;
  }

  sendProblem(
    res,
    problem(
      429,
      "Too many requests",
      `Places query rate limit exceeded. Retry after about ${result.snapshot.retryAfterSec}s.`,
      "/rate-limited",
    ),
    headers,
  );
  return null;
}

async function readJson(
  req: IncomingMessage,
  maxBodyBytes: number,
): Promise<unknown> {
  try {
    const buffer = await readBody(req, maxBodyBytes);
    return parseJsonBody(buffer);
  } catch (error: unknown) {
    if (isPayloadTooLarge(error)) {
      throw Object.assign(new Error("Payload too large."), {
        problem: problem(
          413,
          "Payload too large",
          "Request body exceeds the configured size limit.",
          "/payload-too-large",
        ),
      });
    }
    throw Object.assign(new Error("Bad request."), {
      problem: problem(
        400,
        "Bad request",
        error instanceof Error ? error.message : "Invalid request body.",
        "/bad-request",
      ),
    });
  }
}

function isPayloadTooLarge(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "PAYLOAD_TOO_LARGE"
  );
}

function mapUnexpectedError(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "problem" in error &&
    error.problem
  ) {
    return (error as { problem: ReturnType<typeof problem> }).problem;
  }
  return problem(
    500,
    "Internal error",
    "Unexpected server failure.",
    "/internal",
  );
}
