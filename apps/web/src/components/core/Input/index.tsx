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
}: InputProps) {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.value);
    },
    [onChange],
  );

  return (
    <input
      autoComplete={autoComplete}
      className={styles.root}
      disabled={disabled}
      id={id}
      list={list}
      onChange={handleChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      type={type}
      value={value}
    />
  );
}
