import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Spinner } from "@/components/core/Spinner";
import { OVERPASS_CLIENT_TIMEOUT_SECONDS } from "@/constants/api.constants";
import { usePlaces } from "@/contexts/PlacesContext";
import { MapView } from "@/pages/Places/components/MapView";
import { OverpassQueryStatus } from "@/pages/Places/components/OverpassQueryStatus";
import { PlaceDetail } from "@/pages/Places/components/PlaceDetail";
import { ResultsList } from "@/pages/Places/components/ResultsList";
import { SearchFilters } from "@/pages/Places/components/SearchFilters";
import { filterPlacesByAddress } from "@/utils/filter-places-by-address";
import styles from "./index.module.css";

/** Page skeleton: filters, full-bleed map, and progressive side panel. */
export function PlacesLayout() {
  const {
    boundsToFit,
    clearBoundsToFit,
    fitResultsBounds,
    mapView,
    setMapView,
    places,
    selectedPlace,
    selectedPlaceId,
    selectPlace,
    loading,
    overpassAttempts,
  } = usePlaces();

  const showPanel = places.length > 0;
  const [addressQuery, setAddressQuery] = useState("");
  const deferredAddressQuery = useDeferredValue(addressQuery);
  const filteredPlaces = useMemo(
    () => filterPlacesByAddress(places, deferredAddressQuery),
    [places, deferredAddressQuery],
  );

  const currentAttemptIndex = useMemo(
    () =>
      overpassAttempts.reduce(
        (max, attempt) => Math.max(max, attempt.index),
        -1,
      ),
    [overpassAttempts],
  );

  const [remainingSeconds, setRemainingSeconds] = useState(
    OVERPASS_CLIENT_TIMEOUT_SECONDS,
  );

  useEffect(() => {
    if (loading) {
      setAddressQuery("");
    }
  }, [loading]);

  useEffect(() => {
    if (!loading) {
      return;
    }
    // Restart soft budget whenever failover advances currentAttemptIndex.
    setRemainingSeconds(
      currentAttemptIndex >= -1 ? OVERPASS_CLIENT_TIMEOUT_SECONDS : 0,
    );
    const intervalId = window.setInterval(() => {
      setRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [loading, currentAttemptIndex]);

  useEffect(() => {
    if (!selectedPlace) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        selectPlace(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedPlace, selectPlace]);

  return (
    <div aria-busy={loading} className={styles.root}>
      <SearchFilters />

      <div className={styles.workspace}>
        <section aria-label="Map" className={styles.mapPane}>
          <MapView
            boundsToFit={boundsToFit}
            onBoundsFitted={clearBoundsToFit}
            onFitResults={fitResultsBounds}
            onSelectPlace={selectPlace}
            onViewChange={setMapView}
            places={filteredPlaces}
            selectedPlaceId={selectedPlaceId}
            view={mapView}
          />
        </section>

        {showPanel ? (
          <aside
            aria-label={selectedPlace ? "Place detail" : "Search results"}
            className={styles.sidePanel}
          >
            {selectedPlace ? (
              <PlaceDetail />
            ) : (
              <ResultsList
                onQueryChange={setAddressQuery}
                places={filteredPlaces}
                query={addressQuery}
                totalCount={places.length}
              />
            )}
          </aside>
        ) : null}
      </div>

      {loading ? (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingCard}>
            <Spinner label="Searching places. Please wait..." size="lg" />
            <p className={styles.countdown}>
              Up to {formatCountdown(remainingSeconds)} remaining
            </p>
            <OverpassQueryStatus attempts={overpassAttempts} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Formats remaining seconds as M:SS for the search timeout countdown.
 * @param totalSeconds Seconds left before the soft Overpass timeout.
 */
function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
