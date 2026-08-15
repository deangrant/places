import type {
  OsmElement,
  OverpassResponse,
  PlaceSearchCriteria,
  SpatialScope,
} from "places-core";
import { isAllowedOsmTagKey } from "places-core";
import type { IAreaResolver } from "../geocoding/nominatim-area-resolver-service.js";
import type {
  IOverpassClient,
  OverpassAttemptListener,
} from "../overpass/overpass-http-client-service.js";
import { describeOverpassRemark } from "../overpass/overpass-http-client-service.js";
import type { IPlaceQueryBuilder } from "./place-query-builder-service.js";
import { toOverpassAreaId } from "./place-query-builder-service.js";

/** Overpass print mode for place queries. */
export type PlaceOverpassOutputMode = "center" | "geom";

/**
 * Shared validate → resolve → build → query → remark pipeline for Overpass place fetches.
 */
export class PlaceOverpassPipeline {
  private readonly overpass: IOverpassClient;
  private readonly queryBuilder: IPlaceQueryBuilder;
  private readonly areaResolver: IAreaResolver;

  /**
   * @param overpass Overpass HTTP client.
   * @param queryBuilder Criteria → QL compiler.
   * @param areaResolver Admin geography resolver.
   */
  constructor(
    overpass: IOverpassClient,
    queryBuilder: IPlaceQueryBuilder,
    areaResolver: IAreaResolver,
  ) {
    this.overpass = overpass;
    this.queryBuilder = queryBuilder;
    this.areaResolver = areaResolver;
  }

  /**
   * Ensures the user provided at least one meaningful filter and a geography.
   * @param criteria User filters.
   */
  assertHasFilters(criteria: PlaceSearchCriteria): void {
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
  async resolveScope(
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

  /**
   * Validates filters, resolves scope, runs Overpass, and rejects on remarks.
   * @param criteria User filters.
   * @param outputMode Overpass print mode.
   * @param signal Optional abort signal.
   * @param onAttempt Optional Overpass endpoint progress callback.
   */
  async fetchElements(
    criteria: PlaceSearchCriteria,
    outputMode: PlaceOverpassOutputMode,
    signal?: AbortSignal,
    onAttempt?: OverpassAttemptListener,
  ): Promise<{ elements: OsmElement[]; scope: SpatialScope }> {
    this.assertHasFilters(criteria);
    const scope = await this.resolveScope(criteria, signal);
    const query = this.queryBuilder.build(criteria, scope, outputMode);
    const response: OverpassResponse = await this.overpass.query(
      query,
      signal,
      onAttempt,
    );

    const remark = describeOverpassRemark(response.remark);
    if (remark) {
      throw new Error(remark);
    }

    return { elements: response.elements, scope };
  }
}
