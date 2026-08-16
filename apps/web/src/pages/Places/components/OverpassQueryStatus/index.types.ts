import type { OverpassAttemptEvent } from "places-core/overpass-attempt";

/**
 * Props for the Overpass query status list shown under loaders.
 */
export interface OverpassQueryStatusProps {
  /** Attempt events for interpreters tried so far (including active). */
  attempts: readonly OverpassAttemptEvent[];
}
