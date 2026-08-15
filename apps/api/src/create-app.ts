import type { IncomingMessage, ServerResponse } from "node:http";
import type { ApiConfig } from "./config.js";
import type { ApiServices } from "./create-services.js";
import { applyCors } from "./http/cors.js";
import { mapDomainError } from "./http/map-domain-error.js";
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
  createPlacesRequestSignal,
  isResponseClosed,
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

    if (req.method === "GET" && path === "/health/live") {
      sendJson(res, 200, { status: "ok" });
      return;
    }

    if (req.method === "GET" && path === "/health/ready") {
      sendJson(res, 200, { status: "ready" });
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

    if (
      path === "/health/live" ||
      path === "/health/ready" ||
      path === "/places/search" ||
      path === "/places/export"
    ) {
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

    try {
      const result = await services.placeSearch.search(
        validated.value,
        createPlacesRequestSignal(req, res),
      );
      if (isResponseClosed(res)) {
        return;
      }
      sendJson(res, 200, result);
    } catch (error) {
      if (isResponseClosed(res)) {
        return;
      }
      sendProblem(res, mapDomainError(error));
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

    try {
      const places = await services.placeExport.exportByGeometry(
        validated.value.criteria,
        validated.value.geometryType,
        createPlacesRequestSignal(req, res),
      );
      if (isResponseClosed(res)) {
        return;
      }
      sendJson(res, 200, { places });
    } catch (error) {
      if (isResponseClosed(res)) {
        return;
      }
      sendProblem(res, mapDomainError(error));
    }
  } finally {
    acquired.release();
  }
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
