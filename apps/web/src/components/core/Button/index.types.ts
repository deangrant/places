import type { ReactNode } from "react";

/**
 * Visual emphasis for the Button control.
 *
 * - `primary` — main call-to-action
 * - `secondary` — supporting action
 * - `ghost` — low-emphasis / toolbar action
 */
export type ButtonVariant = "primary" | "secondary" | "ghost";

/**
 * Props for the shared Button core control.
 */
export interface ButtonProps {
  /** Optional id of an element this button controls. */
  "aria-controls"?: string;
  /** Expanded state when the button toggles a disclosure. */
  "aria-expanded"?: boolean;
  /** Button label content. */
  children: ReactNode;
  /** Extra class names merged onto the root element. */
  className?: string;
  /** Disables press interaction. */
  disabled?: boolean;
  /** Click handler for the button. */
  onClick?: () => void;
  /** Native title / tooltip text. */
  title?: string;
  /** Native button type; defaults to `button`. */
  type?: "button" | "submit";
  /** Visual variant; defaults to `primary`. */
  variant?: ButtonVariant;
}
