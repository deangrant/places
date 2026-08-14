import { describe, expect, it } from "vitest";
import { boundsFromPoints } from "@/utils/geo";

describe("boundsFromPoints", () => {
  it("returns null for an empty point list", () => {
    expect(boundsFromPoints([])).toBeNull();
  });

  it("pads a single point", () => {
    const box = boundsFromPoints([{ lat: 10, lon: 20 }], 0.01);
    expect(box).toEqual({
      east: 20.01,
      north: 10.01,
      south: 9.99,
      west: 19.99,
    });
  });

  it("uses the shortest arc across the antimeridian", () => {
    const box = boundsFromPoints(
      [
        { lat: 0, lon: 170 },
        { lat: 0, lon: -170 },
      ],
      0,
    );
    expect(box).not.toBeNull();
    if (!box) {
      return;
    }
    // Mapbox fitBounds expects west > east when the box crosses ±180.
    expect(box.west).toBeGreaterThan(box.east);
    expect(box.west).toBe(170);
    expect(box.east).toBe(-170);
  });
});
