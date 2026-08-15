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
  /**
   * Returns leaf categories for a top category, sorted by subCategory.
   * @param topCategory High-level category label from the taxonomy.
   */
  listByTopCategory: (topCategory: string) => CategoryDefinition[];
  /**
   * Returns unique top-category labels sorted A–Z for the Category filter.
   */
  listTopCategories: () => string[];
}

/**
 * Matches OSM element tags to a curated category (first match in definition order).
 */
export interface ICategoryMatcher {
  /**
   * Returns the first category in taxonomy definition order whose tags match.
   * Multi-tagged elements are not ranked; earlier definitions win.
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

  /** Returns every category definition. */
  list(): CategoryDefinition[] {
    return CATEGORY_DEFINITIONS;
  }

  /** Returns a category by id, or undefined when unknown. */
  getById(id: string): CategoryDefinition | undefined {
    return this.byId.get(id);
  }

  /** Returns unique top-category labels sorted A–Z for the Category filter. */
  listTopCategories(): string[] {
    return [
      ...new Set(CATEGORY_DEFINITIONS.map((category) => category.topCategory)),
    ].sort((a, b) => a.localeCompare(b));
  }

  /** Returns leaf categories for a top category, sorted by subCategory. */
  listByTopCategory(topCategory: string): CategoryDefinition[] {
    return CATEGORY_DEFINITIONS.filter(
      (category) => category.topCategory === topCategory,
    ).sort((a, b) => a.subCategory.localeCompare(b.subCategory));
  }

  /**
   * Returns the first category in taxonomy definition order whose tags match.
   * Multi-tagged elements are not ranked; earlier definitions win.
   */
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
 * Builds a stable display label for uniqueness checks and diagnostics.
 * @param category Taxonomy category definition.
 */
export function formatCategoryLabel(category: CategoryDefinition): string {
  return `${category.topCategory} · ${category.subCategory}`;
}

/**
 * Returns true when the OSM tags include the given predicate.
 * @param tags OSM key/value tags on an element.
 * @param predicate Exact key=value predicate from a category definition.
 */
function matchesPredicate(
  tags: Record<string, string>,
  predicate: OsmTagPredicate,
): boolean {
  return tags[predicate.key] === predicate.value;
}
