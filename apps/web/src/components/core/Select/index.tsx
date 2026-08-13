import { type ChangeEvent, useCallback } from "react";
import styles from "./index.module.css";
import type { SelectProps } from "./index.types";

/** Native select control for country and category filters. */
export function Select({
  id,
  value,
  options,
  placeholder,
  disabled,
  onChange,
  "aria-label": ariaLabel,
}: SelectProps) {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      onChange(event.target.value);
    },
    [onChange],
  );

  return (
    <select
      aria-label={ariaLabel ?? placeholder ?? "Select"}
      className={styles.root}
      disabled={disabled}
      id={id}
      onChange={handleChange}
      value={value}
    >
      {placeholder ? <option value="">{placeholder}</option> : null}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
