const TEL_SCHEME_PREFIX = /^tel:/i;
const NON_DIGITS = /\D/g;

/**
 * Returns a safe `tel:` href for untrusted phone strings, or null.
 * Display text should stay the original value; only the href is normalized.
 * @param value Raw phone from OSM or other untrusted input.
 */
export function safeTelHref(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const withoutScheme = trimmed.replace(TEL_SCHEME_PREFIX, "").trim();
  const hasLeadingPlus = withoutScheme.startsWith("+");
  const digits = withoutScheme.replace(NON_DIGITS, "");
  if (!digits) {
    return null;
  }

  return `tel:${hasLeadingPlus ? `+${digits}` : digits}`;
}
