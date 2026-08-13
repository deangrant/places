/**
 * Allowlisted OSM keys for the Advanced tag filter (POI-relevant only).
 */
export const OSM_TAG_KEY_ALLOWLIST = [
  "amenity",
  "shop",
  "tourism",
  "leisure",
  "office",
  "craft",
  "healthcare",
] as const;

/** Allowlisted OSM key usable in the Advanced tag filter. */
export type OsmTagKey = (typeof OSM_TAG_KEY_ALLOWLIST)[number];

/**
 * Returns true when the key is in the Advanced OSM tag allowlist.
 * @param key Candidate OSM tag key.
 */
export function isAllowedOsmTagKey(key: string): key is OsmTagKey {
  return (OSM_TAG_KEY_ALLOWLIST as readonly string[]).includes(key);
}
