import type {
  ChangeEvent as ReactChangeEvent,
  FocusEvent as ReactFocusEvent,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  RefObject,
} from "react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { filterSelectOptions } from "./filter-select-options";
import type { SelectOption, SelectProps } from "./index.types";

/**
 * Select open-state, filtered entries, and interaction handlers.
 */
export interface UseSelectResult {
  /** Highlighted option index within `entries`. */
  activeIndex: number;
  /** Id of the highlighted option for `aria-activedescendant`. */
  activeOptionId: string | undefined;
  /** Accessible name for the trigger when unlabeled. */
  ariaLabel: string | undefined;
  /** Accessible name for the clear control. */
  clearLabel: string;
  /** Whether the control is disabled. */
  disabled: boolean;
  /** Visible trigger label. */
  displayLabel: string;
  /** Options currently shown in the listbox (after filter/placeholder). */
  entries: SelectOption[];
  /** Clears the value and closes the menu. */
  handleClear: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  /** Chooses an option from a list click. */
  handleListClick: (event: ReactMouseEvent<HTMLDivElement>) => void;
  /** Updates active index from option focus. */
  handleListFocus: (event: ReactFocusEvent<HTMLDivElement>) => void;
  /** Chooses an option from list keyboard activation. */
  handleListKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void;
  /** Prevents focus steal on option mousedown. */
  handleListMouseDown: (event: ReactMouseEvent<HTMLDivElement>) => void;
  /** Updates active index from option hover. */
  handleListMouseOver: (event: ReactMouseEvent<HTMLDivElement>) => void;
  /** Updates the filter query. */
  handleSearchChange: (event: ReactChangeEvent<HTMLInputElement>) => void;
  /** Navigates or selects from the search field. */
  handleSearchKeyDown: (event: ReactKeyboardEvent<HTMLInputElement>) => void;
  /** Toggles the menu from the trigger. */
  handleTriggerClick: () => void;
  /** Opens, navigates, or selects from the trigger. */
  handleTriggerKeyDown: (event: ReactKeyboardEvent<HTMLButtonElement>) => void;
  /** Trigger element id. */
  id: string | undefined;
  /** Listbox id for `aria-controls`. */
  listId: string;
  /** Whether the menu is open. */
  open: boolean;
  /** Filter query when searchable. */
  query: string;
  /** Root element for outside-click detection. */
  rootRef: RefObject<HTMLDivElement | null>;
  /** Whether the select supports type-to-filter. */
  searchable: boolean;
  /** Search field placeholder / aria-label. */
  searchPlaceholder: string;
  /** Search input ref for autofocus. */
  searchRef: RefObject<HTMLInputElement | null>;
  /** Whether the clear control is visible. */
  showClear: boolean;
  /** Whether the trigger shows the placeholder style. */
  showingPlaceholder: boolean;
  /** Controlled selected value. */
  value: string;
}

/**
 * Owns Select menu state, filtering, and interaction handlers.
 */
