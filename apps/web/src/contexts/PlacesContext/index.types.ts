import type { ReactNode } from "react";
import type { OverpassAttemptEvent } from "@/services/overpass/overpass-http-client-service";
import type {
  BBox,
  MapViewState,
  Place,
  PlaceSearchCriteria,
} from "@/types/places.types";

/**
 * Props for the Places explorer context provider.
 */
export interface PlacesProviderProps {
  /** Tree that may call `usePlaces`. */
  children: ReactNode;
}

/**
 * Public Places explorer state and actions exposed via `usePlaces`.
 */
export interface PlacesContextValue {
  /** Bounding box the map should fit, or null when idle. */
  boundsToFit: BBox | null;
  /** Aborts the in-flight search and clears the loading overlay. */
  cancelSearch: () => void;
  /** Clears a pending map fit request. */
  clearBoundsToFit: () => void;
  /** Active search filter criteria. */
  criteria: PlaceSearchCriteria;
  /** Last search error message, or null when none. */
  error: string | null;
  /** Fits the map to the current result set centroids. */
  fitResultsBounds: () => void;
  /** True while a Places search is in flight. */
  loading: boolean;
  /** Current map camera state. */
  mapView: MapViewState;
  /** Live Overpass interpreter attempts for the in-flight search. */
  overpassAttempts: OverpassAttemptEvent[];
  /** Places from the latest successful search. */
  places: Place[];
  /** Runs a search with the current criteria. */
  runSearch: () => Promise<void>;
  /** Selected place record, or null when browsing the list. */
  selectedPlace: Place | null;
  /** Selected place id, or null when none. */
  selectedPlaceId: string | null;
  /** Selects a place by id, or clears selection with null. */
  selectPlace: (placeId: string | null) => void;
  /** Patches or replaces search criteria. */
  setCriteria: (
    patch:
      | Partial<PlaceSearchCriteria>
      | ((prev: PlaceSearchCriteria) => PlaceSearchCriteria),
  ) => void;
  /** Updates the map camera from MapView interactions. */
  setMapView: (view: MapViewState) => void;
  /** True when the Overpass response hit the configured result limit. */
  truncated: boolean;
}

/** Criteria and search-session slice for filters and loaders. */
export type PlacesSearchContextValue = Pick<
  PlacesContextValue,
  | "cancelSearch"
  | "criteria"
  | "error"
  | "loading"
  | "overpassAttempts"
  | "places"
  | "runSearch"
  | "setCriteria"
  | "truncated"
>;

/** Map camera and fit-bounds slice. */
export type PlacesMapContextValue = Pick<
  PlacesContextValue,
  | "boundsToFit"
  | "clearBoundsToFit"
  | "fitResultsBounds"
  | "mapView"
  | "setMapView"
>;

/** Place selection slice for results list and detail. */
export type PlacesSelectionContextValue = Pick<
  PlacesContextValue,
  "places" | "selectedPlace" | "selectedPlaceId" | "selectPlace" | "truncated"
>;
