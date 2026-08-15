import { BRAND_CATALOG } from "../../constants/brands.constants.js";

/**
 * Read-only brand catalog used for autocomplete suggestions.
 */
export interface IBrandCatalog {
  /**
   * Returns brand names matching a case-insensitive prefix/substring query.
   * @param query User input; empty returns a short default slice.
   * @param limit Maximum suggestions to return.
   */
  search: (query: string, limit?: number) => string[];
}

/**
 * Brand catalog backed by the bundled popular-chains list.
 */
export class BrandCatalog implements IBrandCatalog {
  /**
   * Returns brand names matching a case-insensitive prefix/substring query.
   * Empty query returns a short default slice of the catalog.
   */
  search(query: string, limit = 12): string[] {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return BRAND_CATALOG.slice(0, limit);
    }
    return BRAND_CATALOG.filter((brand) =>
      brand.toLowerCase().includes(trimmed),
    ).slice(0, limit);
  }
}
