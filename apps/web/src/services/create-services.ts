import type { AppServices } from "@/services/app-services.types";
import { NominatimAreaResolver } from "@/services/geocoding/nominatim-area-resolver";
import { OverpassHttpClient } from "@/services/overpass/overpass-http-client";
import { OsmPlaceNormalizer } from "@/services/places/osm-place-normalizer";
import { PlaceQueryBuilder } from "@/services/places/place-query-builder";
import { PlaceSearchService } from "@/services/places/place-search-service";
import { BrandCatalog } from "@/services/taxonomy/brand-catalog";
import { CategoryTaxonomy } from "@/services/taxonomy/category-taxonomy";

const taxonomy = new CategoryTaxonomy();
const brandCatalog = new BrandCatalog();
const overpass = new OverpassHttpClient();
const areaResolver = new NominatimAreaResolver();
const queryBuilder = new PlaceQueryBuilder(taxonomy);
const normalizer = new OsmPlaceNormalizer(taxonomy);
const placeSearch = new PlaceSearchService(
  overpass,
  queryBuilder,
  normalizer,
  areaResolver,
);

/**
 * Composition-root service graph for the Places web app.
 * Constructed once; inject via ServicesProvider at the React boundary.
 */
export const services: AppServices = {
  brandCatalog,
  placeSearch,
  taxonomy,
};
