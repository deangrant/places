import type { KeyboardEvent } from "react";

/**
 * Props for the shared text Input core control.
 */
export interface InputProps {
  /** Active option id for combobox `aria-activedescendant`. */
  "aria-activedescendant"?: string;
  /** Combobox autocomplete behavior announced to assistive tech. */
  "aria-autocomplete"?: "list" | "none";
  /** Id of the controlled listbox for combobox inputs. */
  "aria-controls"?: string;
  /** Whether an associated popup (e.g. listbox) is expanded. */
  "aria-expanded"?: boolean;
  /** Accessible name when no visible label is present. */
  "aria-label"?: string;
  /** Browser autocomplete hint. */
  autoComplete?: string;
  /** Disables editing. */
  disabled?: boolean;
  /** Optional id forwarded to the input element. */
  id?: string;
  /** Optional datalist id for native suggestions. */
  list?: string;
  /** Called when the typed value changes. */
  onChange: (value: string) => void;
  /** Optional keydown handler (e.g. Enter to search). */
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  /** Placeholder shown when the value is empty. */
  placeholder?: string;
  /** Explicit ARIA role when used as a combobox. */
  role?: "combobox";
  /** Native input type; defaults to `text`. */
  type?: "text" | "search";
  /** Controlled input value. */
  value: string;
}
