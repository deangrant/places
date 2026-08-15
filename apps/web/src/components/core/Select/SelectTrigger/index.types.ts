import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
} from "react";

/**
 * Props for the Select trigger and optional clear control.
 */
export interface SelectTriggerProps {
  /** Id of the highlighted option when not using a search field. */
  activeOptionId: string | undefined;
  /** Accessible name when a visible label is absent. */
  ariaLabel: string | undefined;
  /** Accessible name for the clear control. */
  clearLabel: string;
  /** Disables the trigger. */
  disabled: boolean;
  /** Visible label text. */
  displayLabel: string;
  /** Optional id for FormField labeling. */
  id: string | undefined;
  /** Listbox id for `aria-controls`. */
  listId: string;
  /** Clears the selected value. */
  onClear: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  /** Toggles the menu. */
  onTriggerClick: () => void;
  /** Keyboard open/navigate/select. */
  onTriggerKeyDown: (event: ReactKeyboardEvent<HTMLButtonElement>) => void;
  /** Whether the menu is open. */
  open: boolean;
  /** When true, omit activedescendant on the trigger (search owns it). */
  searchable: boolean;
  /** Whether to show the clear control. */
  showClear: boolean;
  /** Whether the label is the empty placeholder. */
  showingPlaceholder: boolean;
}
