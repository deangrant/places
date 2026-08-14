const HAS_URL_SCHEME = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;

/**
 * Returns a safe `http:` / `https:` href for untrusted URL strings, or null.
 * Scheme-less hostnames (common in OSM tags) are treated as `https://`.
 * @param value Raw URL or hostname from OSM or other untrusted input.
 */
export function safeHttpUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  let candidate = trimmed;
  if (trimmed.startsWith("//")) {
    candidate = `https:${trimmed}`;
  } else if (!HAS_URL_SCHEME.test(trimmed)) {
    // OSM often stores bare hostnames without a scheme.
    candidate = `https://${trimmed}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return null;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return null;
  }

  return parsed.href;
}
