import { describe, expect, it } from "vitest";
import type {
  OsmElement,
  PlaceDrawableGeometry,
} from "../types/places.types.js";
import {
  approximateDrawableArea,
  normalizeOsmCenterPoint,
  normalizeOsmGeometry,
  pointInDrawableGeometry,
} from "./osm-geometry.js";

describe("normalizeOsmGeometry", () => {
  it("returns null when a node has no coordinates", () => {
    expect(normalizeOsmGeometry({ id: 1, type: "node" })).toBeNull();
  });

  it("builds a polygon from a closed way", () => {
    const element: OsmElement = {
      geometry: [
        { lat: 0, lon: 0 },
        { lat: 0, lon: 1 },
        { lat: 1, lon: 1 },
        { lat: 1, lon: 0 },
        { lat: 0, lon: 0 },
      ],
      id: 2,
      type: "way",
    };
    const result = normalizeOsmGeometry(element);
    expect(result).not.toBeNull();
    if (!result) {
      return;
    }
    expect(result.geometryType).toBe("POLYGON");
    expect(result.geometry.polygons[0][0].length).toBeGreaterThanOrEqual(5);
  });

  it("uses open-way node centroid when the ring is not closed", () => {
    const element: OsmElement = {
      center: { lat: 5, lon: 6 },
      geometry: [
        { lat: 0, lon: 0 },
        { lat: 0, lon: 1 },
      ],
      id: 3,
      type: "way",
    };
    const result = normalizeOsmGeometry(element);
    expect(result?.geometryType).toBe("POINT");
    expect(result?.centroid).toEqual({ lat: 0, lon: 0.5 });
  });

  it("falls back to center when a way has no geometry nodes", () => {
    const element: OsmElement = {
      center: { lat: 5, lon: 6 },
      id: 31,
      type: "way",
    };
    const result = normalizeOsmGeometry(element);
    expect(result?.geometryType).toBe("POINT");
    expect(result?.centroid).toEqual({ lat: 5, lon: 6 });
  });

  it("assigns multipolygon holes to the containing outer", () => {
    const element: OsmElement = {
      id: 4,
      members: [
        {
          geometry: [
            { lat: 0, lon: 0 },
            { lat: 0, lon: 10 },
            { lat: 10, lon: 10 },
            { lat: 10, lon: 0 },
            { lat: 0, lon: 0 },
          ],
          ref: 1,
          role: "outer",
          type: "way",
        },
        {
          geometry: [
            { lat: 20, lon: 20 },
            { lat: 20, lon: 30 },
            { lat: 30, lon: 30 },
            { lat: 30, lon: 20 },
            { lat: 20, lon: 20 },
          ],
          ref: 2,
          role: "outer",
          type: "way",
        },
        {
          geometry: [
            { lat: 2, lon: 2 },
            { lat: 2, lon: 3 },
            { lat: 3, lon: 3 },
            { lat: 3, lon: 2 },
            { lat: 2, lon: 2 },
          ],
          ref: 3,
          role: "inner",
          type: "way",
        },
      ],
      type: "relation",
    };
    const result = normalizeOsmGeometry(element);
    expect(result).not.toBeNull();
    if (!result) {
      return;
    }
    expect(result.geometryType).toBe("MULTIPOLYGON");
    expect(result.geometry.polygons).toHaveLength(2);
    expect(result.geometry.polygons[0]).toHaveLength(2);
    expect(result.geometry.polygons[1]).toHaveLength(1);
  });
});

describe("normalizeOsmCenterPoint", () => {
  it("returns a point from out center without full geometry", () => {
    const result = normalizeOsmCenterPoint({
      center: { lat: 1.5, lon: 2.5 },
      id: 8,
      type: "way",
    });
    expect(result?.geometryType).toBe("POINT");
    expect(result?.centroid).toEqual({ lat: 1.5, lon: 2.5 });
  });
});

describe("pointInDrawableGeometry", () => {
  const square: PlaceDrawableGeometry = {
    polygons: [
      [
        [
          { lat: 0, lon: 0 },
          { lat: 0, lon: 2 },
          { lat: 2, lon: 2 },
          { lat: 2, lon: 0 },
          { lat: 0, lon: 0 },
        ],
      ],
    ],
  };

  it("reports points inside the outer ring", () => {
    expect(pointInDrawableGeometry({ lat: 1, lon: 1 }, square)).toBe(true);
  });

  it("reports points outside the outer ring", () => {
    expect(pointInDrawableGeometry({ lat: 5, lon: 5 }, square)).toBe(false);
  });

  it("excludes points that fall in a hole", () => {
    const withHole: PlaceDrawableGeometry = {
      polygons: [
        [
          [
            { lat: 0, lon: 0 },
            { lat: 0, lon: 4 },
            { lat: 4, lon: 4 },
            { lat: 4, lon: 0 },
            { lat: 0, lon: 0 },
          ],
          [
            { lat: 1, lon: 1 },
            { lat: 1, lon: 2 },
            { lat: 2, lon: 2 },
            { lat: 2, lon: 1 },
            { lat: 1, lon: 1 },
          ],
        ],
      ],
    };
    expect(pointInDrawableGeometry({ lat: 1.5, lon: 1.5 }, withHole)).toBe(
      false,
    );
    expect(pointInDrawableGeometry({ lat: 0.5, lon: 0.5 }, withHole)).toBe(
      true,
    );
  });
});

describe("approximateDrawableArea", () => {
  it("ranks a larger square above a smaller nested square", () => {
    const large: PlaceDrawableGeometry = {
      polygons: [
        [
          [
            { lat: 0, lon: 0 },
            { lat: 0, lon: 4 },
            { lat: 4, lon: 4 },
            { lat: 4, lon: 0 },
            { lat: 0, lon: 0 },
          ],
        ],
      ],
    };
    const small: PlaceDrawableGeometry = {
      polygons: [
        [
          [
            { lat: 1, lon: 1 },
            { lat: 1, lon: 2 },
            { lat: 2, lon: 2 },
            { lat: 2, lon: 1 },
            { lat: 1, lon: 1 },
          ],
        ],
      ],
    };
    expect(approximateDrawableArea(large)).toBeGreaterThan(
      approximateDrawableArea(small),
    );
  });
});
