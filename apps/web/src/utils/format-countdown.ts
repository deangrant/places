/**
 * Formats remaining seconds as M:SS for Overpass soft-timeout countdowns.
 * @param totalSeconds Seconds left before the soft timeout.
 */
export function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
