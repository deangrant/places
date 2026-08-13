import { CATEGORY_DEFINITIONS } from "@/constants/categories.constants";
import type { CategoryDefinition, OsmTagPredicate } from "@/types/places.types";

/**
 * Looks up curated industry categories by id or lists them for filters.
 */
export interface ICategoryLookup {
  /**
   * Returns a category by id, or undefined when unknown.
   * @param id Taxonomy category id.
   */
  getById: (id: string) => CategoryDefinition | undefined;
  /**
   * Returns every category definition.
   */
  list: () => CategoryDefinition[];
}

/**
 * Matches OSM element tags to the best curated category.
 */
export interface ICategoryMatcher {
  /**
   * Finds the best matching category for a set of OSM tags.
   * @param tags OSM key/value tags on an element.
   */
  matchTags: (tags: Record<string, string>) => CategoryDefinition | undefined;
}

/**
 * Full taxonomy port combining lookup and tag matching.
 */
export interface ICategoryTaxonomy extends ICategoryLookup, ICategoryMatcher {}

/**
 * In-memory category taxonomy backed by bundled constants.
 */
export class CategoryTaxonomy implements ICategoryTaxonomy {
  private readonly byId = new Map(
    CATEGORY_DEFINITIONS.map((category) => [category.id, category]),
  );

  /** @inheritdoc */
  list(): CategoryDefinition[] {
    return CATEGORY_DEFINITIONS;
  }

  /** @inheritdoc */
  getById(id: string): CategoryDefinition | undefined {
    return this.byId.get(id);
  }

  /** @inheritdoc */
  matchTags(tags: Record<string, string>): CategoryDefinition | undefined {
    for (const category of CATEGORY_DEFINITIONS) {
      if (
        category.tags.some((predicate) => matchesPredicate(tags, predicate))
      ) {
        return category;
      }
    }
  }
}

/**
 * Returns true when the OSM tags include the given predicate.
 */
function matchesPredicate(
  tags: Record<string, string>,
  predicate: OsmTagPredicate,
): boolean {
  return tags[predicate.key] === predicate.value;
}
