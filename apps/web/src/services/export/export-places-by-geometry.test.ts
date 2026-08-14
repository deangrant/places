import { describe, expect, it, vi } from "vitest";
import {
  preparePlacesForGeometryExport,
  resolveEffectiveGeometryType,
} from "@/services/export/export-places-by-geometry";
import type { Place, PlaceSearchCriteria } from "@/types/places.types";

const AT_LEAST_ONE_TYPE = /at least one/i;

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

describe("resolveEffectiveGeometryType", () => {
  it("prefers MULTIPOLYGON when all types are selected", () => {
    expect(
      resolveEffectiveGeometryType(["POINT", "POLYGON", "MULTIPOLYGON"]),
    ).toBe("MULTIPOLYGON");
  });

  it("prefers POLYGON over POINT", () => {
    expect(resolveEffectiveGeometryType(["POINT", "POLYGON"])).toBe("POLYGON");
  });

  it("returns POINT when only POINT is selected", () => {
    expect(resolveEffectiveGeometryType(["POINT"])).toBe("POINT");
  });

  it("throws when nothing is selected", () => {
    expect(() => resolveEffectiveGeometryType([])).toThrow(AT_LEAST_ONE_TYPE);
  });
});

describe("preparePlacesForGeometryExport", () => {
  it("delegates to exportByGeometry with criteria and type", async () => {
    const exported = [place({ id: "node/1" })];
    const exportByGeometry = vi.fn(async () => exported);
    const result = await preparePlacesForGeometryExport(
      criteria,
      "POINT",
      exportByGeometry,
    );
    expect(exportByGeometry).toHaveBeenCalledWith(criteria, "POINT", undefined);
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
    );
    expect(result).toEqual(exported);
  });
});
