import { OVERPASS_TIMEOUT_SECONDS, RESULT_LIMIT } from "places-core/overpass";
import type { SpatialScope } from "places-core/places";
import { RETAIL_AREA_TAG_SELECTORS } from "places-core/retail-area";

/**
 * Builds Overpass QL that fetches enclosing retail-area polygons for a scope.
 */
export interface IRetailAreaQueryBuilder {
  /**
   * Compiles a geom query for retail landuse and mall polygons in scope.
   * @param scope Resolved admin area and/or bounding box.
   */
  build: (scope: SpatialScope) => string;
}

/**
 * Default retail-area Overpass QL compiler (`landuse=retail`, `shop=mall`,
 * `landuse=commercial`).
 */
export class RetailAreaQueryBuilder implements IRetailAreaQueryBuilder {
  /**
   * Compiles a geom query for retail landuse and mall polygons in scope.
   * @param scope Resolved admin area and/or bounding box.
   */
  build(scope: SpatialScope): string {
    const spatial = formatSpatialFilter(scope);
    const unionBody = RETAIL_AREA_TAG_SELECTORS.map(
      (tag) =>
        `  wr["${escapeOverpass(tag.key)}"="${escapeOverpass(tag.value)}"]${spatial};`,
    ).join("\n");

    return [
      `[out:json][timeout:${OVERPASS_TIMEOUT_SECONDS}];`,
      formatAreaPreamble(scope),
      "(",
      unionBody,
      ");",
      `out geom ${RESULT_LIMIT};`,
    ]
      .filter(Boolean)
      .join("\n");
  }
}

/**
 * Emits an optional `area(...)` statement when an admin area is in scope.
 * @param scope Resolved spatial scope.
 */
function formatAreaPreamble(scope: SpatialScope): string {
  if (typeof scope.areaId !== "number") {
    return "";
  }
  if (!Number.isFinite(scope.areaId)) {
    throw new Error("Spatial scope requires an area or bounding box.");
  }
  return `area(${scope.areaId})->.searchArea;`;
}

/**
 * Returns the Overpass spatial suffix for each statement.
 * @param scope Resolved spatial scope.
 */
function formatSpatialFilter(scope: SpatialScope): string {
  if (typeof scope.areaId === "number") {
    if (!Number.isFinite(scope.areaId)) {
      throw new Error("Spatial scope requires an area or bounding box.");
    }
    return "(area.searchArea)";
  }
  if (scope.bbox) {
    const { south, west, north, east } = scope.bbox;
    if (
      !(
        Number.isFinite(south) &&
        Number.isFinite(west) &&
        Number.isFinite(north) &&
        Number.isFinite(east)
      )
    ) {
      throw new Error("Spatial scope requires an area or bounding box.");
    }
    return `(${south},${west},${north},${east})`;
  }
  throw new Error("Spatial scope requires an area or bounding box.");
}

/**
 * Escapes characters that are special inside Overpass string literals.
 * @param value Raw filter value.
 */
function escapeOverpass(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
