import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { DEFAULT_MAP_VIEW } from "@/constants/api.constants";
import { useServices } from "@/contexts/ServicesContext";
import type {
  MapViewState,
  Place,
  PlaceSearchCriteria,
} from "@/types/places.types";
import { boundsFromPoints } from "@/utils/geo";
import type { PlacesContextValue, PlacesProviderProps } from "./index.types";
import {
  initialPlacesSessionState,
  placesSessionReducer,
} from "./places-session-reducer";

const PlacesContext = createContext<PlacesContextValue | null>(null);

const initialCriteria: PlaceSearchCriteria = {};

/** Provides Places explorer state and search orchestration. */
export function PlacesProvider({ children }: PlacesProviderProps) {
  const { placeSearch } = useServices();
  const [criteria, setCriteriaState] =
    useState<PlaceSearchCriteria>(initialCriteria);
  const [mapView, setMapView] = useState<MapViewState>(DEFAULT_MAP_VIEW);
  const [session, dispatch] = useReducer(
    placesSessionReducer,
    initialPlacesSessionState,
  );
  const abortRef = useRef<AbortController | null>(null);
  const geometryAbortRef = useRef<AbortController | null>(null);
  const geometryRequestIdRef = useRef(0);
  const searchRequestIdRef = useRef(0);
  const placesRef = useRef(session.places);
  const placeSearchRef = useRef(placeSearch);

  useEffect(() => {
    placesRef.current = session.places;
  }, [session.places]);

  useEffect(() => {
    placeSearchRef.current = placeSearch;
  }, [placeSearch]);

  useEffect(
    () => () => {
      abortRef.current?.abort();
      geometryAbortRef.current?.abort();
      searchRequestIdRef.current += 1;
      geometryRequestIdRef.current += 1;
    },
    [],
  );

  const setCriteria = useCallback(
    (
      patch:
        | Partial<PlaceSearchCriteria>
        | ((prev: PlaceSearchCriteria) => PlaceSearchCriteria),
    ) => {
      setCriteriaState((prev) =>
        typeof patch === "function" ? patch(prev) : { ...prev, ...patch },
      );
    },
    [],
  );

  const clearBoundsToFit = useCallback(() => {
    dispatch({ type: "bounds/clear" });
  }, []);

  const fitResultsBounds = useCallback(() => {
    const bounds = boundsFromPoints(
      placesRef.current.map((place) => ({
        lat: place.latitude,
        lon: place.longitude,
      })),
    );
    dispatch({
      bounds: bounds && placesRef.current.length > 0 ? bounds : null,
      type: "bounds/set",
    });
  }, []);

  const selectPlace = useCallback((placeId: string | null) => {
    geometryAbortRef.current?.abort();
    geometryAbortRef.current = null;

    if (!placeId) {
      dispatch({ type: "select/clear" });
      return;
    }

    const place = placesRef.current.find((entry) => entry.id === placeId);
    if (!place) {
      dispatch({
        bounds: null,
        hydrate: false,
        placeId,
        type: "select/place",
      });
      return;
    }

    const bounds = boundsFromPoints(
      [{ lat: place.latitude, lon: place.longitude }],
      0.0004,
    );
    const hydrate = needsGeometryHydration(place);
    dispatch({
      bounds,
      hydrate,
      placeId,
      type: "select/place",
    });

    if (!hydrate) {
      return;
    }

    const requestId = geometryRequestIdRef.current + 1;
    geometryRequestIdRef.current = requestId;
    const controller = new AbortController();
    geometryAbortRef.current = controller;

    placeSearchRef.current
      .fetchPlaceGeometry(place.osmType, place.osmId, controller.signal)
      .then((update) => {
        if (
          geometryRequestIdRef.current !== requestId ||
          controller.signal.aborted
        ) {
          return;
        }
        if (!update) {
          dispatch({
            message: "Could not load the place footprint. Try another place.",
            type: "geometry/failed",
          });
          return;
        }
        dispatch({
          placeId,
          type: "geometry/succeeded",
          update,
        });
      })
      .catch((hydrationError: unknown) => {
        if (
          geometryRequestIdRef.current !== requestId ||
          controller.signal.aborted
        ) {
          return;
        }
        const message =
          hydrationError instanceof Error
            ? hydrationError.message
            : "Could not load the place footprint. Try again.";
        dispatch({ message, type: "geometry/failed" });
      })
      .finally(() => {
        if (geometryRequestIdRef.current === requestId) {
          dispatch({ type: "geometry/settled" });
        }
      });
  }, []);

  const selectedPlace =
    session.places.find((place) => place.id === session.selectedPlaceId) ??
    null;

  const runSearch = useCallback(async () => {
    abortRef.current?.abort();
    geometryAbortRef.current?.abort();
    const requestId = searchRequestIdRef.current + 1;
    searchRequestIdRef.current = requestId;
    const controller = new AbortController();
    abortRef.current = controller;
    dispatch({ type: "search/started" });

    try {
      const result = await placeSearchRef.current.search(
        criteria,
        controller.signal,
      );
      if (searchRequestIdRef.current !== requestId) {
        return;
      }

      const bounds = boundsFromPoints(
        result.places.map((place) => ({
          lat: place.latitude,
          lon: place.longitude,
        })),
      );
      dispatch({
        bounds: bounds && result.places.length > 0 ? bounds : null,
        places: result.places,
        truncated: result.truncated,
        type: "search/succeeded",
      });
    } catch (searchError) {
      if (
        searchRequestIdRef.current !== requestId ||
        controller.signal.aborted
      ) {
        return;
      }
      const message =
        searchError instanceof Error
          ? searchError.message
          : "Search failed. Try again.";
      dispatch({ message, type: "search/failed" });
    } finally {
      if (searchRequestIdRef.current === requestId) {
        dispatch({ type: "search/finished" });
      }
    }
  }, [criteria]);

  const value = useMemo(
    (): PlacesContextValue => ({
      boundsToFit: session.boundsToFit,
      clearBoundsToFit,
      criteria,
      error: session.error,
      fitResultsBounds,
      geometryLoading: session.geometryLoading,
      loading: session.loading,
      mapView,
      places: session.places,
      runSearch,
      selectedPlace,
      selectedPlaceId: session.selectedPlaceId,
      selectPlace,
      setCriteria,
      setMapView,
      truncated: session.truncated,
    }),
    [
      clearBoundsToFit,
      criteria,
      fitResultsBounds,
      mapView,
      runSearch,
      selectedPlace,
      selectPlace,
      session.boundsToFit,
      session.error,
      session.geometryLoading,
      session.loading,
      session.places,
      session.selectedPlaceId,
      session.truncated,
      setCriteria,
    ],
  );

  return (
    <PlacesContext.Provider value={value}>{children}</PlacesContext.Provider>
  );
}

/** Returns the Places explorer context or throws when used outside the provider. */
export function usePlaces(): PlacesContextValue {
  const value = useContext(PlacesContext);
  if (!value) {
    throw new Error("usePlaces must be used within PlacesProvider.");
  }
  return value;
}

/**
 * Returns whether a way or relation still needs footprint hydration after a
 * center-only search.
 */
function needsGeometryHydration(place: Place): boolean {
  return (
    (place.osmType === "way" || place.osmType === "relation") &&
    place.geometry.polygons.length === 0
  );
}
