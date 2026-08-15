import { useEffect, useMemo, useState } from "react";
import { OVERPASS_CLIENT_TIMEOUT_SECONDS } from "@/constants/api.constants";
import type { OverpassAttemptEvent } from "@/services/overpass/overpass-http-client-service";

/**
 * Options for the Overpass soft-timeout countdown hook.
 */
export interface UseOverpassAttemptCountdownOptions {
  /** True while an Overpass request is in flight. */
  active: boolean;
  /** Live attempt events used to detect failover advances. */
  attempts: readonly OverpassAttemptEvent[];
}

/**
 * Soft-timeout countdown that restarts when Overpass failover advances.
 * @param options Active flag and attempt list.
 */
export function useOverpassAttemptCountdown({
  active,
  attempts,
}: UseOverpassAttemptCountdownOptions): number {
  const currentAttemptIndex = useMemo(
    () => attempts.reduce((max, attempt) => Math.max(max, attempt.index), -1),
    [attempts],
  );

  const [remainingSeconds, setRemainingSeconds] = useState(
    OVERPASS_CLIENT_TIMEOUT_SECONDS,
  );

  useEffect(() => {
    if (!active) {
      return;
    }
    // Restart soft budget whenever failover advances currentAttemptIndex.
    setRemainingSeconds(
      currentAttemptIndex >= -1 ? OVERPASS_CLIENT_TIMEOUT_SECONDS : 0,
    );
    const intervalId = window.setInterval(() => {
      setRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [active, currentAttemptIndex]);

  return remainingSeconds;
}
