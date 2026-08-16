import { OVERPASS_CLIENT_TIMEOUT_SECONDS } from "places-core/overpass";
import { useEffect, useState } from "react";

/**
 * Options for the Places API soft-timeout countdown while a request is in flight.
 */
export interface UseQueryCountdownOptions {
  /** True while the Places API request is in flight. */
  active: boolean;
  /** Full countdown budget in seconds; defaults to the API client timeout. */
  timeoutSeconds?: number;
}

/**
 * Counts down from the Places API client timeout while a request is active.
 * @param options Active flag and optional timeout override.
 */
export function useQueryCountdown({
  active,
  timeoutSeconds = OVERPASS_CLIENT_TIMEOUT_SECONDS,
}: UseQueryCountdownOptions): number {
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    if (!active) {
      setRemainingSeconds(0);
      return;
    }

    setRemainingSeconds(timeoutSeconds);
    const startedAt = Date.now();
    const timerId = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setRemainingSeconds(Math.max(0, timeoutSeconds - elapsed));
    }, 250);

    return () => {
      window.clearInterval(timerId);
    };
  }, [active, timeoutSeconds]);

  return remainingSeconds;
}
