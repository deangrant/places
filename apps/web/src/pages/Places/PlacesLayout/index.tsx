import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/core/Button";
import { Spinner } from "@/components/core/Spinner";
import { usePlaces } from "@/contexts/PlacesContext";
import { MapView } from "@/pages/Places/components/MapView";
import { PlaceDetail } from "@/pages/Places/components/PlaceDetail";
import { ResultsList } from "@/pages/Places/components/ResultsList";
import { SearchFilters } from "@/pages/Places/components/SearchFilters";
import { useQueryCountdown } from "@/pages/Places/use-query-countdown";
import { filterPlacesByAddress } from "@/utils/filter-places-by-address";
import { formatCountdown } from "@/utils/format-countdown";
import styles from "./index.module.css";

/** Page skeleton: filters, full-bleed map, and progressive side panel. */
export function PlacesLayout() {
  const {
    boundsToFit,
    cancelSearch,
    clearBoundsToFit,
    fitResultsBounds,
    mapView,
    setMapView,
    places,
    selectedPlace,
    selectedPlaceId,
    selectPlace,
    loading,
  } = usePlaces();

  const showPanel = places.length > 0;
  const [addressQuery, setAddressQuery] = useState("");
  const deferredAddressQuery = useDeferredValue(addressQuery);
  const filteredPlaces = useMemo(
    () => filterPlacesByAddress(places, deferredAddressQuery),
    [places, deferredAddressQuery],
  );

  const remainingSeconds = useQueryCountdown({ active: loading });

  useEffect(() => {
    if (loading) {
      setAddressQuery("");
    }
  }, [loading]);

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
            <Button onClick={cancelSearch} variant="ghost">
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
