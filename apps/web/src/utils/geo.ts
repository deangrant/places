import type { BBox } from "@/types/places.types";

/**
 * Computes a bounding box that contains all provided points with padding.
 * @param points Latitude/longitude pairs.
 * @param padDegrees Padding in degrees applied on each side.
 */
export function boundsFromPoints(
  points: { lat: number; lon: number }[],
  padDegrees = 0.01,
): BBox | null {
  if (points.length === 0) {
    return null;
  }
  let south = points[0].lat;
  let north = points[0].lat;
  let west = points[0].lon;
  let east = points[0].lon;
  for (const point of points) {
    south = Math.min(south, point.lat);
    north = Math.max(north, point.lat);
    west = Math.min(west, point.lon);
    east = Math.max(east, point.lon);
  }
  return {
    east: east + padDegrees,
    north: north + padDegrees,
    south: south - padDegrees,
    west: west - padDegrees,
  };
}
