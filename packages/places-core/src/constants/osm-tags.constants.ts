/**
 * Allowlisted OSM keys for the Advanced tag filter.
 * Standalone top-level feature keys from the OSM Top-level tag wiki,
 * excluding `boundary` and `route` (poor fit for Places nwr key=value search).
 * @see https://wiki.openstreetmap.org/wiki/Top-level_tag
 */
export const OSM_TAG_KEY_ALLOWLIST = [
  "advertising",
  "aerialway",
  "aeroway",
  "amenity",
  "barrier",
  "building",
  "club",
  "craft",
  "departures_board",
  "education",
  "emergency",
  "geological",
  "healthcare",
  "highway",
  "historic",
  "landcover",
  "landuse",
  "leisure",
  "man_made",
  "military",
  "natural",
  "office",
  "piste:type",
  "place",
  "power",
  "public_transport",
  "railway",
  "shop",
  "telecom",
  "tourism",
  "waterway",
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
