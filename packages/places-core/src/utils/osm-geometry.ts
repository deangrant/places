import type {
  LonLat,
  OsmElement,
  OsmLatLon,
  PlaceDrawableGeometry,
  PlaceGeometryType,
} from "../types/places.types.js";

/**
 * Normalized geometry ready for Place DTOs, map drawing, and WKT export.
 */
export interface NormalizedOsmGeometry {
  /** Centroid used for markers and fit-bounds. */
  centroid: LonLat;
  /** Drawable polygon rings (empty for points). */
  geometry: PlaceDrawableGeometry;
  /** WKT geometry class for the normalized shape. */
  geometryType: PlaceGeometryType;
  /** Well-Known Text for the normalized shape. */
  geometryWkt: string;
}

const COORD_PRECISION = 7;
const CLOSED_EPSILON = 1e-9;

/**
 * Builds drawable geometry and WKT from an Overpass element with `out geom`.
 * @param element Overpass node, way, or relation.
 * @returns Normalized geometry, or null when no usable coordinate exists.
 */
export function normalizeOsmGeometry(
  element: OsmElement,
): NormalizedOsmGeometry | null {
  if (element.type === "node") {
    return fromPoint(element.lat, element.lon);
  }

  if (element.type === "way") {
    return fromWay(element.geometry, element.center);
  }

  return fromRelation(element);
}

/**
 * Builds POINT-only geometry from an Overpass `out center` element.
 * Ignores way/relation geometry so search results never carry footprints.
 * @param element Overpass node, way, or relation.
 * @returns POINT geometry, or null when no usable coordinate exists.
 */
export function normalizeOsmCenterPoint(
  element: OsmElement,
): NormalizedOsmGeometry | null {
  if (element.type === "node") {
    return fromPoint(element.lat, element.lon);
  }
  return fromPoint(element.center?.lat, element.center?.lon);
}

/**
 * Creates a POINT geometry from a single coordinate.
 */
function fromPoint(
  lat: number | undefined,
  lon: number | undefined,
): NormalizedOsmGeometry | null {
  if (
    lat === undefined ||
    lon === undefined ||
    Number.isNaN(lat) ||
    Number.isNaN(lon)
  ) {
    return null;
  }
  const centroid = { lat, lon };
  return {
    centroid,
    geometry: { polygons: [] },
    geometryType: "POINT",
    geometryWkt: formatPointWkt(centroid),
  };
}

/**
 * Builds geometry from a way's node list; closed ways become polygons.
 * @param geometry Way node positions.
 * @param center Optional Overpass center fallback.
 */
function fromWay(
  geometry: OsmLatLon[] | undefined,
  center?: { lat: number; lon: number },
): NormalizedOsmGeometry | null {
  const ring = toLonLatRing(geometry);
  if (ring && isClosedRing(ring) && ring.length >= 4) {
    const closed = ensureClosed(ring);
    const centroid = ringCentroid(closed);
    return {
      centroid,
      geometry: { polygons: [[closed]] },
      geometryType: "POLYGON",
      geometryWkt: formatPolygonWkt([closed]),
    };
  }

  if (ring && ring.length > 0) {
    const centroid = ringCentroid(ring);
    return {
      centroid,
      geometry: { polygons: [] },
      geometryType: "POINT",
      geometryWkt: formatPointWkt(centroid),
    };
  }

  return fromPoint(center?.lat, center?.lon);
}

/**
 * Builds polygon / multipolygon geometry from a relation's members.
 * @param element Overpass relation element.
 */
function fromRelation(element: OsmElement): NormalizedOsmGeometry | null {
  const members = element.members ?? [];
  const outers: LonLat[][] = [];
  const inners: LonLat[][] = [];

  for (const member of members) {
    if (member.type !== "way" || !member.geometry?.length) {
      continue;
    }
    const ring = toLonLatRing(member.geometry);
    if (!ring || ring.length < 4 || !isClosedRing(ring)) {
      continue;
    }
    const closed = ensureClosed(ring);
    if (member.role === "inner") {
      inners.push(closed);
    } else {
      // Treat empty role and "outer" as exterior rings.
      outers.push(closed);
    }
  }

  if (outers.length === 1) {
    const rings = [outers[0], ...inners];
    return {
      centroid: ringCentroid(outers[0]),
      geometry: { polygons: [rings] },
      geometryType: "POLYGON",
      geometryWkt: formatPolygonWkt(rings),
    };
  }

  if (outers.length > 1) {
    // Assign each inner to the first outer that contains its centroid.
    const polygons: LonLat[][][] = outers.map((outer) => [outer]);
    for (const inner of inners) {
      const owner = polygons.find((polygon) =>
        pointInRing(ringCentroid(inner), polygon[0]),
      );
      if (owner) {
        owner.push(inner);
      }
    }
    return {
      centroid: ringCentroid(outers[0]),
      geometry: { polygons },
      geometryType: "MULTIPOLYGON",
      geometryWkt: formatMultiPolygonWkt(polygons),
    };
  }

  const { center } = element;
  if (center) {
    return fromPoint(center.lat, center.lon);
  }
  return fromPoint(element.lat, element.lon);
}

