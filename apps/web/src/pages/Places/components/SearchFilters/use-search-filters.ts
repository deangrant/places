import { COUNTRY_OPTIONS, OSM_TAG_KEY_ALLOWLIST } from "places-core";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useCallback, useId, useMemo, useState } from "react";
import type { SelectOption } from "@/components/core/Select/index.types";
import { usePlacesSearch } from "@/contexts/PlacesContext";
import { useServices } from "@/contexts/ServicesContext";

/**
 * One clearable advanced-filter chip shown when the advanced panel is collapsed.
 */
export interface AdvancedChip {
  /** Stable chip identity for list keys. */
  id: string;
  /** Visible chip label. */
  label: string;
  /** Clears the filter(s) represented by this chip. */
  onClear: () => void;
}

/**
 * Filter state, derived options, and handlers for the Places search toolbar.
 */
export interface SearchFiltersModel {
  /** Count of active advanced chips (badge). */
  advancedActiveCount: number;
  /** Clearable chips for active advanced filters while collapsed. */
  advancedChips: AdvancedChip[];
  /** Whether the Advanced disclosure is expanded. */
  advancedOpen: boolean;
  /** Id of the Advanced panel for `aria-controls`. */
  advancedPanelId: string;
  /** Brand text field value. */
  brand: string;
  /** Selected top-category value for the Category select. */
  categoryValue: string;
  /** City text field value. */
  city: string;
  /** Selected country ISO code, or empty for any. */
  countryCode: string;
  /** Country select options. */
  countryOptions: SelectOption[];
  /** Search error message, if any. */
  error: string | null;
  /** True when any filter differs from empty defaults. */
  filtersDirty: boolean;
  /** Updates the brand filter. */
  handleBrandChange: (value: string) => void;
  /** Updates the city filter. */
  handleCityChange: (value: string) => void;
  /** Updates the country filter. */
  handleCountryChange: (value: string) => void;
  /** Updates the place-name filter. */
  handleNameChange: (value: string) => void;
  /** Updates the OSM tag key (clears value when key clears). */
  handleOsmTagKeyChange: (value: string) => void;
  /** Updates the OSM tag value. */
  handleOsmTagValueChange: (value: string) => void;
  /** Updates the region filter. */
  handleRegionChange: (value: string) => void;
  /** Clears all filters and collapses Advanced. */
  handleReset: () => void;
  /** Runs search. */
  handleSearchClick: () => void;
  /** Runs search when Enter is pressed in a text field. */
  handleSearchKeyDown: (event: ReactKeyboardEvent<HTMLInputElement>) => void;
  /** Updates subcategory / categoryId. */
  handleSubcategoryChange: (value: string) => void;
  /** Toggles the Advanced disclosure. */
  handleToggleAdvanced: () => void;
  /** Updates top category draft and clears categoryId. */
  handleTopCategoryChange: (value: string) => void;
  /** True while a Places search is in flight. */
  loading: boolean;
  /** Place-name contains filter value. */
  nameContains: string;
  /** Selected OSM tag key, or empty. */
  osmTagKey: string;
  /** OSM tag key select options. */
  osmTagKeyOptions: SelectOption[];
  /** OSM tag value text. */
  osmTagValue: string;
  /** Region / state text field value. */
  region: string;
  /** Subcategory select options for the current top category. */
  subcategoryOptions: SelectOption[];
  /** Selected subcategory id, or empty. */
  subcategoryValue: string;
  /** Top-category select options. */
  topCategoryOptions: SelectOption[];
}

/**
 * Owns Places search-filter criteria state and derived select options.
 */
