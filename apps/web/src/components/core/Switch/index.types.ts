/**
 * Props for the shared Switch core control.
 */
export interface SwitchProps {
  /** Id of an element that describes this switch. */
  "aria-describedby"?: string;
  /** Accessible name announced by assistive technology. */
  "aria-label"?: string;
  /** Controlled checked state. */
  checked: boolean;
  /** When true the switch cannot be toggled. */
  disabled?: boolean;
  /** Optional id for the root button. */
  id?: string;
  /** Called when the user toggles the switch. */
  onCheckedChange?: (checked: boolean) => void;
}
