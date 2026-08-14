import { RESULT_LIMIT } from "@/constants/api.constants";
import { isAllowedOsmTagKey } from "@/constants/osm-tags.constants";
import type { IAreaResolver } from "@/services/geocoding/nominatim-area-resolver";
import type {
  IOverpassClient,
  OverpassAttemptListener,
} from "@/services/overpass/overpass-http-client";
import { describeOverpassRemark } from "@/services/overpass/overpass-http-client";
import type { IOsmPlaceNormalizer } from "@/services/places/osm-place-normalizer";
import type { IPlaceQueryBuilder } from "@/services/places/place-query-builder";
import { toOverpassAreaId } from "@/services/places/place-query-builder";
import type {
  Place,
  PlaceDrawableGeometry,
  PlaceGeometryType,
  PlaceSearchCriteria,
  PlaceSearchResult,
  SpatialScope,
} from "@/types/places.types";
import { normalizeOsmGeometry } from "@/utils/osm-geometry";

/**
 * Full geometry fields hydrated after a center-only search hit.
 */
export interface PlaceGeometryUpdate {
  /** Drawable footprint rings for the map. */
  geometry: PlaceDrawableGeometry;
  /** WKT geometry class for the hydrated footprint. */
  geometryType: PlaceGeometryType;
  /** Well-Known Text for the hydrated footprint. */
  geometryWkt: string;
  /** Centroid latitude after hydration. */
  latitude: number;
  /** Centroid longitude after hydration. */
  longitude: number;
}

/**
 * Orchestrates geography resolution, Overpass execution, and normalization.
 */
export interface IPlaceSearchService {
  /**
   * Re-runs the current criteria for CSV export with the chosen geometry type.
   * POINT uses `out center`; POLYGON/MULTIPOLYGON use `out geom` and keep
   * only matching footprints. Does not mutate session state.
   * @param criteria Active search filters.
   * @param geometryType Effective export geometry type.
   * @param signal Optional abort signal.
   * @param onAttempt Optional Overpass endpoint progress callback.
   */
  exportByGeometry: (
    criteria: PlaceSearchCriteria,
    geometryType: PlaceGeometryType,
    signal?: AbortSignal,
    onAttempt?: OverpassAttemptListener,
  ) => Promise<Place[]>;
  /**
   * Fetches full `out geom` for a single OSM way or relation.
   * @param osmType OSM element type.
   * @param osmId OSM numeric id.
   * @param signal Optional abort signal.
   */
  fetchPlaceGeometry: (
    osmType: Place["osmType"],
    osmId: number,
    signal?: AbortSignal,
  ) => Promise<PlaceGeometryUpdate | null>;
  /**
   * Runs a Places search for the given criteria.
   * @param criteria User filters.
   * @param signal Optional abort signal.
   * @param onAttempt Optional Overpass endpoint progress callback.
   */
  search: (
    criteria: PlaceSearchCriteria,
    signal?: AbortSignal,
    onAttempt?: OverpassAttemptListener,
  ) => Promise<PlaceSearchResult>;
}

/**
 * Default Places search orchestrator.
 */
export class PlaceSearchService implements IPlaceSearchService {
  private readonly overpass: IOverpassClient;
  private readonly queryBuilder: IPlaceQueryBuilder;
  private readonly normalizer: IOsmPlaceNormalizer;
  private readonly areaResolver: IAreaResolver;

  /**
   * @param overpass Overpass HTTP client.
   * @param queryBuilder Criteria → QL compiler.
   * @param normalizer OSM → Place mapper.
   * @param areaResolver Admin geography resolver.
   */
  constructor(
    overpass: IOverpassClient,
    queryBuilder: IPlaceQueryBuilder,
    normalizer: IOsmPlaceNormalizer,
    areaResolver: IAreaResolver,
  ) {
    this.overpass = overpass;
    this.queryBuilder = queryBuilder;
    this.normalizer = normalizer;
    this.areaResolver = areaResolver;
  }

  /** @inheritdoc */
  async search(
    criteria: PlaceSearchCriteria,
    signal?: AbortSignal,
    onAttempt?: OverpassAttemptListener,
  ): Promise<PlaceSearchResult> {
    this.assertHasFilters(criteria);

    const scope = await this.resolveScope(criteria, signal);
    const query = this.queryBuilder.build(criteria, scope, "center");
    const response = await this.overpass.query(query, signal, onAttempt);

    const remark = describeOverpassRemark(response.remark);
    if (remark) {
      throw new Error(remark);
    }

    const places = this.normalizer.normalize(response.elements, {
      city: criteria.city,
      isoCountryCode: criteria.countryCode,
      region: criteria.region,
    });

    return {
      places,
      scope,
      truncated: response.elements.length >= RESULT_LIMIT,
    };
  }

