import type { OverpassAttemptListener } from "places-core/overpass-attempt";
import type {
  OsmElement,
  Place,
  PlaceGeometryType,
  PlaceSearchCriteria,
} from "places-core/places";
import type {
  ICenterPlaceNormalizer,
  IGeometryPlaceNormalizer,
  PlaceNormalizeContext,
} from "./osm-place-normalizer-service.js";
import type { PlaceOverpassPipeline } from "./place-overpass-pipeline-service.js";
import type { IRetailAreaGeometryResolver } from "./retail-area-geometry-service.js";
import type { IRetailAreaQueryBuilder } from "./retail-area-query-builder-service.js";

/**
 * Optional flags for geometry CSV export.
 */
export interface PlaceExportOptions {
  /**
   * When true for POLYGON / MULTIPOLYGON, replace each place WKT with the
   * enclosing retail-area polygon when one exists.
   */
  includeRetailArea?: boolean;
}

/**
 * Re-queries Places for CSV export with a chosen geometry type.
 */
export interface IPlaceGeometryExporter {
  /**
   * Re-runs the current criteria for CSV export with the chosen geometry type.
   * POINT uses `out center`; POLYGON/MULTIPOLYGON use `out geom` and keep
   * only matching footprints. Does not mutate session state.
   * @param criteria Active search filters.
   * @param geometryType Effective export geometry type.
   * @param signal Optional abort signal.
   * @param onAttempt Optional Overpass endpoint progress callback.
   * @param options Optional export flags such as retail-area replacement.
   */
  exportByGeometry: (
    criteria: PlaceSearchCriteria,
    geometryType: PlaceGeometryType,
    signal?: AbortSignal,
    onAttempt?: OverpassAttemptListener,
    options?: PlaceExportOptions,
  ) => Promise<Place[]>;
}

/**
 * Strategy for one export geometry type: Overpass print mode, normalize, filter.
 */
interface GeometryExportStrategy {
  /** Keeps places that match the requested export type. */
  filter: (places: Place[]) => Place[];
  /** Maps Overpass elements into Place DTOs for this print mode. */
  normalize: (
    elements: OsmElement[],
    context: PlaceNormalizeContext,
  ) => Place[];
  /** Overpass `out` mode for this geometry type. */
  outputMode: "center" | "geom";
}

/**
 * Geometry-export orchestrator backed by the shared Overpass pipeline.
 */
export class PlaceGeometryExportService implements IPlaceGeometryExporter {
  private readonly pipeline: PlaceOverpassPipeline;
  private readonly retailAreaGeometry: IRetailAreaGeometryResolver;
  private readonly retailAreaQueryBuilder: IRetailAreaQueryBuilder;
  private readonly strategies: Record<
    PlaceGeometryType,
    GeometryExportStrategy
  >;

  /**
   * @param pipeline Shared validate/resolve/query pipeline.
   * @param centerNormalizer Center-point place mapper.
   * @param geometryNormalizer Full-footprint place mapper.
   * @param retailAreaQueryBuilder Retail-area Overpass QL builder.
   * @param retailAreaGeometry Retail containment matcher.
   */
  constructor(
    pipeline: PlaceOverpassPipeline,
    centerNormalizer: ICenterPlaceNormalizer,
    geometryNormalizer: IGeometryPlaceNormalizer,
    retailAreaQueryBuilder: IRetailAreaQueryBuilder,
    retailAreaGeometry: IRetailAreaGeometryResolver,
  ) {
    this.pipeline = pipeline;
    this.retailAreaQueryBuilder = retailAreaQueryBuilder;
    this.retailAreaGeometry = retailAreaGeometry;
    this.strategies = {
      MULTIPOLYGON: {
        filter: (places) =>
          places.filter((place) => place.geometryType === "MULTIPOLYGON"),
        normalize: (elements, context) =>
          geometryNormalizer.normalizeWithGeometry(elements, context),
        outputMode: "geom",
      },
      POINT: {
        filter: (places) => places,
        normalize: (elements, context) =>
          centerNormalizer.normalize(elements, context),
        outputMode: "center",
      },
      POLYGON: {
        filter: (places) =>
          places.filter((place) => place.geometryType === "POLYGON"),
        normalize: (elements, context) =>
          geometryNormalizer.normalizeWithGeometry(elements, context),
        outputMode: "geom",
      },
    };
  }

  /**
   * Re-queries Overpass for places matching one export geometry type.
   */
  async exportByGeometry(
    criteria: PlaceSearchCriteria,
    geometryType: PlaceGeometryType,
    signal?: AbortSignal,
    onAttempt?: OverpassAttemptListener,
    options?: PlaceExportOptions,
  ): Promise<Place[]> {
    const strategy = this.strategies[geometryType];
    const { elements, scope } = await this.pipeline.fetchElements(
      criteria,
      strategy.outputMode,
      signal,
      onAttempt,
    );
    const context: PlaceNormalizeContext = {
      city: criteria.city,
      isoCountryCode: criteria.countryCode,
      region: criteria.region,
    };
    let places = strategy.filter(strategy.normalize(elements, context));

    const includeRetailArea = options?.includeRetailArea === true;
    if (
      includeRetailArea &&
      (geometryType === "POLYGON" || geometryType === "MULTIPOLYGON")
    ) {
      const retailQuery = this.retailAreaQueryBuilder.build(scope);
      const retailElements = await this.pipeline.runQuery(
        retailQuery,
        signal,
        onAttempt,
      );
      places = this.retailAreaGeometry.applyEnclosingRetailAreas(
        places,
        retailElements,
      );
    }

    return places;
  }
}
