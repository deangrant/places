/**
 * Props for a single place-detail field row.
 */
export interface DetailProps {
  /** When true, renders `value` as an external link. */
  isLink?: boolean;
  /** Field label shown in the definition list. */
  label: string;
  /** Display value; omitted from the DOM when null or empty. */
  value: string | null;
}
