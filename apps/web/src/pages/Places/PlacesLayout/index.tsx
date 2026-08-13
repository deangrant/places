import { useEffect } from "react";
import { Spinner } from "@/components/core/Spinner";
import { usePlaces } from "@/contexts/PlacesContext";
import { MapView } from "@/pages/Places/components/MapView";
import { PlaceDetail } from "@/pages/Places/components/PlaceDetail";
import { ResultsList } from "@/pages/Places/components/ResultsList";
import { SearchFilters } from "@/pages/Places/components/SearchFilters";
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
  } = usePlaces();

  const showPanel = places.length > 0 || loading;

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
    <div className={styles.root}>
      <SearchFilters />

      <div className={styles.workspace}>
        <section aria-label="Map" className={styles.mapPane}>
          {loading ? (
            <div className={styles.loadingOverlay}>
              <Spinner label="Querying places…" />
            </div>
          ) : null}
          <MapView
            boundsToFit={boundsToFit}
            onBoundsFitted={clearBoundsToFit}
            onFitResults={fitResultsBounds}
            onSelectPlace={selectPlace}
            onViewChange={setMapView}
            places={places}
            selectedPlaceId={selectedPlaceId}
            view={mapView}
          />
        </section>

        {showPanel ? (
          <aside
            aria-label={selectedPlace ? "Place detail" : "Search results"}
            className={styles.sidePanel}
          >
            {selectedPlace ? <PlaceDetail /> : <ResultsList />}
          </aside>
        ) : null}
      </div>
    </div>
  );
}
