import type { IPlaceGeometryExporter } from "@/services/places/place-geometry-export-service";
import type { IPlaceSearchService } from "@/services/places/place-search-service";
import type { IBrandCatalog } from "@/services/taxonomy/brand-catalog-service";
import type { ICategoryLookup } from "@/services/taxonomy/category-taxonomy-service";

/**
 * Application service ports wired by the composition root.
 * UI and contexts depend on this contract, not concrete adapters.
 */
export interface AppServices {
  /** Brand autocomplete catalog. */
  brandCatalog: IBrandCatalog;
  /** Geometry export re-query for CSV downloads. */
  placeExport: IPlaceGeometryExporter;
  /** Places map search. */
  placeSearch: IPlaceSearchService;
  /** Industry taxonomy lookup for filters. */
  taxonomy: ICategoryLookup;
}
