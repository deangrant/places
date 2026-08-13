import styles from "./index.module.css";
import type { FormFieldProps } from "./index.types";

/** Label + control wrapper used in the Places filter panel. */
export function FormField({ label, htmlFor, children, hint }: FormFieldProps) {
  return (
    <label className={styles.root} htmlFor={htmlFor}>
      <span className={styles.label}>{label}</span>
      {children}
      {hint ? <span className={styles.hint}>{hint}</span> : null}
    </label>
  );
}