/**
 * Maps Overpass lat/lon arrays into LonLat positions.
 * @param geometry Overpass geometry array.
 */
function toLonLatRing(geometry: OsmLatLon[] | undefined): LonLat[] | null {
  if (!geometry?.length) {
    return null;
  }
  return geometry.map((point) => ({ lat: point.lat, lon: point.lon }));
}

/**
 * Returns true when the first and last positions are effectively equal.
 */
function isClosedRing(ring: LonLat[]): boolean {
  if (ring.length < 2) {
    return false;
  }
  const [first] = ring;
  const last = ring.at(-1);
  if (!(first && last)) {
    return false;
  }
  return (
    Math.abs(first.lat - last.lat) < CLOSED_EPSILON &&
    Math.abs(first.lon - last.lon) < CLOSED_EPSILON
  );
}

/**
 * Ensures the ring repeats the first coordinate at the end.
 */
function ensureClosed(ring: LonLat[]): LonLat[] {
  if (isClosedRing(ring)) {
    return ring;
  }
  return [...ring, ring[0]];
}

/**
 * Computes a simple average centroid for a ring (adequate for markers).
 */
function ringCentroid(ring: LonLat[]): LonLat {
  const usable =
    isClosedRing(ring) && ring.length > 1 ? ring.slice(0, -1) : ring;
  let lat = 0;
  let lon = 0;
  for (const point of usable) {
    lat += point.lat;
    lon += point.lon;
  }
  const count = Math.max(1, usable.length);
  return { lat: lat / count, lon: lon / count };
}

/**
 * Ray-cast point-in-polygon test for assigning holes to outer rings.
 * @param point Test point.
 * @param ring Closed outer ring.
 */
function pointInRing(point: LonLat, ring: LonLat[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const xi = ring[i].lon;
    const yi = ring[i].lat;
    const xj = ring[j].lon;
    const yj = ring[j].lat;
    // Horizontal edges never cross a horizontal ray; skip to avoid divide-by-near-zero.
    if (Math.abs(yj - yi) <= CLOSED_EPSILON) {
      continue;
    }
    const intersect =
      yi > point.lat !== yj > point.lat &&
      point.lon < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;
    if (intersect) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * Formats a WKT POINT.
 * @param point Lon/lat position.
 */
export function formatPointWkt(point: LonLat): string {
  return `POINT (${formatCoord(point.lon)} ${formatCoord(point.lat)})`;
}

/**
 * Formats a WKT POLYGON from exterior + optional hole rings.
 * @param rings Ring list (first is exterior).
 */
export function formatPolygonWkt(rings: LonLat[][]): string {
  return `POLYGON (${rings.map(formatRingWkt).join(", ")})`;
}

/**
 * Formats a WKT MULTIPOLYGON.
 * @param polygons List of polygon ring-sets.
 */
export function formatMultiPolygonWkt(polygons: LonLat[][][]): string {
  const body = polygons
    .map((rings) => `(${rings.map(formatRingWkt).join(", ")})`)
    .join(", ");
  return `MULTIPOLYGON (${body})`;
}

/**
 * Formats one ring as `(lon lat, lon lat, ...)`.
 * @param ring Closed lon/lat ring.
 */
function formatRingWkt(ring: LonLat[]): string {
  return `(${ring
    .map((point) => `${formatCoord(point.lon)} ${formatCoord(point.lat)}`)
    .join(", ")})`;
}

/**
 * Formats a coordinate with stable precision for compact WKT.
 */
function formatCoord(value: number): string {
  return Number(value.toFixed(COORD_PRECISION)).toString();
}
