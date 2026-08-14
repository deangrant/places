import type { Place } from "@/types/places.types";

/**
 * Props for the search results list with optional address filter chrome.
 */
export interface ResultsListProps {
  /** Called when the address filter text changes. */
  onQueryChange: (query: string) => void;
  /** Places after applying the address filter. */
  places: Place[];
  /** Current address filter query. */
  query: string;
  /** Unfiltered result count from the latest search. */
  totalCount: number;
}

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
