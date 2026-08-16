import type { OverpassAttemptEvent } from "places-core/overpass-attempt";

/**
 * Merges an Overpass attempt event into the attempt list by endpoint index.
 * @param attempts Current attempt snapshots.
 * @param attempt Incoming progress event.
 */
export function mergeOverpassAttempt(
  attempts: readonly OverpassAttemptEvent[],
  attempt: OverpassAttemptEvent,
): OverpassAttemptEvent[] {
  const next = attempts.filter((entry) => entry.index !== attempt.index);
  next.push(attempt);
  next.sort((left, right) => left.index - right.index);
  return next;
}
