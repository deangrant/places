import {
  NOMINATIM_ENDPOINT,
  OVERPASS_ATTEMPT_TIMEOUT_SECONDS,
  OVERPASS_ENDPOINTS,
} from "places-core/overpass";
import { CategoryTaxonomy } from "places-core/taxonomy";
import type { ApiConfig } from "./config.js";
import { NominatimAreaResolver } from "./services/geocoding/nominatim-area-resolver-service.js";
import { OverpassHttpClient } from "./services/overpass/overpass-http-client-service.js";
import { OsmPlaceNormalizer } from "./services/places/osm-place-normalizer-service.js";
import type { IPlaceGeometryExporter } from "./services/places/place-geometry-export-service.js";
import { PlaceGeometryExportService } from "./services/places/place-geometry-export-service.js";
import { PlaceOverpassPipeline } from "./services/places/place-overpass-pipeline-service.js";
import { PlaceQueryBuilder } from "./services/places/place-query-builder-service.js";
import type { IPlaceSearchService } from "./services/places/place-search-service.js";
import { PlaceSearchService } from "./services/places/place-search-service.js";

/**
 * Service graph exposed to HTTP route handlers.
 */
export interface ApiServices {
  /** Geometry export orchestrator. */
  placeExport: IPlaceGeometryExporter;
  /** Places search orchestrator. */
  placeSearch: IPlaceSearchService;
  /** Category taxonomy. */
  taxonomy: CategoryTaxonomy;
}

/**
 * Builds the Places API service graph from config.
 * @param config Loaded API configuration.
 */
export function createApiServices(config: ApiConfig): ApiServices {
  const taxonomy = new CategoryTaxonomy();
  const overpass = new OverpassHttpClient(
    config.overpassEndpoints ?? OVERPASS_ENDPOINTS,
    OVERPASS_ATTEMPT_TIMEOUT_SECONDS * 1000,
    undefined,
    undefined,
    config.nominatimUserAgent,
  );
  const areaResolver = new NominatimAreaResolver(
    {
      email: config.nominatimEmail,
      userAgent: config.nominatimUserAgent,
    },
    config.nominatimEndpoint ?? NOMINATIM_ENDPOINT,
  );
  const queryBuilder = new PlaceQueryBuilder(taxonomy);
  const normalizer = new OsmPlaceNormalizer(taxonomy);
  const pipeline = new PlaceOverpassPipeline(
    overpass,
    queryBuilder,
    areaResolver,
  );
  const placeSearch = new PlaceSearchService(pipeline, normalizer);
  const placeExport = new PlaceGeometryExportService(
    pipeline,
    normalizer,
    normalizer,
  );

  return {
    placeExport,
    placeSearch,
    taxonomy,
  };
}
