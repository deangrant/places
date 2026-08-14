import type {
  IPlaceGeometryExporter,
  IPlaceSearchService,
} from "@/services/places/place-search-service";
import type { IBrandCatalog } from "@/services/taxonomy/brand-catalog";
import type { ICategoryTaxonomy } from "@/services/taxonomy/category-taxonomy";

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
  /** Industry taxonomy lookup and OSM tag matching. */
  taxonomy: ICategoryTaxonomy;
}
