import styles from "./index.module.css";
import type { FormFieldProps } from "./index.types";

/** Label + control wrapper used in the Places filter panel. */
export function FormField({ label, htmlFor, children, hint }: FormFieldProps) {
  return (
    <div className={styles.root}>
      <label className={styles.label} htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint ? <span className={styles.hint}>{hint}</span> : null}
    </div>
  );
}
