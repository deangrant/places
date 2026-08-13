import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useCallback, useId, useState } from "react";
import { Input } from "@/components/core/Input";
import styles from "./index.module.css";
import type { AutocompleteProps, SuggestionItemProps } from "./index.types";

/** Text input with a lightweight suggestion dropdown. */
export function Autocomplete({
  id,
  value,
  suggestions,
  placeholder,
  disabled,
  onChange,
  onSelect,
}: AutocompleteProps) {
  const listId = useId();
  const [open, setOpen] = useState(false);

  const handleChange = useCallback(
    (next: string) => {
      onChange(next);
      setOpen(true);
    },
    [onChange],
  );

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    },
    [],
  );

  const handleSelect = useCallback(
    (suggestion: string) => {
      onSelect(suggestion);
      setOpen(false);
    },
    [onSelect],
  );

  return (
    <div className={styles.root}>
      <Input
        disabled={disabled}
        id={id}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        value={value}
      />
      {open && suggestions.length > 0 ? (
        <ul aria-label="Suggestions" className={styles.list} id={listId}>
          {suggestions.map((suggestion) => (
            <SuggestionItem
              key={suggestion}
              onSelect={handleSelect}
              suggestion={suggestion}
            />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function SuggestionItem({ suggestion, onSelect }: SuggestionItemProps) {
  const handleClick = useCallback(() => {
    onSelect(suggestion);
  }, [onSelect, suggestion]);

  return (
    <li>
      <button className={styles.item} onClick={handleClick} type="button">
        {suggestion}
      </button>
    </li>
  );
}
