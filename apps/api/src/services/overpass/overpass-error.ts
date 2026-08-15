/**
 * Error raised when Overpass returns a non-success HTTP status or empty body.
 */
export class OverpassError extends Error {
  /** HTTP status when the failure came from a non-success response. */
  readonly status?: number;
  /** True when the client soft-timeout aborted the attempt. */
  readonly timedOut: boolean;

  /**
   * @param message Human-readable error summary.
   * @param options Optional status, timeout flag, and Error cause.
   */
  constructor(
    message: string,
    options?: ErrorOptions & { status?: number; timedOut?: boolean },
  ) {
    super(message, options);
    this.name = "OverpassError";
    this.status = options?.status;
    this.timedOut = options?.timedOut === true;
  }
}
