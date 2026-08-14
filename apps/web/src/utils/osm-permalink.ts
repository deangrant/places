/**
 * Builds the public OpenStreetMap element page URL.
 * @param osmType OSM element kind.
 * @param osmId OSM numeric id.
 */
export function osmPermalink(
  osmType: "node" | "way" | "relation",
  osmId: number,
): string {
  return `https://www.openstreetmap.org/${osmType}/${osmId}`;
}
