import styles from "./index.module.css";
import type { SpinnerProps } from "./index.types";

/** Compact loading indicator for search-in-progress states. */
export function Spinner({ label = "Loading", size = "sm" }: SpinnerProps) {
  const className = [styles.root, size === "lg" ? styles.lg : undefined]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={className} role="status">
      <span aria-hidden className={styles.track}>
        <span className={styles.dotIdle} />
        <span className={styles.dotIdle} />
        <span className={styles.dotIdle} />
        <span className={styles.dotActive} />
      </span>
      {label}
    </span>
  );
}
