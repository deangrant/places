import {
  OVERPASS_TIMEOUT_SECONDS,
  RESULT_LIMIT,
} from "@/constants/api.constants";
import { isAllowedOsmTagKey } from "@/constants/osm-tags.constants";
import type { ICategoryLookup } from "@/services/taxonomy/category-taxonomy";
import type {
  Place,
  PlaceSearchCriteria,
  SpatialScope,
} from "@/types/places.types";

/**
 * Builds Overpass QL from Places search criteria.
 */
export interface IPlaceQueryBuilder {
  /**
   * Compiles criteria and a resolved spatial scope into Overpass QL.
   * @param criteria User-facing search filters.
   * @param scope Resolved area and/or bbox constraint.
   */
  build: (criteria: PlaceSearchCriteria, scope: SpatialScope) => string;
  /**
   * Compiles an Overpass QL script that fetches full geometry for one element.
   * @param osmType OSM element type (`way` or `relation`).
   * @param osmId OSM numeric id.
   */
  buildGeometryQuery: (osmType: Place["osmType"], osmId: number) => string;
}

/**
 * Default Place → Overpass QL compiler.
 */
export class PlaceQueryBuilder implements IPlaceQueryBuilder {
  private readonly taxonomy: ICategoryLookup;

  /**
   * @param taxonomy Category lookup used to expand industry filters.
   */
  constructor(taxonomy: ICategoryLookup) {
    this.taxonomy = taxonomy;
  }

  /** @inheritdoc */
  build(criteria: PlaceSearchCriteria, scope: SpatialScope): string {
    const spatial = this.formatSpatialFilter(scope);
    const filters = this.buildTagFilters(criteria);

    if (filters.length === 0) {
      // Name-only or geography-only searches still need a POI-ish predicate.
      filters.push('nwr["name"]');
    }

    const unionBody = filters
      .map((filter) => `  ${filter}${spatial};`)
      .join("\n");

    return [
      `[out:json][timeout:${OVERPASS_TIMEOUT_SECONDS}];`,
      this.formatAreaPreamble(scope),
      "(",
      unionBody,
      ");",
      `out center ${RESULT_LIMIT};`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  /** @inheritdoc */
  buildGeometryQuery(osmType: Place["osmType"], osmId: number): string {
    return [
      `[out:json][timeout:${OVERPASS_TIMEOUT_SECONDS}];`,
      `${osmType}(${osmId});`,
      "out geom;",
    ].join("\n");
  }

  /**
   * Emits an optional `area(...)` statement when an admin area is in scope.
   * @param scope Resolved spatial scope.
   */
  private formatAreaPreamble(scope: SpatialScope): string {
    if (scope.areaId == null) {
      return "";
    }
    // Nominatim OSM ids become Overpass area ids with the standard offset.
    return `area(${scope.areaId})->.searchArea;`;
  }

  /**
   * Returns the Overpass spatial suffix for each statement.
   * @param scope Resolved spatial scope.
   */
  private formatSpatialFilter(scope: SpatialScope): string {
    if (scope.areaId != null) {
      return "(area.searchArea)";
    }
    if (scope.bbox) {
      const { south, west, north, east } = scope.bbox;
      return `(${south},${west},${north},${east})`;
    }
    throw new Error("Spatial scope requires an area or bounding box.");
  }

  /**
   * Expands criteria into Overpass selector strings (without spatial suffix).
   * @param criteria User filters.
   */
  private buildTagFilters(criteria: PlaceSearchCriteria): string[] {
    const brandClause = this.formatBrandClause(criteria.brand);
    const nameClause = this.formatNameClause(criteria.nameContains);
    const osmTagClause = this.formatOsmTagClause(
      criteria.osmTagKey,
      criteria.osmTagValue,
    );
    const extras = [brandClause, nameClause].filter(Boolean).join("");

    if (criteria.categoryId) {
      const category = this.taxonomy.getById(criteria.categoryId);
      if (!category) {
        throw new Error(`Unknown category id: ${criteria.categoryId}`);
      }
      return category.tags.map(
        (tag) =>
          `nwr["${tag.key}"="${escapeOverpass(tag.value)}"]${osmTagClause}${extras}`,
      );
    }

    if (osmTagClause) {
      return [`nwr${osmTagClause}${extras}`];
    }

    if (brandClause || nameClause) {
      return [`nwr${extras}`];
    }

    return [];
  }

  /**
   * Formats an exact OSM key=value clause when both are present and allowed.
   * @param key Allowlisted OSM tag key.
   * @param value Exact tag value.
   */
  private formatOsmTagClause(key?: string, value?: string): string {
    const trimmedKey = key?.trim() ?? "";
    const trimmedValue = value?.trim() ?? "";
    if (!(trimmedKey && trimmedValue)) {
      return "";
    }
    if (!isAllowedOsmTagKey(trimmedKey)) {
      throw new Error(`Unsupported OSM tag key: ${trimmedKey}`);
    }
    return `["${trimmedKey}"="${escapeOverpass(trimmedValue)}"]`;
  }

  /**
   * Formats an optional case-insensitive brand regex filter.
   * @param brand Brand text from the user.
   */
  private formatBrandClause(brand?: string): string {
    const trimmed = brand?.trim();
    if (!trimmed) {
      return "";
    }
    const pattern = escapeRegex(trimmed);
    return `["brand"~"^${pattern}$",i]`;
  }

  /**
   * Formats an optional case-insensitive name substring filter.
   * @param nameContains Name fragment from the user.
   */
  private formatNameClause(nameContains?: string): string {
    const trimmed = nameContains?.trim();
    if (!trimmed) {
      return "";
    }
    const pattern = escapeRegex(trimmed);
    return `["name"~"${pattern}",i]`;
  }
}

/**
 * Escapes characters that are special inside Overpass string literals.
 * @param value Raw filter value.
 */
function escapeOverpass(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/**
 * Escapes characters that are special inside Overpass regular expressions.
 * @param value Raw filter value.
 */
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Converts a Nominatim OSM object id into an Overpass area id.
 * @param osmType Nominatim osm_type (`relation` or `way`).
 * @param osmId Nominatim osm_id.
 */
export function toOverpassAreaId(osmType: string, osmId: number): number {
  if (osmType === "relation" || osmType === "R") {
    return 3_600_000_000 + osmId;
  }
  if (osmType === "way" || osmType === "W") {
    return 2_400_000_000 + osmId;
  }
  throw new Error(
    "Only relation or way admin boundaries can be used as Overpass areas.",
  );
}
