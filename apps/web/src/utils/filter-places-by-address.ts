import type { Place } from "@/types/places.types";

const ADDRESS_FIELDS = [
  "streetAddress",
  "city",
  "region",
  "postalCode",
  "isoCountryCode",
] as const satisfies readonly (keyof Place)[];

/**
 * Filters places to those whose address components contain the query.
 * Empty or whitespace-only queries return the full list unchanged.
 * Matching is case-insensitive substring against street, city, region,
 * postal code, and country code only.
 * @param places Places from the latest search.
 * @param query User-typed address filter text.
 */
export function filterPlacesByAddress(places: Place[], query: string): Place[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return places;
  }

  return places.filter((place) =>
    ADDRESS_FIELDS.some((field) => {
      const value = place[field];
      return (
        typeof value === "string" && value.toLowerCase().includes(normalized)
      );
    }),
  );
}
