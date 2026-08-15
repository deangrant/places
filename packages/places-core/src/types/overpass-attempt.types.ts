/** Lifecycle status for one Overpass interpreter attempt during a query. */
export type OverpassAttemptStatus =
  | "started"
  | "succeeded"
  | "failed"
  | "timed_out";

/**
 * Progress event emitted while trying Overpass interpreters.
 * Hostnames are public mirror domains shown in search/export loaders.
 */
export interface OverpassAttemptEvent {
  /** Full interpreter URL for this attempt. */
  endpoint: string;
  /** Hostname shown in loaders (e.g. overpass.private.coffee). */
  hostname: string;
  /** Zero-based index in this query’s shuffled attempt order. */
  index: number;
  /** Outcome or start of the attempt. */
  status: OverpassAttemptStatus;
}

/** Optional callback for live per-endpoint query status. */
export type OverpassAttemptListener = (event: OverpassAttemptEvent) => void;
