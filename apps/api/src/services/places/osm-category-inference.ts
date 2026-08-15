/**
 * Ordered OSM primary-key → top-category label pairs for taxonomy fallbacks.
 * Earlier keys win when an element has multiple primary tags.
 */
const TOP_CATEGORY_BY_OSM_KEY: readonly {
  key: string;
  topCategory: string;
}[] = [
  { key: "amenity", topCategory: "Amenities" },
  { key: "shop", topCategory: "Retail Trade" },
  { key: "tourism", topCategory: "Tourism" },
  { key: "leisure", topCategory: "Arts and Recreation" },
  { key: "office", topCategory: "Professional Services" },
  { key: "craft", topCategory: "Other Services" },
  { key: "healthcare", topCategory: "Health Care" },
];

const PRIMARY_OSM_KEYS = TOP_CATEGORY_BY_OSM_KEY.map((entry) => entry.key);

/**
 * Infers a coarse top category from primary OSM keys when taxonomy misses.
 * @param tags OSM tags.
 */
export function inferTopCategory(tags: Record<string, string>): string | null {
  for (const entry of TOP_CATEGORY_BY_OSM_KEY) {
    if (Object.hasOwn(tags, entry.key)) {
      return entry.topCategory;
    }
  }
  return null;
}

/**
 * Infers a sub-category label from the primary OSM tag value.
 * @param tags OSM tags.
 */
export function inferSubCategory(tags: Record<string, string>): string | null {
  const value = PRIMARY_OSM_KEYS.map((key) => readTag(tags, key)).find(
    (candidate) => candidate !== null,
  );
  if (!value) {
    return null;
  }
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/**
 * Reads an OSM tag when the key is present on the element.
 */
function readTag(tags: Record<string, string>, key: string): string | null {
  if (!Object.hasOwn(tags, key)) {
    return null;
  }
  return tags[key];
}
