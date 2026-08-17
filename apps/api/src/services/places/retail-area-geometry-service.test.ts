import type { OsmElement, Place } from "places-core/places";
import { describe, expect, it } from "vitest";
import { RetailAreaGeometryService } from "./retail-area-geometry-service.js";

function makePlace(
  partial: Partial<Place> & Pick<Place, "id" | "latitude" | "longitude">,
): Place {
  return {
    brands: [],
    city: null,
    geometry: { polygons: [] },
    geometryType: "POLYGON",
    geometryWkt: "POLYGON ((0 0, 1 0, 1 1, 0 1, 0 0))",
    isoCountryCode: null,
    locationName: null,
    openHours: null,
    osmId: 1,
    osmType: "way",
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

function closedSquare(
  min: number,
  max: number,
): NonNullable<OsmElement["geometry"]> {
  return [
    { lat: min, lon: min },
    { lat: min, lon: max },
    { lat: max, lon: max },
    { lat: max, lon: min },
    { lat: min, lon: min },
  ];
}

describe("RetailAreaGeometryService", () => {
  const service = new RetailAreaGeometryService();

  it("keeps place geometry when no retail polygon encloses the centroid", () => {
    const place = makePlace({
      geometryWkt: "POLYGON ((0 0, 1 0, 1 1, 0 1, 0 0))",
      id: "way/1",
      latitude: 0.5,
      longitude: 0.5,
    });
    const retail: OsmElement[] = [
      {
        geometry: closedSquare(2, 3),
        id: 10,
        tags: { landuse: "retail" },
        type: "way",
      },
    ];

    const [result] = service.applyEnclosingRetailAreas([place], retail);
    expect(result.geometryWkt).toBe(place.geometryWkt);
  });

  it("replaces place WKT with the enclosing retail polygon", () => {
    const place = makePlace({
      geometryWkt: "POLYGON ((1 1, 2 1, 2 2, 1 2, 1 1))",
      id: "way/1",
      latitude: 1.5,
      longitude: 1.5,
    });
    const retail: OsmElement[] = [
      {
        geometry: closedSquare(0, 4),
        id: 10,
        tags: { landuse: "retail" },
        type: "way",
      },
    ];

    const [result] = service.applyEnclosingRetailAreas([place], retail);
    expect(result.geometryType).toBe("POLYGON");
    expect(result.geometryWkt).toContain("POLYGON");
    expect(result.geometryWkt).not.toBe(place.geometryWkt);
    expect(result.id).toBe("way/1");
  });

  it("picks the smallest enclosing retail polygon when several contain the point", () => {
    const place = makePlace({
      id: "way/1",
      latitude: 1.5,
      longitude: 1.5,
    });
    const retail: OsmElement[] = [
      {
        geometry: closedSquare(0, 10),
        id: 10,
        tags: { landuse: "retail" },
        type: "way",
      },
      {
        geometry: closedSquare(1, 3),
        id: 11,
        tags: { shop: "mall" },
        type: "way",
      },
    ];

    const [result] = service.applyEnclosingRetailAreas([place], retail);
    // Smaller mall square (1..3) wins over the large landuse (0..10).
    expect(result.geometryWkt).toContain("1");
    expect(result.geometry.polygons[0][0].some((p) => p.lon === 10)).toBe(
      false,
    );
  });
});
