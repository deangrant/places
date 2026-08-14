import type { ReactNode } from "react";

/**
 * Props for a labeled form field pattern wrapping a single control.
 */
export interface FormFieldProps {
  /** Control rendered beneath the label. */
  children: ReactNode;
  /** Optional helper text under the control. */
  hint?: string;
  /** `htmlFor` linked to the control id. */
  htmlFor: string;
  /** Visible field label. */
  label: string;
}
