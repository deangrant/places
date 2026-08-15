import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
} from "react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import styles from "./index.module.css";
import type { SelectOption, SelectProps } from "./index.types";

/** Styled listbox select for filter dropdowns. */
export function Select({
  id,
  value,
  options,
  placeholder,
  disabled = false,
  onChange,
  "aria-label": ariaLabel,
}: SelectProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const selected = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  const entries = useMemo((): SelectOption[] => {
    if (!placeholder) {
      return options;
    }
    return [{ label: placeholder, value: "" }, ...options];
  }, [options, placeholder]);

  const displayLabel = selected?.label ?? placeholder ?? "Select";
  const showingPlaceholder = !selected;

  const closeMenu = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  const openMenu = useCallback(() => {
    if (disabled) {
      return;
    }
    setOpen(true);
    const selectedIndex = entries.findIndex((entry) => entry.value === value);
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [disabled, entries, value]);

  const choose = useCallback(
    (next: string) => {
      onChange(next);
      closeMenu();
    },
    [closeMenu, onChange],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        closeMenu();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [closeMenu, open]);

  const handleTriggerClick = useCallback(() => {
    if (open) {
      closeMenu();
      return;
    }
    openMenu();
  }, [closeMenu, open, openMenu]);

  const handleTriggerKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLButtonElement>) => {
      switch (event.key) {
        case "ArrowDown":
        case "ArrowUp": {
          event.preventDefault();
          if (!open) {
            openMenu();
            return;
          }
          moveActive(
            event.key === "ArrowDown" ? 1 : -1,
            entries,
            setActiveIndex,
          );
          return;
        }
        case "Enter":
        case " ": {
          event.preventDefault();
          if (!open) {
            openMenu();
            return;
          }
          const entry = entries[activeIndex];
          if (entry) {
            choose(entry.value);
          }
          return;
        }
        case "Escape": {
          if (!open) {
            return;
          }
          event.preventDefault();
          closeMenu();
          return;
        }
        case "Tab": {
          closeMenu();
          return;
        }
        default: {
          break;
        }
      }
    },
    [activeIndex, choose, closeMenu, entries, open, openMenu],
  );

  const activeOptionId =
    open && activeIndex >= 0 ? optionId(listId, activeIndex) : undefined;

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        aria-activedescendant={activeOptionId}
        aria-controls={listId}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className={[
          styles.trigger,
          open ? styles.triggerOpen : undefined,
          showingPlaceholder ? styles.triggerPlaceholder : undefined,
        ]
          .filter(Boolean)
          .join(" ")}
        disabled={disabled}
        id={id}
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
        type="button"
      >
        <span className={styles.triggerLabel}>{displayLabel}</span>
        <span aria-hidden="true" className={styles.chevron} />
      </button>

      {open ? (
        <ul className={styles.list} id={listId} role="listbox">
          {entries.map((entry, index) => {
            const selectedOption = entry.value === value;
            const active = index === activeIndex;
            return (
              <li
                aria-selected={selectedOption}
                className={[
                  styles.item,
                  active ? styles.itemActive : undefined,
                  selectedOption ? styles.itemSelected : undefined,
                ]
                  .filter(Boolean)
                  .join(" ")}
                id={optionId(listId, index)}
                key={`${entry.value || "empty"}-${entry.label}`}
                onClick={() => choose(entry.value)}
                onKeyDown={(event: ReactKeyboardEvent<HTMLLIElement>) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    choose(entry.value);
                  }
                }}
                onMouseDown={(event: ReactMouseEvent<HTMLLIElement>) => {
                  event.preventDefault();
                }}
                onMouseEnter={() => setActiveIndex(index)}
                role="option"
              >
                {entry.label}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

/**
 * Builds a stable option id for activedescendant wiring.
 * @param listId Listbox id from `useId`.
 * @param index Option index within the current entries.
 */
function optionId(listId: string, index: number): string {
  return `${listId}-option-${index}`;
}

/**
 * Moves the highlighted option by `delta`, wrapping at the ends.
 * @param delta `1` for down, `-1` for up.
 * @param entries Current option list including optional placeholder.
 * @param setActiveIndex Active option index setter.
 */
function moveActive(
  delta: 1 | -1,
  entries: SelectOption[],
  setActiveIndex: (updater: (current: number) => number) => void,
): void {
  if (entries.length === 0) {
    return;
  }
  const last = entries.length - 1;
  setActiveIndex((current) => {
    if (current < 0 || current > last) {
      return delta > 0 ? 0 : last;
    }
    return Math.min(Math.max(current + delta, 0), last);
  });
}
