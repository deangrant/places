import type { OverpassAttemptListener } from "@/services/overpass/overpass-http-client-service";
import type {
  Place,
  PlaceGeometryType,
  PlaceSearchCriteria,
} from "@/types/places.types";

/** Geometry types offered in the export modal, display order. */
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
 * @param onAttempt Optional Overpass endpoint progress callback.
 */
export type ExportPlacesByGeometry = (
  criteria: PlaceSearchCriteria,
  geometryType: PlaceGeometryType,
  signal?: AbortSignal,
  onAttempt?: OverpassAttemptListener,
) => Promise<Place[]>;

/**
 * Loads places for CSV export by re-running criteria for one geometry type.
 * @param criteria Active search filters from Places context.
 * @param geometryType Single geometry type selected in the modal.
 * @param exportByGeometry Search-service export requery.
 * @param signal Optional abort signal.
 * @param onAttempt Optional Overpass endpoint progress callback.
 */
export function preparePlacesForGeometryExport(
  criteria: PlaceSearchCriteria,
  geometryType: PlaceGeometryType,
  exportByGeometry: ExportPlacesByGeometry,
  signal?: AbortSignal,
  onAttempt?: OverpassAttemptListener,
): Promise<Place[]> {
  return exportByGeometry(criteria, geometryType, signal, onAttempt);
}
