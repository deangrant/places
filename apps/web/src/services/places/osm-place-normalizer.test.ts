import { describe, expect, it } from "vitest";
import { OsmPlaceNormalizer } from "@/services/places/osm-place-normalizer";
import type { ICategoryMatcher } from "@/services/taxonomy/category-taxonomy";
import type { OsmElement } from "@/types/places.types";

const taxonomy: ICategoryMatcher = {
  matchTags: (tags) =>
    tags.amenity === "cafe"
      ? {
          id: "coffee-shops",
          subCategory: "Coffee Shops",
          tags: [{ key: "amenity", value: "cafe" }],
          topCategory: "Food Services",
        }
      : undefined,
};

describe("OsmPlaceNormalizer", () => {
  const normalizer = new OsmPlaceNormalizer(taxonomy);

  it("skips elements without usable coordinates", () => {
    const elements: OsmElement[] = [{ id: 1, type: "node" }];
    expect(normalizer.normalize(elements)).toEqual([]);
  });

  it("maps tags and taxonomy onto Place DTOs", () => {
    const elements: OsmElement[] = [
      {
        id: 2,
        lat: 47.6,
        lon: -122.3,
        tags: {
          amenity: "cafe",
          brand: "Starbucks; Reserve",
          name: "Pike Place",
          phone: "+1 206-555-0100",
          website: "starbucks.com",
        },
        type: "node",
      },
    ];
    const [place] = normalizer.normalize(elements, {
      city: "Seattle",
      isoCountryCode: "US",
    });
    expect(place.id).toBe("node/2");
    expect(place.locationName).toBe("Pike Place");
    expect(place.brands).toEqual(["Starbucks", "Reserve"]);
    expect(place.subCategory).toBe("Coffee Shops");
    expect(place.topCategory).toBe("Food Services");
    expect(place.city).toBe("Seattle");
    expect(place.website).toBe("starbucks.com");
  });
});
