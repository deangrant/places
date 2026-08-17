import {
  approximateDrawableArea,
  normalizeOsmGeometry,
  pointInDrawableGeometry,
} from "places-core/osm-geometry";
import type { OsmElement, Place } from "places-core/places";

/**
 * Replaces place footprints with enclosing retail-area geometry when present.
 */
export interface IRetailAreaGeometryResolver {
  /**
   * Copies the smallest enclosing retail polygon onto each place that has one.
   * Places without an enclosing retail polygon are left unchanged.
   * @param places Filtered export places (POLYGON / MULTIPOLYGON).
   * @param retailElements Overpass retail-area elements with `out geom`.
   */
  applyEnclosingRetailAreas: (
    places: Place[],
    retailElements: OsmElement[],
  ) => Place[];
}

/**
 * Candidate retail footprint used for containment matching.
 */
interface RetailFootprint {
  /** Approximate planar area for smallest-enclosing selection. */
  area: number;
  /** Drawable rings from the retail OSM feature. */
  geometry: Place["geometry"];
  /** Geometry class of the retail feature. */
  geometryType: Place["geometryType"];
  /** WKT of the retail feature. */
  geometryWkt: string;
}

/**
 * Matches place centroids to enclosing OSM retail polygons and rewrites WKT.
 */
export class RetailAreaGeometryService implements IRetailAreaGeometryResolver {
  /**
   * Copies the smallest enclosing retail polygon onto each place that has one.
   * @param places Filtered export places (POLYGON / MULTIPOLYGON).
   * @param retailElements Overpass retail-area elements with `out geom`.
   */
  applyEnclosingRetailAreas(
    places: Place[],
    retailElements: OsmElement[],
  ): Place[] {
    const footprints = collectRetailFootprints(retailElements);
    if (footprints.length === 0) {
      return places;
    }

    return places.map((place) => {
      const point = { lat: place.latitude, lon: place.longitude };
      let best: RetailFootprint | null = null;
      for (const footprint of footprints) {
        if (!pointInDrawableGeometry(point, footprint.geometry)) {
          continue;
        }
        if (!best || footprint.area < best.area) {
          best = footprint;
        }
      }
      if (!best) {
        return place;
      }
      return {
        ...place,
        geometry: best.geometry,
        geometryType: best.geometryType,
        geometryWkt: best.geometryWkt,
      };
    });
  }
}

/**
 * Normalizes retail Overpass elements into polygon footprints.
 * @param retailElements Overpass ways/relations tagged as retail areas.
 */
function collectRetailFootprints(
  retailElements: OsmElement[],
): RetailFootprint[] {
  const footprints: RetailFootprint[] = [];
  for (const element of retailElements) {
    const normalized = normalizeOsmGeometry(element);
    if (!normalized) {
      continue;
    }
    if (
      normalized.geometryType !== "POLYGON" &&
      normalized.geometryType !== "MULTIPOLYGON"
    ) {
      continue;
    }
    footprints.push({
      area: approximateDrawableArea(normalized.geometry),
      geometry: normalized.geometry,
      geometryType: normalized.geometryType,
      geometryWkt: normalized.geometryWkt,
    });
  }
  return footprints;
}
