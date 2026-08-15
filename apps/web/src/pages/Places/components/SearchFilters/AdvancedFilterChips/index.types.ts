import type { AdvancedChip } from "../use-search-filters";

/**
 * Props for collapsed advanced-filter chips.
 */
export interface AdvancedFilterChipsProps {
  /** Whether the Advanced disclosure is expanded. */
  advancedOpen: boolean;
  /** Clearable chips for active advanced filters. */
  chips: AdvancedChip[];
}
