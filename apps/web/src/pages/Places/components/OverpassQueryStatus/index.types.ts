import type { OverpassAttemptEvent } from "@/services/overpass/overpass-http-client";

/**
 * Props for the Overpass query status list shown under loaders.
 */
export interface OverpassQueryStatusProps {
  /** Attempt events for interpreters tried so far (including active). */
  attempts: readonly OverpassAttemptEvent[];
}
