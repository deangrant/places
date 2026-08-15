import type { PlaceSearchCriteria, PlaceSearchResult } from "places-core";
import { RESULT_LIMIT } from "places-core";
import type { OverpassAttemptListener } from "../overpass/overpass-http-client-service.js";
import type { ICenterPlaceNormalizer } from "./osm-place-normalizer-service.js";
import type { PlaceOverpassPipeline } from "./place-overpass-pipeline-service.js";

/**
 * Runs Places map searches against Overpass for the given criteria.
 */
export interface IPlaceSearchService {
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
 * Default Places map-search orchestrator.
 */
export class PlaceSearchService implements IPlaceSearchService {
  private readonly pipeline: PlaceOverpassPipeline;
  private readonly normalizer: ICenterPlaceNormalizer;

  /**
   * @param pipeline Shared validate/resolve/query pipeline.
   * @param normalizer Center-point OSM → Place mapper.
   */
  constructor(
    pipeline: PlaceOverpassPipeline,
    normalizer: ICenterPlaceNormalizer,
  ) {
    this.pipeline = pipeline;
    this.normalizer = normalizer;
  }

  /**
   * Runs a Places search for the given criteria and returns normalized places.
   */
  async search(
    criteria: PlaceSearchCriteria,
    signal?: AbortSignal,
    onAttempt?: OverpassAttemptListener,
  ): Promise<PlaceSearchResult> {
    const { elements, scope } = await this.pipeline.fetchElements(
      criteria,
      "center",
      signal,
      onAttempt,
    );

    const places = this.normalizer.normalize(elements, {
      city: criteria.city,
      isoCountryCode: criteria.countryCode,
      region: criteria.region,
    });

    return {
      places,
      scope,
      truncated: elements.length >= RESULT_LIMIT,
    };
  }
}
