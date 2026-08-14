import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
} from "react";
import { useCallback, useEffect, useId, useState } from "react";
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
  const [activeIndex, setActiveIndex] = useState(-1);

  const menuOpen = open && suggestions.length > 0;
  const activeOptionId =
    menuOpen && activeIndex >= 0 ? optionId(listId, activeIndex) : undefined;

  useEffect(() => {
    setActiveIndex(-1);
    if (suggestions.length === 0) {
      setOpen(false);
    }
  }, [suggestions]);

  const handleChange = useCallback(
    (next: string) => {
      onChange(next);
      setOpen(true);
      setActiveIndex(-1);
    },
    [onChange],
  );

  const handleSelect = useCallback(
    (suggestion: string) => {
      onSelect(suggestion);
      setOpen(false);
      setActiveIndex(-1);
    },
    [onSelect],
  );

  const closeMenu = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      switch (event.key) {
        case "Escape": {
          if (!open) {
            return;
          }
          event.preventDefault();
          closeMenu();
          return;
        }
        case "ArrowDown": {
          moveActive(event, suggestions, open, 1, setOpen, setActiveIndex);
          return;
        }
        case "ArrowUp": {
          moveActive(event, suggestions, open, -1, setOpen, setActiveIndex);
          return;
        }
        case "Enter": {
          if (!(open && activeIndex >= 0)) {
            return;
          }
          const suggestion = suggestions[activeIndex];
          if (!suggestion) {
            return;
          }
          event.preventDefault();
          handleSelect(suggestion);
          return;
        }
        default: {
          break;
        }
      }
    },
    [activeIndex, closeMenu, handleSelect, open, suggestions],
  );

  return (
    <div className={styles.root}>
      <Input
        aria-activedescendant={activeOptionId}
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={menuOpen}
        disabled={disabled}
        id={id}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        role="combobox"
        value={value}
      />
      {menuOpen ? (
        <div className={styles.list} id={listId} role="listbox">
          {suggestions.map((suggestion, index) => (
            <SuggestionItem
              active={index === activeIndex}
              id={optionId(listId, index)}
              key={suggestion}
              onSelect={handleSelect}
              suggestion={suggestion}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Builds a stable option id for activedescendant wiring.
 * @param listId Listbox id from `useId`.
 * @param index Option index within the current suggestions.
 */
function optionId(listId: string, index: number): string {
  return `${listId}-option-${index}`;
}

/**
 * Opens the menu if needed and moves the active option by `delta`.
 * @param event Keyboard event from the combobox input.
 * @param suggestions Current suggestion list.
 * @param open Whether the menu is already open.
 * @param delta `1` for down, `-1` for up.
 * @param setOpen Menu open setter.
 * @param setActiveIndex Active option index setter.
 */
function moveActive(
  event: ReactKeyboardEvent<HTMLInputElement>,
  suggestions: string[],
  open: boolean,
  delta: 1 | -1,
  setOpen: (open: boolean) => void,
  setActiveIndex: (updater: (current: number) => number) => void,
): void {
  if (suggestions.length === 0) {
    return;
  }
  event.preventDefault();
  setOpen(true);
  const last = suggestions.length - 1;
  setActiveIndex((current) => {
    if (!open || current < 0) {
      return delta > 0 ? 0 : last;
    }
    return Math.min(Math.max(current + delta, 0), last);
  });
}

function SuggestionItem({
  id,
  suggestion,
  active,
  onSelect,
}: SuggestionItemProps) {
  const handleClick = useCallback(() => {
    onSelect(suggestion);
  }, [onSelect, suggestion]);

  const handleMouseDown = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      // Keep focus on the combobox so selection is not lost to blur.
      event.preventDefault();
    },
    [],
  );

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onSelect(suggestion);
      }
    },
    [onSelect, suggestion],
  );

  return (
    <div
      aria-selected={active}
      className={active ? `${styles.item} ${styles.itemActive}` : styles.item}
      id={id}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseDown={handleMouseDown}
      role="option"
      tabIndex={-1}
    >
      {suggestion}
    </div>
  );
}
