import { describe, expect, it } from "vitest";
import type { Place } from "@/types/places.types";
import { placesForMapSource, placesToGeoJson } from "./map-helpers";

function makePlace(id: string, lon = 0, lat = 0): Place {
  return {
    brands: [],
    city: null,
    geometry: { polygons: [] },
    geometryType: "POINT",
    geometryWkt: `POINT(${lon} ${lat})`,
    id,
    isoCountryCode: null,
    latitude: lat,
    locationName: id,
    longitude: lon,
    openHours: null,
    osmId: Number(id.split("/")[1] ?? 0),
    osmType: "node",
    phoneNumber: null,
    postalCode: null,
    region: null,
    streetAddress: null,
    subCategory: null,
    tags: {},
    topCategory: null,
    website: null,
  };
}

describe("placesForMapSource", () => {
  const places = [
    makePlace("node/1"),
    makePlace("node/2"),
    makePlace("node/3"),
  ];

  it("keeps all places when nothing is selected", () => {
    expect(placesForMapSource(places, null)).toEqual(places);
  });

  it("keeps only the selected place when one is selected", () => {
    expect(placesForMapSource(places, "node/2")).toEqual([places[1]]);
  });
});

describe("placesToGeoJson", () => {
  it("marks the selected place in feature properties", () => {
    const places = [
      makePlace("node/1", -122, 47),
      makePlace("node/2", -121, 48),
    ];
    const collection = placesToGeoJson(places, "node/2");
    expect(collection.features).toHaveLength(2);
    expect(collection.features[0].properties).toMatchObject({
      id: "node/1",
      selected: false,
    });
    expect(collection.features[1].properties).toMatchObject({
      id: "node/2",
      selected: true,
    });
  });
});
