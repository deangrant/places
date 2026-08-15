export { CATEGORY_DEFINITIONS } from "./constants/categories.constants.js";
export { COUNTRY_OPTIONS } from "./constants/countries.constants.js";
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
  OVERPASS_RETRY_BASE_MS,
  OVERPASS_RETRY_MAX_MS,
  OVERPASS_TIMEOUT_SECONDS,
  RESULT_LIMIT,
} from "./constants/overpass.constants.js";
export {
  CategoryTaxonomy,
  formatCategoryLabel,
  type ICategoryLookup,
  type ICategoryMatcher,
  type ICategoryTaxonomy,
} from "./services/taxonomy/category-taxonomy-service.js";
export type {
  OverpassAttemptEvent,
  OverpassAttemptListener,
  OverpassAttemptStatus,
} from "./types/overpass-attempt.types.js";
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
