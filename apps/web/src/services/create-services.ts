import type { AppServices } from "@/services/app-services.types";
import { NominatimAreaResolver } from "@/services/geocoding/nominatim-area-resolver-service";
import { OverpassHttpClient } from "@/services/overpass/overpass-http-client-service";
import { OsmPlaceNormalizer } from "@/services/places/osm-place-normalizer-service";
import { PlaceGeometryExportService } from "@/services/places/place-geometry-export-service";
import { PlaceOverpassPipeline } from "@/services/places/place-overpass-pipeline-service";
import { PlaceQueryBuilder } from "@/services/places/place-query-builder-service";
import { PlaceSearchService } from "@/services/places/place-search-service";
import { BrandCatalog } from "@/services/taxonomy/brand-catalog-service";
import { CategoryTaxonomy } from "@/services/taxonomy/category-taxonomy-service";

/**
 * Builds a fresh Places app service graph for injection.
 * Call once at the React boundary; use again in tests for isolation.
 */
export function createServices(): AppServices {
  const taxonomy = new CategoryTaxonomy();
  const brandCatalog = new BrandCatalog();
  const overpass = new OverpassHttpClient();
  const areaResolver = new NominatimAreaResolver();
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
    brandCatalog,
    placeExport,
    placeSearch,
    taxonomy,
  };
}
