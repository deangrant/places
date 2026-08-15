import type { OverpassAttemptEvent } from "@/services/overpass/overpass-http-client-service";
import styles from "./index.module.css";
import type { OverpassQueryStatusProps } from "./index.types";

const STATUS_LABEL: Record<OverpassAttemptEvent["status"], string> = {
  failed: "Failed",
  started: "Searching",
  succeeded: "OK",
  timed_out: "Timed out",
};

const STATUS_CLASS: Record<OverpassAttemptEvent["status"], string> = {
  failed: styles.failed,
  started: styles.started,
  succeeded: styles.succeeded,
  timed_out: styles.timed_out,
};

/** Renders a compact list of Overpass interpreter attempts for loaders. */
export function OverpassQueryStatus({ attempts }: OverpassQueryStatusProps) {
  if (attempts.length === 0) {
    return null;
  }

  return (
    <ul aria-label="Overpass servers" className={styles.list}>
      {attempts.map((attempt) => (
        <li
          className={`${styles.row} ${STATUS_CLASS[attempt.status]}`}
          key={`${attempt.index}-${attempt.endpoint}`}
        >
          <span className={styles.hostname}>{attempt.hostname}</span>
          <span className={styles.status}>{STATUS_LABEL[attempt.status]}</span>
        </li>
      ))}
    </ul>
  );
}