  /** @inheritdoc */
  async exportByGeometry(
    criteria: PlaceSearchCriteria,
    geometryType: PlaceGeometryType,
    signal?: AbortSignal,
    onAttempt?: OverpassAttemptListener,
  ): Promise<Place[]> {
    this.assertHasFilters(criteria);

    const scope = await this.resolveScope(criteria, signal);
    const outputMode = geometryType === "POINT" ? "center" : "geom";
    const query = this.queryBuilder.build(criteria, scope, outputMode);
    const response = await this.overpass.query(query, signal, onAttempt);

    const remark = describeOverpassRemark(response.remark);
    if (remark) {
      throw new Error(remark);
    }

    const context = {
      city: criteria.city,
      isoCountryCode: criteria.countryCode,
      region: criteria.region,
    };

    if (geometryType === "POINT") {
      return this.normalizer.normalize(response.elements, context);
    }

    const places = this.normalizer.normalizeWithGeometry(
      response.elements,
      context,
    );
    return places.filter((place) => place.geometryType === geometryType);
  }

  /** @inheritdoc */
  async fetchPlaceGeometry(
    osmType: Place["osmType"],
    osmId: number,
    signal?: AbortSignal,
  ): Promise<PlaceGeometryUpdate | null> {
    if (osmType === "node") {
      return null;
    }

    const query = this.queryBuilder.buildGeometryQuery(osmType, osmId);

    const response = await this.overpass.query(query, signal);
    const remark = describeOverpassRemark(response.remark);
    if (remark) {
      throw new Error(remark);
    }

    const [element] = response.elements;
    if (!element) {
      return null;
    }

    const geometry = normalizeOsmGeometry(element);
    if (!geometry) {
      return null;
    }

    return {
      geometry: geometry.geometry,
      geometryType: geometry.geometryType,
      geometryWkt: geometry.geometryWkt,
      latitude: geometry.centroid.lat,
      longitude: geometry.centroid.lon,
    };
  }

  /**
   * Ensures the user provided at least one meaningful filter and a geography.
   * @param criteria User filters.
   */
  private assertHasFilters(criteria: PlaceSearchCriteria): void {
    const key = criteria.osmTagKey?.trim() ?? "";
    const value = criteria.osmTagValue?.trim() ?? "";
    const hasKey = Boolean(key);
    const hasValue = Boolean(value);
    if (hasKey !== hasValue) {
      throw new Error("Set both OSM tag key and value, or clear them.");
    }
    if (hasKey && !isAllowedOsmTagKey(key)) {
      throw new Error(`Unsupported OSM tag key: ${key}`);
    }
    const hasCompleteOsmTag = hasKey && hasValue;

    const hasWhat =
      Boolean(criteria.categoryId) ||
      Boolean(criteria.brand?.trim()) ||
      Boolean(criteria.nameContains?.trim()) ||
      hasCompleteOsmTag;
    if (!hasWhat) {
      throw new Error(
        "Choose a category, brand, place name, or OSM tag before searching.",
      );
    }

    const hasGeo =
      Boolean(criteria.countryCode) ||
      Boolean(criteria.region?.trim()) ||
      Boolean(criteria.city?.trim());
    if (!hasGeo) {
      throw new Error("Set a country, region, or city before searching.");
    }
  }

  /**
   * Resolves admin areas into a SpatialScope.
   * @param criteria User filters.
   * @param signal Abort signal.
   */
  private async resolveScope(
    criteria: PlaceSearchCriteria,
    signal?: AbortSignal,
  ): Promise<SpatialScope> {
    const admin = await this.areaResolver.resolveAdmin(
      {
        city: criteria.city,
        countryCode: criteria.countryCode,
        region: criteria.region,
      },
      signal,
    );
    if (!admin) {
      throw new Error(
        "Could not resolve that location. Try a different city, region, or country.",
      );
    }
    try {
      const areaId = toOverpassAreaId(admin.osmType, admin.osmId);
      return {
        areaId,
      };
    } catch {
      // Fall back to the Nominatim bounding box when area conversion fails.
      return {
        bbox: admin.boundingBox,
      };
    }
  }
}
