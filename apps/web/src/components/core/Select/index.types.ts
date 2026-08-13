/**
 * One option in a native Select control.
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
  /** Disables selection. */
  disabled?: boolean;
  /** Optional id forwarded to the select element. */
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
