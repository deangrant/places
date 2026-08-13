import type { BBox, MapViewState, Place } from "@/types/places.types";

/**
 * Props for the Mapbox Places map container.
 */
export interface MapViewProps {
  /** Bounding box to fit once, or null when idle. */
  boundsToFit: BBox | null;
  /** Called after a pending bounds fit has been applied. */
  onBoundsFitted: () => void;
  /** Called when the user requests fitting to current results. */
  onFitResults: () => void;
  /** Called when the user selects a place marker. */
  onSelectPlace: (placeId: string) => void;
  /** Called when the map camera changes from user interaction. */
  onViewChange: (view: MapViewState) => void;
  /** Places rendered as clustered markers. */
  places: Place[];
  /** Selected place id, or null when none. */
  selectedPlaceId: string | null;
  /** Controlled map camera state. */
  view: MapViewState;
}