export function useSearchFilters(): SearchFiltersModel {
  const { criteria, setCriteria, loading, runSearch, error } =
    usePlacesSearch();
  const { taxonomy } = useServices();
  const [selectedTop, setSelectedTop] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const advancedPanelId = useId();

  const leafCategory = useMemo(
    () =>
      criteria.categoryId ? taxonomy.getById(criteria.categoryId) : undefined,
    [criteria.categoryId, taxonomy],
  );

  const categoryValue = leafCategory?.topCategory ?? selectedTop;

  const topCategoryOptions = useMemo(
    () =>
      taxonomy.listTopCategories().map((topCategory) => ({
        label: topCategory,
        value: topCategory,
      })),
    [taxonomy],
  );

  const subcategoryOptions = useMemo(() => {
    if (!categoryValue) {
      return [];
    }
    return taxonomy.listByTopCategory(categoryValue).map((category) => ({
      label: category.subCategory,
      value: category.id,
    }));
  }, [categoryValue, taxonomy]);

  const subcategoryValue =
    leafCategory && leafCategory.topCategory === categoryValue
      ? leafCategory.id
      : "";

  const osmTagKeyOptions = useMemo(
    () =>
      OSM_TAG_KEY_ALLOWLIST.map((key) => ({
        label: key,
        value: key,
      })),
    [],
  );

  const countryOptions = useMemo(
    () =>
      COUNTRY_OPTIONS.map((country) => ({
        label: country.name,
        value: country.code,
      })),
    [],
  );

  const advancedChips = useMemo((): AdvancedChip[] => {
    const chips: AdvancedChip[] = [];
    if (leafCategory) {
      chips.push({
        id: "category",
        label: `${leafCategory.topCategory}: ${leafCategory.subCategory}`,
        onClear: () => {
          setSelectedTop("");
          setCriteria({ categoryId: undefined });
        },
      });
    } else if (selectedTop) {
      chips.push({
        id: "category",
        label: `Category: ${selectedTop}`,
        onClear: () => {
          setSelectedTop("");
          setCriteria({ categoryId: undefined });
        },
      });
    }
    const osmKey = criteria.osmTagKey?.trim();
    const osmValue = criteria.osmTagValue?.trim();
    if (osmKey || osmValue) {
      chips.push({
        id: "osmTag",
        label: osmValue ? `${osmKey ?? "tag"}=${osmValue}` : `OSM: ${osmKey}`,
        onClear: () => setCriteria({ osmTagKey: undefined, osmTagValue: "" }),
      });
    }
    return chips;
  }, [criteria, leafCategory, selectedTop, setCriteria]);

  const filtersDirty = useMemo(() => {
    const hasText = (value: string | undefined) => Boolean(value?.trim());
    return (
      hasText(criteria.brand) ||
      hasText(criteria.nameContains) ||
      Boolean(criteria.countryCode) ||
      hasText(criteria.region) ||
      hasText(criteria.city) ||
      Boolean(criteria.categoryId) ||
      Boolean(criteria.osmTagKey) ||
      hasText(criteria.osmTagValue) ||
      Boolean(selectedTop)
    );
  }, [criteria, selectedTop]);

  const handleBrandChange = useCallback(
    (value: string) => {
      setCriteria({ brand: value });
    },
    [setCriteria],
  );

  const handleTopCategoryChange = useCallback(
    (value: string) => {
      setSelectedTop(value);
      setCriteria({ categoryId: undefined });
    },
    [setCriteria],
  );

  const handleSubcategoryChange = useCallback(
    (value: string) => {
      setCriteria({ categoryId: value || undefined });
    },
    [setCriteria],
  );

  const handleNameChange = useCallback(
    (value: string) => {
      setCriteria({ nameContains: value });
    },
    [setCriteria],
  );

  const handleCountryChange = useCallback(
    (value: string) => {
      setCriteria({ countryCode: value || undefined });
    },
    [setCriteria],
  );

  const handleRegionChange = useCallback(
    (value: string) => {
      setCriteria({ region: value });
    },
    [setCriteria],
  );

  const handleCityChange = useCallback(
    (value: string) => {
      setCriteria({ city: value });
    },
    [setCriteria],
  );

  const handleOsmTagKeyChange = useCallback(
    (value: string) => {
      setCriteria({
        osmTagKey: value || undefined,
        ...(value ? {} : { osmTagValue: "" }),
      });
    },
    [setCriteria],
  );

  const handleOsmTagValueChange = useCallback(
    (value: string) => {
      setCriteria({ osmTagValue: value });
    },
    [setCriteria],
  );

  const handleSearchKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        runSearch().catch(() => undefined);
      }
    },
    [runSearch],
  );

  const handleSearchClick = useCallback(() => {
    runSearch().catch(() => undefined);
  }, [runSearch]);

  const handleToggleAdvanced = useCallback(() => {
    setAdvancedOpen((open) => !open);
  }, []);

  const handleReset = useCallback(() => {
    setCriteria(() => ({}));
    setSelectedTop("");
    setAdvancedOpen(false);
  }, [setCriteria]);

  return {
    advancedActiveCount: advancedChips.length,
    advancedChips,
    advancedOpen,
    advancedPanelId,
    brand: criteria.brand ?? "",
    categoryValue,
    city: criteria.city ?? "",
    countryCode: criteria.countryCode ?? "",
    countryOptions,
    error,
    filtersDirty,
    handleBrandChange,
    handleCityChange,
    handleCountryChange,
    handleNameChange,
    handleOsmTagKeyChange,
    handleOsmTagValueChange,
    handleRegionChange,
    handleReset,
    handleSearchClick,
    handleSearchKeyDown,
    handleSubcategoryChange,
    handleToggleAdvanced,
    handleTopCategoryChange,
    loading,
    nameContains: criteria.nameContains ?? "",
    osmTagKey: criteria.osmTagKey ?? "",
    osmTagKeyOptions,
    osmTagValue: criteria.osmTagValue ?? "",
    region: criteria.region ?? "",
    subcategoryOptions,
    subcategoryValue,
    topCategoryOptions,
  };
}
