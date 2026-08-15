import type { IncomingMessage, ServerResponse } from "node:http";
import { OVERPASS_CLIENT_TIMEOUT_SECONDS } from "places-core";
import type { ApiConfig } from "./config.js";
import type { ApiServices } from "./create-services.js";
import { applyCors } from "./http/cors.js";
import {
  parseJsonBody,
  problem,
  readBody,
  sendJson,
  sendProblem,
} from "./http/problem.js";
import {
  validatePlaceExportBody,
  validatePlaceSearchCriteria,
} from "./validation/places-body.js";

const TIMEOUT_MESSAGE = /timed out|timeout/i;
const UPSTREAM_UNAVAILABLE_MESSAGE =
  /rate-limiting|Could not reach the Overpass|Location search failed/i;
const VALIDATION_MESSAGE =
  /Choose a category|Set a country|Could not resolve|Set both OSM|Unsupported OSM/i;

/**
 * Creates the Node request listener for the Places API.
 * @param config Process configuration.
 * @param services Wired domain services.
 */
export function createRequestListener(
  config: ApiConfig,
  services: ApiServices,
): (req: IncomingMessage, res: ServerResponse) => void {
  return (req, res) => {
    handleRequest(req, res, config, services).catch((error: unknown) => {
      sendProblem(res, mapUnexpectedError(error));
    });
  };
}

async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
  config: ApiConfig,
  services: ApiServices,
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
      await handleSearch(req, res, config, services);
      return;
    }

    if (req.method === "POST" && path === "/places/export") {
      await handleExport(req, res, config, services);
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
    sendProblem(res, mapUnexpectedError(error));
  }
}

async function handleSearch(
  req: IncomingMessage,
  res: ServerResponse,
  config: ApiConfig,
  services: ApiServices,
): Promise<void> {
  const body = await readJson(req, config.maxBodyBytes);
  const validated = validatePlaceSearchCriteria(body);
  if (!validated.ok) {
    sendProblem(res, validated.problem);
    return;
  }

  try {
    const result = await services.placeSearch.search(
      validated.value,
      AbortSignal.timeout(OVERPASS_CLIENT_TIMEOUT_SECONDS * 1000),
    );
    sendJson(res, 200, result);
  } catch (error) {
    sendProblem(res, mapDomainError(error));
  }
}

async function handleExport(
  req: IncomingMessage,
  res: ServerResponse,
  config: ApiConfig,
  services: ApiServices,
): Promise<void> {
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
      AbortSignal.timeout(OVERPASS_CLIENT_TIMEOUT_SECONDS * 1000),
    );
    sendJson(res, 200, { places });
  } catch (error) {
    sendProblem(res, mapDomainError(error));
  }
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

function mapDomainError(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "problem" in error &&
    error.problem
  ) {
    return (error as { problem: ReturnType<typeof problem> }).problem;
  }

  const message =
    error instanceof Error ? error.message : "Unexpected server failure.";

  if (TIMEOUT_MESSAGE.test(message)) {
    return problem(504, "Upstream timeout", message, "/upstream-timeout");
  }
  if (UPSTREAM_UNAVAILABLE_MESSAGE.test(message)) {
    return problem(
      502,
      "Upstream unavailable",
      message,
      "/upstream-unavailable",
    );
  }
  if (VALIDATION_MESSAGE.test(message)) {
    return problem(422, "Validation failed", message, "/validation");
  }

  return problem(502, "Upstream rejected", message, "/upstream-rejected");
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
