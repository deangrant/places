import type { IncomingMessage, ServerResponse } from "node:http";

/**
 * RFC 9457 Problem Details payload.
 */
export interface ProblemDetails {
  /** Occurrence-specific explanation. */
  detail: string;
  /** Optional field-level validation messages. */
  errors?: Record<string, string[]>;
  /** HTTP status echo. */
  status: number;
  /** Short static summary for the problem class. */
  title: string;
  /** Stable problem type URI. */
  type: string;
}

const PROBLEM_BASE = "https://places.local/errors";

/**
 * Builds a problem details object for a known error class.
 * @param status HTTP status.
 * @param title Short title.
 * @param detail Occurrence detail.
 * @param typeSuffix Path under the Places error base.
 * @param errors Optional field errors.
 */
export function problem(
  status: number,
  title: string,
  detail: string,
  typeSuffix: string,
  errors?: Record<string, string[]>,
): ProblemDetails {
  return {
    detail,
    ...(errors ? { errors } : {}),
    status,
    title,
    type: `${PROBLEM_BASE}${typeSuffix}`,
  };
}

/**
 * Writes an `application/problem+json` response.
 * @param res Node response.
 * @param body Problem details.
 * @param extraHeaders Optional headers (e.g. RateLimit-*).
 */
export function sendProblem(
  res: ServerResponse,
  body: ProblemDetails,
  extraHeaders?: Record<string, string>,
): void {
  const payload = JSON.stringify(body);
  res.statusCode = body.status;
  res.setHeader("Content-Type", "application/problem+json; charset=utf-8");
  res.setHeader("Content-Length", Buffer.byteLength(payload));
  if (extraHeaders) {
    for (const [name, value] of Object.entries(extraHeaders)) {
      res.setHeader(name, value);
    }
  }
  res.end(payload);
}

/**
 * Writes a JSON success body.
 * @param res Node response.
 * @param status HTTP status.
 * @param body Serializable body.
 */
export function sendJson(
  res: ServerResponse,
  status: number,
  body: unknown,
): void {
  const payload = JSON.stringify(body);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Content-Length", Buffer.byteLength(payload));
  res.end(payload);
}

/**
 * Reads a request body with a hard size cap.
 * @param req Incoming request.
 * @param maxBytes Maximum body size.
 */
export async function readBody(
  req: IncomingMessage,
  maxBytes: number,
): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;
    if (total > maxBytes) {
      throw Object.assign(new Error("Payload too large."), {
        code: "PAYLOAD_TOO_LARGE" as const,
      });
    }
    chunks.push(buffer);
  }
  return Buffer.concat(chunks);
}

/**
 * Parses JSON from a request body buffer.
 * @param buffer Raw body bytes.
 */
export function parseJsonBody(buffer: Buffer): unknown {
  if (buffer.length === 0) {
    throw Object.assign(new Error("Request body is required."), {
      code: "BAD_REQUEST" as const,
    });
  }
  try {
    return JSON.parse(buffer.toString("utf8")) as unknown;
  } catch (error) {
    throw Object.assign(
      new Error("Request body must be valid JSON.", { cause: error }),
      {
        code: "BAD_REQUEST" as const,
      },
    );
  }
}
