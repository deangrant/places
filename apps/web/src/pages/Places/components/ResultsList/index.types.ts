import type { Place } from "@/types/places.types";

/**
 * Props for one selectable row in the search results list.
 */
export interface ResultRowProps {
  /** Invoked with the place id when the row is activated. */
  onSelect: (placeId: string) => void;
  /** Place record rendered in the row. */
  place: Place;
  /** Whether this row is the currently selected place. */
  selected: boolean;
}
