/**
 * Props for a single place-detail field row.
 */
export interface DetailProps {
  /**
   * Optional link target. When set, `value` is rendered as an anchor.
   * Use `tel:` for phones; http(s) links open in a new tab.
   */
  href?: string | null;
  /** Field label shown in the definition list. */
  label: string;
  /** Display value; omitted from the DOM when null or empty. */
  value: string | null;
}