export function useSelect({
  id,
  value,
  options,
  placeholder,
  disabled = false,
  clearable = false,
  clearLabel = "Clear",
  searchable = false,
  searchPlaceholder = "Filter…",
  onChange,
  "aria-label": ariaLabel,
}: SelectProps): UseSelectResult {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);

  const selected = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  const filteredOptions = useMemo(
    () => (searchable ? filterSelectOptions(options, query) : options),
    [options, query, searchable],
  );

  const entries = useMemo((): SelectOption[] => {
    const showPlaceholder =
      Boolean(placeholder) && !(searchable && query.trim());
    if (!showPlaceholder) {
      return filteredOptions;
    }
    return [{ label: placeholder as string, value: "" }, ...filteredOptions];
  }, [filteredOptions, placeholder, query, searchable]);

  const displayLabel = selected?.label ?? placeholder ?? "Select";
  const showingPlaceholder = !selected;

  const closeMenu = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
    setQuery("");
  }, []);

  const openMenu = useCallback(
    (seedQuery = "") => {
      if (disabled) {
        return;
      }
      setQuery(seedQuery);
      setOpen(true);
      const nextOptions = searchable
        ? filterSelectOptions(options, seedQuery)
        : options;
      const showPlaceholder =
        Boolean(placeholder) && !(searchable && seedQuery.trim());
      const nextEntries = showPlaceholder
        ? [{ label: placeholder as string, value: "" }, ...nextOptions]
        : nextOptions;
      const selectedIndex = nextEntries.findIndex(
        (entry) => entry.value === value,
      );
      let nextActive = -1;
      if (selectedIndex >= 0) {
        nextActive = selectedIndex;
      } else if (nextEntries.length > 0) {
        nextActive = 0;
      }
      setActiveIndex(nextActive);
    },
    [disabled, options, placeholder, searchable, value],
  );

  const choose = useCallback(
    (next: string) => {
      onChange(next);
      closeMenu();
    },
    [closeMenu, onChange],
  );

  const handleClear = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      onChange("");
      closeMenu();
    },
    [closeMenu, onChange],
  );

  const showClear = clearable && Boolean(selected) && !disabled;

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

  useEffect(() => {
    if (!(open && searchable)) {
      return;
    }
    searchRef.current?.focus();
  }, [open, searchable]);

  const handleTriggerClick = useCallback(() => {
    if (open) {
      closeMenu();
      return;
    }
    openMenu();
  }, [closeMenu, open, openMenu]);

  const handleNavKey = useCallback(
    (event: ReactKeyboardEvent) => {
      switch (event.key) {
        case "ArrowDown":
        case "ArrowUp": {
          event.preventDefault();
          moveActive(
            event.key === "ArrowDown" ? 1 : -1,
            entries,
            setActiveIndex,
          );
          return;
        }
        case "Enter": {
          event.preventDefault();
          const entry = entries[activeIndex];
          if (entry) {
            choose(entry.value);
          }
          return;
        }
        case "Escape": {
          event.preventDefault();
          if (searchable && query) {
            setQuery("");
            return;
          }
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
    [activeIndex, choose, closeMenu, entries, query, searchable],
  );

  const handleTriggerKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLButtonElement>) => {
      if (
        searchable &&
        !open &&
        event.key.length === 1 &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        event.preventDefault();
        openMenu(event.key);
        return;
      }

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
    [activeIndex, choose, closeMenu, entries, open, openMenu, searchable],
  );

  const handleSearchChange = useCallback(
    (event: ReactChangeEvent<HTMLInputElement>) => {
      setQuery(event.target.value);
      setActiveIndex(0);
    },
    [],
  );

  const handleSearchKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (event.key === " ") {
        return;
      }
      handleNavKey(event);
    },
    [handleNavKey],
  );

  const handleListMouseDown = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      event.preventDefault();
    },
    [],
  );

  const handleListClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>(
        "[data-option-value]",
      );
      if (!target) {
        return;
      }
      choose(target.dataset.optionValue ?? "");
    },
    [choose],
  );

  const handleListMouseOver = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>(
        "[data-option-index]",
      );
      if (!target) {
        return;
      }
      const index = Number(target.dataset.optionIndex);
      if (!Number.isNaN(index)) {
        setActiveIndex(index);
      }
    },
    [],
  );

  const handleListFocus = useCallback(
    (event: ReactFocusEvent<HTMLDivElement>) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>(
        "[data-option-index]",
      );
      if (!target) {
        return;
      }
      const index = Number(target.dataset.optionIndex);
      if (!Number.isNaN(index)) {
        setActiveIndex(index);
      }
    },
    [],
  );

  const handleListKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }
      const target = (event.target as HTMLElement).closest<HTMLElement>(
        "[data-option-value]",
      );
      if (!target) {
        return;
      }
      event.preventDefault();
      choose(target.dataset.optionValue ?? "");
    },
    [choose],
  );

  const activeOptionId =
    open && activeIndex >= 0 ? optionId(listId, activeIndex) : undefined;

  return {
    activeIndex,
    activeOptionId,
    ariaLabel,
    clearLabel,
    disabled,
    displayLabel,
    entries,
    handleClear,
    handleListClick,
    handleListFocus,
    handleListKeyDown,
    handleListMouseDown,
    handleListMouseOver,
    handleSearchChange,
    handleSearchKeyDown,
    handleTriggerClick,
    handleTriggerKeyDown,
    id,
    listId,
    open,
    query,
    rootRef,
    searchable,
    searchPlaceholder,
    searchRef,
    showClear,
    showingPlaceholder,
    value,
  };
}

/**
 * Builds a stable option id for activedescendant wiring.
 * @param listId Listbox id from `useId`.
 * @param index Option index within the current entries.
 */
export function optionId(listId: string, index: number): string {
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
