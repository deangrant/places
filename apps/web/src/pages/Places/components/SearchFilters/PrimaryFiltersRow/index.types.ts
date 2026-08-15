import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import type { SelectOption } from "@/components/core/Select/index.types";

/**
 * Props for the primary Places filter row and action chrome.
 */
export interface PrimaryFiltersRowProps {
  /** Count of active advanced chips for the Advanced badge. */
  advancedActiveCount: number;
  /** Whether the Advanced disclosure is expanded. */
  advancedOpen: boolean;
  /** Id of the Advanced panel for `aria-controls`. */
  advancedPanelId: string;
  /** Brand text field value. */
  brand: string;
  /** City text field value. */
  city: string;
  /** Selected country ISO code, or empty. */
  countryCode: string;
  /** Country select options. */
  countryOptions: SelectOption[];
  /** True when any filter differs from empty defaults. */
  filtersDirty: boolean;
  /** True while a Places search is in flight. */
  loading: boolean;
  /** Place-name contains filter value. */
  nameContains: string;
  /** Updates the brand filter. */
  onBrandChange: (value: string) => void;
  /** Updates the city filter. */
  onCityChange: (value: string) => void;
  /** Updates the country filter. */
  onCountryChange: (value: string) => void;
  /** Updates the place-name filter. */
  onNameChange: (value: string) => void;
  /** Updates the region filter. */
  onRegionChange: (value: string) => void;
  /** Clears all filters and collapses Advanced. */
  onReset: () => void;
  /** Runs search. */
  onSearchClick: () => void;
  /** Runs search when Enter is pressed in a text field. */
  onSearchKeyDown: (event: ReactKeyboardEvent<HTMLInputElement>) => void;
  /** Toggles the Advanced disclosure. */
  onToggleAdvanced: () => void;
  /** Region / state text field value. */
  region: string;
}
