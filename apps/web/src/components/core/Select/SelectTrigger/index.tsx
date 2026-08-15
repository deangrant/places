import styles from "../index.module.css";
import type { SelectTriggerProps } from "./index.types";

/**
 * Renders the Select combobox trigger and optional clear control.
 */
export function SelectTrigger({
  activeOptionId,
  ariaLabel,
  clearLabel,
  disabled,
  displayLabel,
  id,
  listId,
  open,
  searchable,
  showClear,
  showingPlaceholder,
  onClear,
  onTriggerClick,
  onTriggerKeyDown,
}: SelectTriggerProps) {
  return (
    <div className={styles.triggerWrap}>
      <button
        aria-activedescendant={searchable ? undefined : activeOptionId}
        aria-controls={listId}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className={[
          styles.trigger,
          open ? styles.triggerOpen : undefined,
          showingPlaceholder ? styles.triggerPlaceholder : undefined,
          showClear ? styles.triggerWithClear : undefined,
        ]
          .filter(Boolean)
          .join(" ")}
        disabled={disabled}
        id={id}
        onClick={onTriggerClick}
        onKeyDown={onTriggerKeyDown}
        role="combobox"
        type="button"
      >
        <span className={styles.triggerLabel}>{displayLabel}</span>
      </button>
      {showClear ? (
        <button
          aria-label={clearLabel}
          className={styles.clear}
          onClick={onClear}
          type="button"
        >
          <span aria-hidden="true">×</span>
        </button>
      ) : null}
    </div>
  );
}
