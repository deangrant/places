import type { Place } from "@/types/places.types";

const MATCH_FIELDS = [
  "streetAddress",
  "city",
  "region",
  "postalCode",
  "isoCountryCode",
  "locationName",
] as const satisfies readonly (keyof Place)[];

/**
 * Filters places to those whose name, brand, or address contains the query.
 * Empty or whitespace-only queries return the full list unchanged.
 * Matching is case-insensitive substring against location name, brands,
 * street, city, region, postal code, and country code.
 * @param places Places from the latest search.
 * @param query User-typed results filter text.
 */
export function filterPlacesByAddress(places: Place[], query: string): Place[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return places;
  }

  return places.filter((place) => {
    if (
      MATCH_FIELDS.some((field) => {
        const value = place[field];
        return (
          typeof value === "string" && value.toLowerCase().includes(normalized)
        );
      })
    ) {
      return true;
    }
    return place.brands.some((brand) =>
      brand.toLowerCase().includes(normalized),
    );
  });
}
