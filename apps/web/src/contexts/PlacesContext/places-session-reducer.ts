import type { OverpassAttemptEvent } from "@/services/overpass/overpass-http-client";
import { mergeOverpassAttempt } from "@/services/overpass/overpass-http-client";
import type { PlaceGeometryUpdate } from "@/services/places/place-search-service";
import type { BBox, Place } from "@/types/places.types";

/**
 * Search/session slice for PlacesProvider (selection, results, loading, errors).
 */
export interface PlacesSessionState {
  /** Bounding box the map should fit, or null when idle. */
  boundsToFit: BBox | null;
  /** Last search or geometry-hydration error message, or null when none. */
  error: string | null;
  /** True while selected-place footprint geometry is loading. */
  geometryLoading: boolean;
  /** True while a Places search is in flight. */
  loading: boolean;
  /** Live Overpass interpreter attempts for the in-flight search. */
  overpassAttempts: OverpassAttemptEvent[];
  /** Places from the latest successful search. */
  places: Place[];
  /** Selected place id, or null when none. */
  selectedPlaceId: string | null;
  /** True when the Overpass response hit the configured result limit. */
  truncated: boolean;
}

/** Initial idle session state before any search. */
export const initialPlacesSessionState: PlacesSessionState = {
  boundsToFit: null,
  error: null,
  geometryLoading: false,
  loading: false,
  overpassAttempts: [],
  places: [],
  selectedPlaceId: null,
  truncated: false,
};

/**
 * Actions that transition search/session state together.
 */
export type PlacesSessionAction =
  | { type: "bounds/clear" }
  | { type: "bounds/set"; bounds: BBox | null }
  | { type: "geometry/failed"; message: string }
  | { type: "geometry/settled" }
  | { type: "geometry/succeeded"; placeId: string; update: PlaceGeometryUpdate }
  | { type: "search/attempt"; attempt: OverpassAttemptEvent }
  | { type: "search/failed"; message: string }
  | { type: "search/finished" }
  | {
      type: "search/succeeded";
      places: Place[];
      truncated: boolean;
      bounds: BBox | null;
    }
  | { type: "search/started" }
  | { type: "select/clear" }
  | {
      type: "select/place";
      placeId: string;
      bounds: BBox | null;
      hydrate: boolean;
    };

/**
 * Reduces Places search/session transitions into the next state snapshot.
 * @param state Current session state.
 * @param action Transition to apply.
 */
export function placesSessionReducer(
  state: PlacesSessionState,
  action: PlacesSessionAction,
): PlacesSessionState {
  switch (action.type) {
    case "bounds/clear": {
      return { ...state, boundsToFit: null };
    }
    case "bounds/set": {
      return { ...state, boundsToFit: action.bounds };
    }
    case "geometry/failed": {
      return { ...state, error: action.message };
    }
    case "geometry/settled": {
      return { ...state, geometryLoading: false };
    }
    case "geometry/succeeded": {
      return {
        ...state,
        places: state.places.map((entry) =>
          entry.id === action.placeId
            ? {
                ...entry,
                geometry: action.update.geometry,
                geometryType: action.update.geometryType,
                geometryWkt: action.update.geometryWkt,
                latitude: action.update.latitude,
                longitude: action.update.longitude,
              }
            : entry,
        ),
      };
    }
    case "search/attempt": {
      return {
        ...state,
        overpassAttempts: mergeOverpassAttempt(
          state.overpassAttempts,
          action.attempt,
        ),
      };
    }
    case "search/failed": {
      return {
        ...state,
        boundsToFit: null,
        error: action.message,
        places: [],
        selectedPlaceId: null,
        truncated: false,
      };
    }
    case "search/finished": {
      return { ...state, loading: false, overpassAttempts: [] };
    }
    case "search/started": {
      return {
        ...state,
        boundsToFit: null,
        error: null,
        geometryLoading: false,
        loading: true,
        overpassAttempts: [],
        places: [],
        selectedPlaceId: null,
        truncated: false,
      };
    }
    case "search/succeeded": {
      return {
        ...state,
        boundsToFit: action.bounds,
        places: action.places,
        selectedPlaceId: null,
        truncated: action.truncated,
      };
    }
    case "select/clear": {
      return {
        ...state,
        geometryLoading: false,
        selectedPlaceId: null,
      };
    }
    case "select/place": {
      return {
        ...state,
        boundsToFit: action.bounds,
        error: action.hydrate ? null : state.error,
        geometryLoading: action.hydrate,
        selectedPlaceId: action.placeId,
      };
    }
    default: {
      return state;
    }
  }
}
