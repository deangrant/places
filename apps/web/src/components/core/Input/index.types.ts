import type { KeyboardEvent } from "react";

/**
 * Props for the shared text Input core control.
 */
export interface InputProps {
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
  /** Native input type; defaults to `text`. */
  type?: "text" | "search";
  /** Controlled input value. */
  value: string;
}
