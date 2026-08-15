export { BRAND_CATALOG } from "./constants/brands.constants.js";
export {
  CATEGORY_DEFINITIONS,
  COUNTRY_OPTIONS,
} from "./constants/categories.constants.js";
export {
  isAllowedOsmTagKey,
  OSM_TAG_KEY_ALLOWLIST,
  type OsmTagKey,
} from "./constants/osm-tags.constants.js";
export {
  NOMINATIM_ENDPOINT,
  OVERPASS_ATTEMPT_TIMEOUT_SECONDS,
  OVERPASS_CLIENT_TIMEOUT_SECONDS,
  OVERPASS_ENDPOINTS,
  OVERPASS_MAX_ENDPOINT_ATTEMPTS,
  OVERPASS_TIMEOUT_SECONDS,
  RESULT_LIMIT,
} from "./constants/overpass.constants.js";
export {
  BrandCatalog,
  type IBrandCatalog,
} from "./services/taxonomy/brand-catalog-service.js";
export {
  CategoryTaxonomy,
  formatCategoryLabel,
  type ICategoryLookup,
  type ICategoryMatcher,
  type ICategoryTaxonomy,
} from "./services/taxonomy/category-taxonomy-service.js";
export type {
  BBox,
  CategoryDefinition,
  GeocodeResult,
  LonLat,
  MapViewState,
  OsmElement,
  OsmLatLon,
  OsmRelationMember,
  OsmTagPredicate,
  OverpassResponse,
  Place,
  PlaceDrawableGeometry,
  PlaceGeometryType,
  PlaceSearchCriteria,
  PlaceSearchResult,
  SpatialScope,
} from "./types/places.types.js";

export type { NormalizedOsmGeometry } from "./utils/osm-geometry.js";
export {
  formatMultiPolygonWkt,
  formatPointWkt,
  formatPolygonWkt,
  normalizeOsmCenterPoint,
  normalizeOsmGeometry,
} from "./utils/osm-geometry.js";
