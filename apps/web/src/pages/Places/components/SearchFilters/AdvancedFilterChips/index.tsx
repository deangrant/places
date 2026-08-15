import styles from "../index.module.css";
import type { AdvancedFilterChipsProps } from "./index.types";

/**
 * Renders clearable chips for active advanced filters while the panel is closed.
 */
export function AdvancedFilterChips({
  advancedOpen,
  chips,
}: AdvancedFilterChipsProps) {
  if (advancedOpen || chips.length === 0) {
    return null;
  }

  return (
    <ul aria-label="Active advanced filters" className={styles.chips}>
      {chips.map((chip) => (
        <li key={chip.id}>
          <button
            aria-label={`Clear ${chip.label}`}
            className={styles.chip}
            onClick={chip.onClear}
            type="button"
          >
            <span>{chip.label}</span>
            <span aria-hidden="true" className={styles.chipClear}>
              ×
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
