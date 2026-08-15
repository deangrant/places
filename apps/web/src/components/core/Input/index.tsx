import { type ChangeEvent, useCallback } from "react";
import styles from "./index.module.css";
import type { InputProps } from "./index.types";

/** Text input used in Places filters and search fields. */
export function Input({
  id,
  value,
  placeholder,
  disabled,
  onBlur,
  onChange,
  onKeyDown,
  type = "text",
  autoComplete,
  list,
  role,
  clearable = false,
  clearLabel = "Clear",
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

  const handleClear = useCallback(() => {
    onChange("");
  }, [onChange]);

  const showClear = clearable && value.length > 0 && !disabled;

  const input = (
    <input
      aria-activedescendant={ariaActivedescendant}
      aria-autocomplete={ariaAutocomplete}
      aria-controls={ariaControls}
      aria-expanded={ariaExpanded}
      aria-label={ariaLabel}
      autoComplete={autoComplete}
      className={[styles.root, showClear ? styles.withClear : undefined]
        .filter(Boolean)
        .join(" ")}
      disabled={disabled}
      id={id}
      list={list}
      onBlur={onBlur}
      onChange={handleChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      role={role}
      type={type}
      value={value}
    />
  );

  if (!clearable) {
    return input;
  }

  return (
    <div className={styles.wrap}>
      {input}
      {showClear ? (
        <button
          aria-label={clearLabel}
          className={styles.clear}
          onClick={handleClear}
          type="button"
        >
          <span aria-hidden="true">×</span>
        </button>
      ) : null}
    </div>
  );
}
