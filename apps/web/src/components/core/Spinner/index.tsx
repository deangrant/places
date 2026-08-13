import styles from "./index.module.css";
import type { SpinnerProps } from "./index.types";

/** Compact loading indicator for search-in-progress states. */
export function Spinner({ label = "Loading" }: SpinnerProps) {
  return (
    <span className={styles.root} role="status">
      <span aria-hidden className={styles.dot} />
      {label}
    </span>
  );
}
