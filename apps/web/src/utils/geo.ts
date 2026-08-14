import type { BBox } from "@/types/places.types";

/**
 * Computes a bounding box that contains all provided points with padding.
 * Longitude uses the shortest covering arc so antimeridian-spanning sets
 * produce Mapbox-compatible west>east bounds instead of a near-global box.
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
  for (const point of points) {
    south = Math.min(south, point.lat);
    north = Math.max(north, point.lat);
  }

  const { east, west } = longitudeBounds(points.map((point) => point.lon));

  return {
    east: east + padDegrees,
    north: north + padDegrees,
    south: south - padDegrees,
    west: west - padDegrees,
  };
}

/**
 * Returns the shortest longitude arc covering all values.
 * Crossing the antimeridian yields west > east for Mapbox fitBounds.
 * @param longitudes Longitude samples in degrees.
 */
function longitudeBounds(longitudes: number[]): { east: number; west: number } {
  const sorted = [...longitudes].sort((left, right) => left - right);
  const [first] = sorted;
  const last = sorted.at(-1);
  if (first === undefined || last === undefined) {
    return { east: 0, west: 0 };
  }

  if (sorted.length === 1) {
    return { east: first, west: first };
  }

  let maxGap = 0;
  let gapAfterIndex = -1;
  // Gaps between consecutive sorted longitudes.
  for (let index = 0; index < sorted.length - 1; index += 1) {
    const gap = sorted[index + 1] - sorted[index];
    if (gap > maxGap) {
      maxGap = gap;
      gapAfterIndex = index;
    }
  }

  const wrapGap = first + 360 - last;
  if (wrapGap >= maxGap) {
    // Largest empty arc is the date-line wrap → bounds do not cross ±180.
    return { east: last, west: first };
  }

  // Largest empty arc is mid-range → bounds cross the antimeridian.
  return {
    east: sorted[gapAfterIndex],
    west: sorted[gapAfterIndex + 1],
  };
}
