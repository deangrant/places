import type { IGeocoder } from "@/services/geocoding/nominatim-geocoder";
import type { IPlaceSearchService } from "@/services/places/place-search-service";
import type { IBrandCatalog } from "@/services/taxonomy/brand-catalog";
import type { ICategoryTaxonomy } from "@/services/taxonomy/category-taxonomy";

/**
 * Application service ports wired by the composition root.
 * UI and contexts depend on this contract, not concrete adapters.
 */
export interface AppServices {
  /** Brand autocomplete catalog. */
  brandCatalog: IBrandCatalog;
  /** Forward geocoder (and admin resolver when needed). */
  geocoder: IGeocoder;
  /** Places search and geometry hydration. */
  placeSearch: IPlaceSearchService;
  /** Industry taxonomy lookup and OSM tag matching. */
  taxonomy: ICategoryTaxonomy;
}
