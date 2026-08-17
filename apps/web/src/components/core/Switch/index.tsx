import { useCallback } from "react";
import styles from "./index.module.css";
import type { SwitchProps } from "./index.types";

/** Binary on/off control used for advanced option toggles. */
export function Switch({
  checked,
  disabled = false,
  id,
  onCheckedChange,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
}: SwitchProps) {
  const handleClick = useCallback(() => {
    if (disabled) {
      return;
    }
    onCheckedChange?.(!checked);
  }, [checked, disabled, onCheckedChange]);

  return (
    <button
      aria-checked={checked}
      aria-describedby={ariaDescribedBy}
      aria-label={ariaLabel}
      className={[styles.root, checked ? styles.rootChecked : ""]
        .filter(Boolean)
        .join(" ")}
      disabled={disabled}
      id={id}
      onClick={handleClick}
      role="switch"
      type="button"
    >
      <span className={styles.thumb} />
    </button>
  );
}
