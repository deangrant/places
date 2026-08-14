/**
 * Props for the shared Spinner core control.
 */
export interface SpinnerProps {
  /** Accessible status text announced while loading. */
  label?: string;
  /** Visual scale; `lg` is for full-page loading cards. */
  size?: "sm" | "lg";
}
