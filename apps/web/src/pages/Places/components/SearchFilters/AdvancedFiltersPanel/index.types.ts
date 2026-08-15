import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import type { SelectOption } from "@/components/core/Select/index.types";

/**
 * Props for the Advanced taxonomy and OSM tag filter panel.
 */
export interface AdvancedFiltersPanelProps {
  /** Id applied to the panel root for `aria-controls`. */
  advancedPanelId: string;
  /** Selected top-category value. */
  categoryValue: string;
  /** Updates the OSM tag key. */
  onOsmTagKeyChange: (value: string) => void;
  /** Updates the OSM tag value. */
  onOsmTagValueChange: (value: string) => void;
  /** Runs search when Enter is pressed in the value field. */
  onSearchKeyDown: (event: ReactKeyboardEvent<HTMLInputElement>) => void;
  /** Updates subcategory / categoryId. */
  onSubcategoryChange: (value: string) => void;
  /** Updates top category draft and clears categoryId. */
  onTopCategoryChange: (value: string) => void;
  /** Selected OSM tag key, or empty. */
  osmTagKey: string;
  /** OSM tag key select options. */
  osmTagKeyOptions: SelectOption[];
  /** OSM tag value text. */
  osmTagValue: string;
  /** Subcategory select options for the current top category. */
  subcategoryOptions: SelectOption[];
  /** Selected subcategory id, or empty. */
  subcategoryValue: string;
  /** Top-category select options. */
  topCategoryOptions: SelectOption[];
}
