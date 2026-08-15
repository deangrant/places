import { describe, expect, it, vi } from "vitest";
import { preparePlacesForGeometryExport } from "@/services/export/export-places-by-geometry";
import type { Place, PlaceSearchCriteria } from "@/types/places.types";

const criteria: PlaceSearchCriteria = {
  brand: "Acme",
  city: "Seattle",
  countryCode: "US",
};

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
    osmId: Number(partial.id.split("/")[1] ?? 1),
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

describe("preparePlacesForGeometryExport", () => {
  it("delegates to exportByGeometry with criteria and type", async () => {
    const exported = [place({ id: "node/1" })];
    const exportByGeometry = vi.fn(async () => exported);
    const result = await preparePlacesForGeometryExport(
      criteria,
      "POINT",
      exportByGeometry,
    );
    expect(exportByGeometry).toHaveBeenCalledWith(
      criteria,
      "POINT",
      undefined,
      undefined,
    );
    expect(result).toEqual(exported);
  });

  it("passes POLYGON through without client-side place-list filtering", async () => {
    const exported = [place({ geometryType: "POLYGON", id: "way/2" })];
    const exportByGeometry = vi.fn(async () => exported);
    const result = await preparePlacesForGeometryExport(
      criteria,
      "POLYGON",
      exportByGeometry,
    );
    expect(exportByGeometry).toHaveBeenCalledWith(
      criteria,
      "POLYGON",
      undefined,
      undefined,
    );
    expect(result).toEqual(exported);
  });
});
