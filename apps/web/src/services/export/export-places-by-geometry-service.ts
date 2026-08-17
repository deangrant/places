import type { PlaceExportOptions } from "@/services/http/http-places-api-client";
import type {
  OverpassAttemptListener,
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
 * Re-queries the Places API for places matching one export geometry type.
 * @param criteria Active search filters.
 * @param geometryType Effective export geometry type.
 * @param signal Optional abort signal.
 * @param onAttempt Optional Overpass progress callback.
 * @param options Optional export flags such as retail-area replacement.
 */
export type ExportPlacesByGeometry = (
  criteria: PlaceSearchCriteria,
  geometryType: PlaceGeometryType,
  signal?: AbortSignal,
  onAttempt?: OverpassAttemptListener,
  options?: PlaceExportOptions,
) => Promise<Place[]>;

/**
 * Loads places for CSV export by re-running criteria for one geometry type.
 * @param criteria Active search filters from Places context.
 * @param geometryType Single geometry type selected in the modal.
 * @param exportByGeometry Search-service export requery.
 * @param signal Optional abort signal.
 * @param onAttempt Optional Overpass progress callback.
 * @param options Optional export flags forwarded to the API.
 */
export function preparePlacesForGeometryExport(
  criteria: PlaceSearchCriteria,
  geometryType: PlaceGeometryType,
  exportByGeometry: ExportPlacesByGeometry,
  signal?: AbortSignal,
  onAttempt?: OverpassAttemptListener,
  options?: PlaceExportOptions,
): Promise<Place[]> {
  return exportByGeometry(criteria, geometryType, signal, onAttempt, options);
}
