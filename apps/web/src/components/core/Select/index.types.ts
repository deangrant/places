/**
 * One option in a Select listbox.
 */
export interface SelectOption {
  /** Human-readable option label. */
  label: string;
  /** Option value submitted on change. */
  value: string;
}

/**
 * Props for the shared Select core control.
 */
export interface SelectProps {
  /** Accessible name when a visible label is absent. */
  "aria-label"?: string;
  /**
   * When true, shows an inline clear control while a value is selected.
   */
  clearable?: boolean;
  /** Accessible name for the clear control; defaults to `"Clear"`. */
  clearLabel?: string;
  /** Disables selection. */
  disabled?: boolean;
  /** Optional id forwarded to the trigger for FormField labeling. */
  id?: string;
  /** Called with the newly selected value. */
  onChange: (value: string) => void;
  /** Options rendered in the dropdown. */
  options: SelectOption[];
  /** Empty-value placeholder option label. */
  placeholder?: string;
  /** Controlled selected value. */
  value: string;
}
