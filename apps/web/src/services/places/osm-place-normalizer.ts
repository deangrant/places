import type { ICategoryMatcher } from "@/services/taxonomy/category-taxonomy";
import type { OsmElement, Place } from "@/types/places.types";
import type { NormalizedOsmGeometry } from "@/utils/osm-geometry";
import {
  normalizeOsmCenterPoint,
  normalizeOsmGeometry,
} from "@/utils/osm-geometry";

/**
 * Maps raw OSM Overpass elements into Places DTOs.
 */
export interface IOsmPlaceNormalizer {
  /**
   * Normalizes a list of OSM elements into Places with coordinates.
   * Uses center-point geometry (`out center`).
   * @param elements Overpass elements.
   * @param context Optional search-context address fallbacks.
   */
  normalize: (
    elements: OsmElement[],
    context?: PlaceNormalizeContext,
  ) => Place[];
  /**
   * Normalizes Overpass elements using full footprints (`out geom`).
   * @param elements Overpass elements printed with geometry.
   * @param context Optional search-context address fallbacks.
   */
  normalizeWithGeometry: (
    elements: OsmElement[],
    context?: PlaceNormalizeContext,
  ) => Place[];
}

/**
 * Address fields inherited from the active search scope when OSM tags omit them.
 */
export interface PlaceNormalizeContext {
  /** City fallback when the element omits `addr:city`. */
  city?: string;
  /** ISO country code fallback when the element omits `addr:country`. */
  isoCountryCode?: string;
  /** Region fallback when the element omits state/province tags. */
  region?: string;
}

/**
 * Default OSM → Place normalizer.
 */
export class OsmPlaceNormalizer implements IOsmPlaceNormalizer {
  private readonly taxonomy: ICategoryMatcher;

  /**
   * @param taxonomy Used to assign top/sub category labels from tags.
   */
  constructor(taxonomy: ICategoryMatcher) {
    this.taxonomy = taxonomy;
  }

  /** @inheritdoc */
  normalize(
    elements: OsmElement[],
    context: PlaceNormalizeContext = {},
  ): Place[] {
    return this.normalizeAll(elements, context, normalizeOsmCenterPoint);
  }

  /** @inheritdoc */
  normalizeWithGeometry(
    elements: OsmElement[],
    context: PlaceNormalizeContext = {},
  ): Place[] {
    return this.normalizeAll(elements, context, normalizeOsmGeometry);
  }

  /**
   * Maps elements through a geometry normalizer into Place DTOs.
   * @param elements Overpass elements.
   * @param context Search-context fallbacks.
   * @param geometryOf Geometry extractor for the print mode.
   */
  private normalizeAll(
    elements: OsmElement[],
    context: PlaceNormalizeContext,
    geometryOf: (element: OsmElement) => NormalizedOsmGeometry | null,
  ): Place[] {
    const places: Place[] = [];
    for (const element of elements) {
      const place = this.normalizeOne(element, context, geometryOf);
      if (place) {
        places.push(place);
      }
    }
    return places;
  }

  /**
   * Converts a single OSM element when it has usable geometry.
   * @param element Overpass element.
   * @param context Search-context fallbacks.
   * @param geometryOf Geometry extractor for the print mode.
   */
  private normalizeOne(
    element: OsmElement,
    context: PlaceNormalizeContext,
    geometryOf: (element: OsmElement) => NormalizedOsmGeometry | null,
  ): Place | null {
    const geometry = geometryOf(element);
    if (!geometry) {
      return null;
    }

    const tags = element.tags ?? {};
    const category = this.taxonomy.matchTags(tags);
    const brands = splitList(readTag(tags, "brand") ?? undefined);

    return {
      brands,
      city: readTag(tags, "addr:city") ?? context.city ?? null,
      geometry: geometry.geometry,
      geometryType: geometry.geometryType,
      geometryWkt: geometry.geometryWkt,
      id: `${element.type}/${element.id}`,
      isoCountryCode: normalizeCountry(
        readTag(tags, "addr:country") ?? context.isoCountryCode,
      ),
      latitude: geometry.centroid.lat,
      locationName:
        readTag(tags, "name") ??
        readTag(tags, "name:en") ??
        brands.at(0) ??
        null,
      longitude: geometry.centroid.lon,
      openHours: readTag(tags, "opening_hours"),
      osmId: element.id,
      osmType: element.type,
      phoneNumber: readTag(tags, "phone") ?? readTag(tags, "contact:phone"),
      postalCode: readTag(tags, "addr:postcode"),
      region:
        readTag(tags, "addr:state") ??
        readTag(tags, "addr:province") ??
        readTag(tags, "addr:region") ??
        context.region ??
        null,
      streetAddress: formatStreetAddress(tags),
      subCategory:
        category === undefined ? inferSubCategory(tags) : category.subCategory,
      tags,
      topCategory:
        category === undefined ? inferTopCategory(tags) : category.topCategory,
      website: readTag(tags, "website") ?? readTag(tags, "contact:website"),
    };
  }
}

/**
 * Builds a street address line from OSM addr:* tags.
 * @param tags OSM tags.
 */
function formatStreetAddress(tags: Record<string, string>): string | null {
  const number = readTag(tags, "addr:housenumber");
  const street = readTag(tags, "addr:street");
  if (number && street) {
    return `${number} ${street}`;
  }
  return street ?? number ?? readTag(tags, "addr:full");
}

/**
 * Splits a semicolon-delimited OSM list tag into trimmed values.
 * @param value Raw tag value.
 */
function splitList(value?: string): string[] {
  if (!value) {
    return [];
  }
  return value
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * Normalizes country tags to uppercase ISO-like codes when short.
 * @param value Raw country tag or context code.
 */
function normalizeCountry(value?: string | null): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.length === 2) {
    return trimmed.toUpperCase();
  }
  return trimmed;
}

/**
 * Infers a coarse top category from primary OSM keys when taxonomy misses.
 * @param tags OSM tags.
 */
function inferTopCategory(tags: Record<string, string>): string | null {
  if (Object.hasOwn(tags, "amenity")) {
    return "Amenities";
  }
  if (Object.hasOwn(tags, "shop")) {
    return "Retail Trade";
  }
  if (Object.hasOwn(tags, "tourism")) {
    return "Tourism";
  }
  if (Object.hasOwn(tags, "leisure")) {
    return "Arts and Recreation";
  }
  if (Object.hasOwn(tags, "office")) {
    return "Professional Services";
  }
  if (Object.hasOwn(tags, "craft")) {
    return "Other Services";
  }
  if (Object.hasOwn(tags, "healthcare")) {
    return "Health Care";
  }
  return null;
}

/**
 * Infers a sub-category label from the primary OSM tag value.
 * @param tags OSM tags.
 */
function inferSubCategory(tags: Record<string, string>): string | null {
  const value = [
    "amenity",
    "shop",
    "tourism",
    "leisure",
    "office",
    "craft",
    "healthcare",
  ]
    .map((key) => readTag(tags, key))
    .find((candidate) => candidate !== null);
  if (!value) {
    return null;
  }
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/**
 * Reads an OSM tag when the key is present on the element.
 * @param tags OSM tags.
 * @param key Tag key.
 */
function readTag(tags: Record<string, string>, key: string): string | null {
  if (!Object.hasOwn(tags, key)) {
    return null;
  }
  return tags[key];
}
