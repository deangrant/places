import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { DEFAULT_MAP_VIEW } from "@/constants/api.constants";
import { useServices } from "@/contexts/ServicesContext";
import type {
  BBox,
  MapViewState,
  Place,
  PlaceSearchCriteria,
} from "@/types/places.types";
import { boundsFromPoints } from "@/utils/geo";
import type { PlacesContextValue, PlacesProviderProps } from "./index.types";

const PlacesContext = createContext<PlacesContextValue | null>(null);

const initialCriteria: PlaceSearchCriteria = {};

/** Provides Places explorer state and search orchestration. */
export function PlacesProvider({ children }: PlacesProviderProps) {
  const { placeSearch } = useServices();
  const [criteria, setCriteriaState] =
    useState<PlaceSearchCriteria>(initialCriteria);
  const [mapView, setMapView] = useState<MapViewState>(DEFAULT_MAP_VIEW);
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [geometryLoading, setGeometryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [boundsToFit, setBoundsToFit] = useState<BBox | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const geometryAbortRef = useRef<AbortController | null>(null);
  const geometryRequestIdRef = useRef(0);
  const searchRequestIdRef = useRef(0);
  const placesRef = useRef(places);
  const placeSearchRef = useRef(placeSearch);

  useEffect(() => {
    placesRef.current = places;
  }, [places]);

  useEffect(() => {
    placeSearchRef.current = placeSearch;
  }, [placeSearch]);

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
    setBoundsToFit(null);
  }, []);

  const fitResultsBounds = useCallback(() => {
    const bounds = boundsFromPoints(
      placesRef.current.map((place) => ({
        lat: place.latitude,
        lon: place.longitude,
      })),
    );
    setBoundsToFit(bounds && placesRef.current.length > 0 ? bounds : null);
  }, []);

  const selectPlace = useCallback((placeId: string | null) => {
    geometryAbortRef.current?.abort();
    geometryAbortRef.current = null;
    setSelectedPlaceId(placeId);
    setGeometryLoading(false);

    if (!placeId) {
      return;
    }

    const place = placesRef.current.find((entry) => entry.id === placeId);
    if (!place) {
      return;
    }

    setBoundsToFit(
      boundsFromPoints([{ lat: place.latitude, lon: place.longitude }], 0.0004),
    );

    if (!needsGeometryHydration(place)) {
      return;
    }

    const requestId = geometryRequestIdRef.current + 1;
    geometryRequestIdRef.current = requestId;
    const controller = new AbortController();
    geometryAbortRef.current = controller;
    setGeometryLoading(true);

    placeSearchRef.current
      .fetchPlaceGeometry(place.osmType, place.osmId, controller.signal)
      .then((update) => {
        if (
          geometryRequestIdRef.current !== requestId ||
          controller.signal.aborted ||
          !update
        ) {
          return;
        }
        setPlaces((prev) =>
          prev.map((entry) =>
            entry.id === placeId
              ? {
                  ...entry,
                  geometry: update.geometry,
                  geometryType: update.geometryType,
                  geometryWkt: update.geometryWkt,
                  latitude: update.latitude,
                  longitude: update.longitude,
                }
              : entry,
          ),
        );
      })
      .catch(() => undefined)
      .finally(() => {
        if (geometryRequestIdRef.current === requestId) {
          setGeometryLoading(false);
        }
      });
  }, []);

  const selectedPlace =
    places.find((place) => place.id === selectedPlaceId) ?? null;

  const runSearch = useCallback(async () => {
    abortRef.current?.abort();
    geometryAbortRef.current?.abort();
    const requestId = searchRequestIdRef.current + 1;
    searchRequestIdRef.current = requestId;
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setGeometryLoading(false);
    setError(null);

    try {
      const result = await placeSearchRef.current.search(
        criteria,
        controller.signal,
      );
      if (searchRequestIdRef.current !== requestId) {
        return;
      }
      setPlaces(result.places);
      setTruncated(result.truncated);
      setSelectedPlaceId(null);

      const bounds = boundsFromPoints(
        result.places.map((place) => ({
          lat: place.latitude,
          lon: place.longitude,
        })),
      );
      setBoundsToFit(bounds && result.places.length > 0 ? bounds : null);
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
      setError(message);
      setPlaces([]);
      setSelectedPlaceId(null);
      setBoundsToFit(null);
    } finally {
      setLoading((current) =>
        searchRequestIdRef.current === requestId ? false : current,
      );
    }
  }, [criteria]);

  const value = useMemo(
    (): PlacesContextValue => ({
      boundsToFit,
      clearBoundsToFit,
      criteria,
      error,
      fitResultsBounds,
      geometryLoading,
      loading,
      mapView,
      places,
      runSearch,
      selectedPlace,
      selectedPlaceId,
      selectPlace,
      setCriteria,
      setMapView,
      truncated,
    }),
    [
      boundsToFit,
      clearBoundsToFit,
      criteria,
      error,
      fitResultsBounds,
      geometryLoading,
      loading,
      mapView,
      places,
      runSearch,
      selectedPlace,
      selectedPlaceId,
      selectPlace,
      setCriteria,
      truncated,
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
