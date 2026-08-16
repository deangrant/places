import { CategoryTaxonomy, type ICategoryLookup } from "places-core/taxonomy";
import {
  HttpPlacesApiClient,
  type IPlaceGeometryExporter,
  type IPlaceSearchService,
  resolveApiBaseUrl,
} from "@/services/http/http-places-api-client";

/**
 * Application service ports wired by the composition root.
 * UI and contexts depend on this contract, not concrete adapters.
 */
export interface AppServices {
  /** Geometry export re-query for CSV downloads. */
  placeExport: IPlaceGeometryExporter;
  /** Places map search. */
  placeSearch: IPlaceSearchService;
  /** Industry taxonomy lookup for filters. */
  taxonomy: ICategoryLookup;
}

/**
 * Builds a fresh Places app service graph for injection.
 * Call once at the React boundary; use again in tests for isolation.
 */
export function createServices(): AppServices {
  const api = new HttpPlacesApiClient(resolveApiBaseUrl());
  return {
    placeExport: api,
    placeSearch: api,
    taxonomy: new CategoryTaxonomy(),
  };
}
