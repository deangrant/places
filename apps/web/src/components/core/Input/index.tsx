import { type ChangeEvent, useCallback } from "react";
import styles from "./index.module.css";
import type { InputProps } from "./index.types";

/** Text input used in Places filters and search fields. */
export function Input({
  id,
  value,
  placeholder,
  disabled,
  onChange,
  onKeyDown,
  type = "text",
  autoComplete,
  list,
  role,
  "aria-label": ariaLabel,
  "aria-expanded": ariaExpanded,
  "aria-controls": ariaControls,
  "aria-autocomplete": ariaAutocomplete,
  "aria-activedescendant": ariaActivedescendant,
}: InputProps) {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.value);
    },
    [onChange],
  );

  return (
    <input
      aria-activedescendant={ariaActivedescendant}
      aria-autocomplete={ariaAutocomplete}
      aria-controls={ariaControls}
      aria-expanded={ariaExpanded}
      aria-label={ariaLabel}
      autoComplete={autoComplete}
      className={styles.root}
      disabled={disabled}
      id={id}
      list={list}
      onChange={handleChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      role={role}
      type={type}
      value={value}
    />
  );
}
