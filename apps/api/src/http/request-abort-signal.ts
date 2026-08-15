import type { IncomingMessage, ServerResponse } from "node:http";
import { OVERPASS_CLIENT_TIMEOUT_SECONDS } from "places-core";

/**
 * Builds an AbortSignal that fires when the HTTP client disconnects before
 * the response finishes, or when the overall Places route timeout elapses.
 * @param req Incoming request.
 * @param res Outgoing response.
 * @param timeoutMs Overall route budget (defaults to client timeout).
 */
export function createPlacesRequestSignal(
  req: IncomingMessage,
  res: ServerResponse,
  timeoutMs: number = OVERPASS_CLIENT_TIMEOUT_SECONDS * 1000,
): AbortSignal {
  const disconnect = createDisconnectSignal(req, res);
  const timeout = AbortSignal.timeout(timeoutMs);
  return combineAbortSignals(disconnect, timeout);
}

/**
 * Aborts when the client leaves before the response is fully written.
 * @param req Incoming request.
 * @param res Outgoing response.
 */
export function createDisconnectSignal(
  req: IncomingMessage,
  res: ServerResponse,
): AbortSignal {
  const controller = new AbortController();

  const abortIfClientGone = () => {
    if (!res.writableFinished) {
      controller.abort();
    }
  };

  const cleanup = () => {
    req.off("aborted", abortIfClientGone);
    res.off("close", abortIfClientGone);
  };

  if (req.aborted || req.destroyed) {
    controller.abort();
    return controller.signal;
  }

  req.on("aborted", abortIfClientGone);
  res.on("close", abortIfClientGone);
  controller.signal.addEventListener("abort", cleanup, { once: true });
  res.on("finish", cleanup);

  return controller.signal;
}

/**
 * True when the response can no longer accept a body write.
 * @param res Outgoing response.
 */
export function isResponseClosed(res: ServerResponse): boolean {
  return res.writableEnded || res.destroyed;
}

/**
 * Combines two abort signals; aborts when either fires.
 * @param first First signal.
 * @param second Second signal.
 */
function combineAbortSignals(
  first: AbortSignal,
  second: AbortSignal,
): AbortSignal {
  if (typeof AbortSignal.any === "function") {
    return AbortSignal.any([first, second]);
  }
  const controller = new AbortController();
  const forward = () => {
    controller.abort();
  };
  if (first.aborted || second.aborted) {
    controller.abort();
    return controller.signal;
  }
  first.addEventListener("abort", forward, { once: true });
  second.addEventListener("abort", forward, { once: true });
  return controller.signal;
}
