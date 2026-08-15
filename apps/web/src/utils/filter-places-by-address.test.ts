import { describe, expect, it } from "vitest";
import type { Place } from "@/types/places.types";
import { filterPlacesByAddress } from "@/utils/filter-places-by-address";

function place(partial: Partial<Place> & Pick<Place, "id">): Place {
  return {
    brands: [],
    city: null,
    geometry: { polygons: [] },
    geometryType: "POINT",
    geometryWkt: "POINT(0 0)",
    isoCountryCode: null,
    latitude: 0,
    locationName: null,
    longitude: 0,
    openHours: null,
    osmId: 1,
    osmType: "node",
    phoneNumber: null,
    postalCode: null,
    region: null,
    streetAddress: null,
    subCategory: null,
    tags: {},
    topCategory: null,
    website: null,
    ...partial,
  };
}

describe("filterPlacesByAddress", () => {
  const places = [
    place({
      city: "San Francisco",
      id: "a",
      isoCountryCode: "US",
      locationName: "Hidden Cafe",
      postalCode: "94107",
      region: "California",
      streetAddress: "123 Market St",
    }),
    place({
      city: "Oakland",
      id: "b",
      isoCountryCode: "US",
      locationName: "Market Kitchen",
      region: "California",
      streetAddress: "9 Broadway",
    }),
    place({
      brands: ["Starbucks"],
      city: "London",
      id: "c",
      isoCountryCode: "GB",
      postalCode: "EC2A 4BX",
      region: "England",
      streetAddress: "1 Curtain Rd",
    }),
  ];

  it("returns all places for an empty or whitespace query", () => {
    expect(filterPlacesByAddress(places, "")).toEqual(places);
    expect(filterPlacesByAddress(places, "   ")).toEqual(places);
  });

  it("matches street, city, region, postal code, and country case-insensitively", () => {
    expect(filterPlacesByAddress(places, "market").map((p) => p.id)).toEqual([
      "a",
      "b",
    ]);
    expect(filterPlacesByAddress(places, "oakland").map((p) => p.id)).toEqual([
      "b",
    ]);
    expect(filterPlacesByAddress(places, "england").map((p) => p.id)).toEqual([
      "c",
    ]);
    expect(filterPlacesByAddress(places, "94107").map((p) => p.id)).toEqual([
      "a",
    ]);
    expect(filterPlacesByAddress(places, "gb").map((p) => p.id)).toEqual(["c"]);
  });

  it("matches locationName case-insensitively", () => {
    expect(
      filterPlacesByAddress(places, "Hidden Cafe").map((p) => p.id),
    ).toEqual(["a"]);
    expect(
      filterPlacesByAddress(places, "Market Kitchen").map((p) => p.id),
    ).toEqual(["b"]);
  });

  it("matches brand names case-insensitively", () => {
    expect(filterPlacesByAddress(places, "starbucks").map((p) => p.id)).toEqual(
      ["c"],
    );
  });
});
