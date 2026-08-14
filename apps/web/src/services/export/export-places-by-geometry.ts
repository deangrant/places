import type {
  Place,
  PlaceGeometryType,
  PlaceSearchCriteria,
} from "@/types/places.types";

/** Geometry types offered in the export modal, highest priority first. */
export const EXPORT_GEOMETRY_TYPE_PRIORITY = [
  "MULTIPOLYGON",
  "POLYGON",
  "POINT",
] as const satisfies readonly PlaceGeometryType[];

/**
 * Re-queries Overpass for places matching one export geometry type.
 * @param criteria Active search filters.
 * @param geometryType Effective export geometry type.
 * @param signal Optional abort signal.
 */
export type ExportPlacesByGeometry = (
  criteria: PlaceSearchCriteria,
  geometryType: PlaceGeometryType,
  signal?: AbortSignal,
) => Promise<Place[]>;

/**
 * Picks the single export geometry type from a multi-select using priority order.
 * @param selected Types the user toggled on in the export modal.
 * @returns Highest-priority selected type.
 */
export function resolveEffectiveGeometryType(
  selected: readonly PlaceGeometryType[],
): PlaceGeometryType {
  if (selected.length === 0) {
    throw new Error("Select at least one geometry type to export.");
  }
  const selectedSet = new Set(selected);
  for (const type of EXPORT_GEOMETRY_TYPE_PRIORITY) {
    if (selectedSet.has(type)) {
      return type;
    }
  }
  throw new Error("Select at least one geometry type to export.");
}

/**
 * Loads places for CSV export by re-running criteria for one geometry type.
 * @param criteria Active search filters from Places context.
 * @param effectiveType Single geometry type resolved from the modal selection.
 * @param exportByGeometry Search-service export requery.
 * @param signal Optional abort signal.
 */
export function preparePlacesForGeometryExport(
  criteria: PlaceSearchCriteria,
  effectiveType: PlaceGeometryType,
  exportByGeometry: ExportPlacesByGeometry,
  signal?: AbortSignal,
): Promise<Place[]> {
  return exportByGeometry(criteria, effectiveType, signal);
}
