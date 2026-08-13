/**
 * Geographic bounding box in south, west, north, east order (Overpass style).
 */
export interface BBox {
  /** Eastern longitude bound. */
  east: number;
  /** Northern latitude bound. */
  north: number;
  /** Southern latitude bound. */
  south: number;
  /** Western longitude bound. */
  west: number;
}

/**
 * Map camera center and zoom used for display.
 */
export interface MapViewState {
  /** Map center latitude. */
  lat: number;
  /** Map center longitude. */
  lon: number;
  /** Zoom level (fractional values supported by Mapbox). */
  zoom: number;
}

/**
 * User-facing Places search criteria (never Overpass QL).
 */
export interface PlaceSearchCriteria {
  /** Brand name filter (exact catalog pick or free text). */
  brand?: string;
  /** Taxonomy category id, when filtering by industry. */
  categoryId?: string;
  /** City or locality name. */
  city?: string;
  /** ISO 3166-1 alpha-2 country code. */
  countryCode?: string;
  /** Optional substring match against place name. */
  nameContains?: string;
  /** Allowlisted OSM tag key for Advanced filter (requires osmTagValue). */
  osmTagKey?: string;
  /** OSM tag value for Advanced filter (requires osmTagKey). */
  osmTagValue?: string;
  /** State, province, or equivalent region name. */
  region?: string;
}

/**
 * SafeGraph-inspired place record normalized from OSM tags.
 */
export interface Place {
  /** Brand names associated with the place. */
  brands: string[];
  /** City from address tags or search context. */
  city: string | null;
  /**
   * Drawable geometry rings for the map (outer/inner lon-lat positions).
   * Empty for pure point geometries beyond the centroid.
   */
  geometry: PlaceDrawableGeometry;
  /** WKT geometry class for export. */
  geometryType: PlaceGeometryType;
  /** Well-Known Text representation of the place geometry. */
  geometryWkt: string;
  /** Stable id within this session (`type/id`). */
  id: string;
  /** ISO country code when available. */
  isoCountryCode: string | null;
  /** Latitude of the place centroid. */
  latitude: number;
  /** Display name of the place. */
  locationName: string | null;
  /** Longitude of the place centroid. */
  longitude: number;
  /** Opening hours string from OSM. */
  openHours: string | null;
  /** OSM numeric id. */
  osmId: number;
  /** OSM element type. */
  osmType: "node" | "way" | "relation";
  /** Phone number. */
  phoneNumber: string | null;
  /** Postal code when available. */
  postalCode: string | null;
  /** Region / state from address tags or search context. */
  region: string | null;
  /** Street address line when available. */
  streetAddress: string | null;
  /** Finer industry label from the taxonomy. */
  subCategory: string | null;
  /** Raw OSM tags for detail views. */
  tags: Record<string, string>;
  /** High-level industry label from the taxonomy. */
  topCategory: string | null;
  /** Public website URL. */
  website: string | null;
}

/** Supported export / display geometry kinds. */
export type PlaceGeometryType = "POINT" | "POLYGON" | "MULTIPOLYGON";

/**
 * Lon/lat position used in drawable rings (GeoJSON-like axis order).
 */
export interface LonLat {
  /** Latitude in decimal degrees. */
  lat: number;
  /** Longitude in decimal degrees. */
  lon: number;
}

/**
 * Map-drawable footprint: list of polygons, each a list of rings
 * (first ring exterior, following rings holes).
 */
export interface PlaceDrawableGeometry {
  /** Empty when the place is only a point. */
  polygons: LonLat[][][];
}

/**
 * OSM element shape returned by Overpass JSON output (including `out geom`).
 */
export interface OsmElement {
  /** Center point from `out center` when full geometry is omitted. */
  center?: { lat: number; lon: number };
  /** Way node positions when printed with `out geom`. */
  geometry?: OsmLatLon[];
  /** OSM numeric element id. */
  id: number;
  /** Node latitude when `type` is `node`. */
  lat?: number;
  /** Node longitude when `type` is `node`. */
  lon?: number;
  /** Relation members when printed with `out geom`. */
  members?: OsmRelationMember[];
  /** OSM key/value tags on the element. */
  tags?: Record<string, string>;
  /** OSM element kind. */
  type: "node" | "way" | "relation";
}

/**
 * Lat/lon pair as returned by Overpass geometry arrays.
 */
export interface OsmLatLon {
  /** Latitude in decimal degrees. */
  lat: number;
  /** Longitude in decimal degrees. */
  lon: number;
}

/**
 * Relation member with optional inline geometry from `out geom`.
 */
export interface OsmRelationMember {
  /** Member way geometry when printed with `out geom`. */
  geometry?: OsmLatLon[];
  /** Optional latitude for node members. */
  lat?: number;
  /** Optional longitude for node members. */
  lon?: number;
  /** Referenced OSM element id. */
  ref: number;
  /** Relation role (`outer`, `inner`, or empty). */
  role: string;
  /** Referenced OSM element kind. */
  type: "node" | "way" | "relation";
}

/**
 * Overpass JSON interpreter response body.
 */
export interface OverpassResponse {
  /** Matching OSM elements for the query. */
  elements: OsmElement[];
  /** Optional interpreter remark (e.g. timeout). */
  remark?: string;
}

/**
 * Nominatim search hit used for place jump and admin area resolution.
 */
export interface GeocodeResult {
  /** Bounding box of the geocode hit. */
  boundingBox: BBox;
  /** Nominatim place class (e.g. boundary). */
  class: string;
  /** ISO country code when Nominatim provides addressdetails. */
  countryCode?: string;
  /** Human-readable display name from Nominatim. */
  displayName: string;
  /** Latitude of the hit centroid. */
  lat: number;
  /** Longitude of the hit centroid. */
  lon: number;
  /** Nominatim OSM object id. */
  osmId: number;
  /** Nominatim OSM object type (`node`, `way`, `relation`). */
  osmType: string;
  /** Nominatim place type string. */
  type: string;
}

/**
 * Resolved spatial scope for an Overpass query.
 */
export interface SpatialScope {
  /** Overpass area id when using an admin boundary. */
  areaId?: number;
  /** Bounding box constraint. */
  bbox?: BBox;
  /** Human-readable label for the status bar. */
  label: string;
}

/**
 * Outcome of a Places search run.
 */
export interface PlaceSearchResult {
  /** Wall-clock duration in milliseconds. */
  durationMs: number;
  /** Normalized places from the Overpass response. */
  places: Place[];
  /** Scope used for the query. */
  scope: SpatialScope;
  /** True when the result count hit the configured Overpass limit. */
  truncated: boolean;
}

/**
 * Single OSM tag predicate used by the category taxonomy.
 */
export interface OsmTagPredicate {
  /** OSM tag key to match. */
  key: string;
  /** Exact OSM tag value to match. */
  value: string;
}

/**
 * Curated industry category mapped to OSM tags.
 */
export interface CategoryDefinition {
  /** Stable taxonomy id used in search criteria. */
  id: string;
  /** Finer industry label within the top category. */
  subCategory: string;
  /** OSM tag predicates that identify this category. */
  tags: OsmTagPredicate[];
  /** High-level industry grouping label. */
  topCategory: string;
}
