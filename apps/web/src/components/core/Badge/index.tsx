import styles from "./index.module.css";
import type { BadgeProps } from "./index.types";

/** Small status or category chip. */
export function Badge({ children }: BadgeProps) {
  return <span className={styles.root}>{children}</span>;
}
