import type { IncomingMessage, ServerResponse } from "node:http";

/**
 * Applies CORS headers for an allowlisted Origin.
 * @param req Incoming request.
 * @param res Outgoing response.
 * @param allowlist Exact allowed origins.
 * @returns Whether the request Origin is allowed (or absent).
 */
export function applyCors(
  req: IncomingMessage,
  res: ServerResponse,
  allowlist: readonly string[],
): boolean {
  const { origin } = req.headers;
  if (!origin) {
    return true;
  }
  if (!allowlist.includes(origin)) {
    return false;
  }
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Accept, Content-Type");
  res.setHeader("Access-Control-Max-Age", "600");
  return true;
}
