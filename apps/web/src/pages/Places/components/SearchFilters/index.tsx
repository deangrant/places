import { COUNTRY_OPTIONS, OSM_TAG_KEY_ALLOWLIST } from "places-core";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useCallback, useId, useMemo, useState } from "react";
import { Button } from "@/components/core/Button";
import { Input } from "@/components/core/Input";
import { Select } from "@/components/core/Select";
import { FormField } from "@/components/patterns/FormField";
import { usePlacesSearch } from "@/contexts/PlacesContext";
import { useServices } from "@/contexts/ServicesContext";
import styles from "./index.module.css";

type AdvancedChip = {
  id: string;
  label: string;
  onClear: () => void;
};

/** Filter chrome for brand, geography, and advanced search actions. */
export function SearchFilters() {
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

  const advancedActiveCount = advancedChips.length;

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

  return (
    <section aria-label="Place filters" className={styles.root}>
      <div className={styles.primaryRow}>
        <FormField htmlFor="brand" label="Brand">
          <div title="Exact OSM brand match.">
            <Input
              clearable
              clearLabel="Clear brand"
              id="brand"
              onChange={handleBrandChange}
              onKeyDown={handleSearchKeyDown}
              placeholder="e.g. Starbucks"
              value={criteria.brand ?? ""}
            />
          </div>
        </FormField>

        <FormField htmlFor="name" label="Place name">
          <Input
            clearable
            clearLabel="Clear place name"
            id="name"
            onChange={handleNameChange}
            onKeyDown={handleSearchKeyDown}
            placeholder="Contains…"
            value={criteria.nameContains ?? ""}
          />
        </FormField>

        <FormField htmlFor="country" label="Country">
          <div title="Curated country list — not every ISO code.">
            <Select
              clearable
              clearLabel="Clear country"
              id="country"
              onChange={handleCountryChange}
              options={countryOptions}
              placeholder="Any country"
              value={criteria.countryCode ?? ""}
            />
          </div>
        </FormField>

        <FormField htmlFor="region" label="State / region">
          <Input
            clearable
            clearLabel="Clear state / region"
            id="region"
            onChange={handleRegionChange}
            onKeyDown={handleSearchKeyDown}
            placeholder="e.g. California"
            value={criteria.region ?? ""}
          />
        </FormField>

        <FormField htmlFor="city" label="City">
          <Input
            clearable
            clearLabel="Clear city"
            id="city"
            onChange={handleCityChange}
            onKeyDown={handleSearchKeyDown}
            placeholder="e.g. San Francisco"
            value={criteria.city ?? ""}
          />
        </FormField>

        <div className={styles.actions}>
          <Button
            aria-controls={advancedPanelId}
            aria-expanded={advancedOpen}
            className={styles.advancedToggle}
            onClick={handleToggleAdvanced}
            title="Category and OSM tag filters"
            variant="ghost"
          >
            Advanced
            {advancedActiveCount > 0 ? (
              <span className={styles.badge}>{advancedActiveCount}</span>
            ) : null}
          </Button>
          <Button
            className={styles.reset}
            disabled={!filtersDirty || loading}
            onClick={handleReset}
            title="Clear all filters"
            variant="ghost"
          >
            Reset
          </Button>
          <Button
            className={styles.search}
            disabled={loading}
            onClick={handleSearchClick}
          >
            Search
          </Button>
        </div>
      </div>

      {!advancedOpen && advancedChips.length > 0 ? (
        <ul aria-label="Active advanced filters" className={styles.chips}>
          {advancedChips.map((chip) => (
            <li key={chip.id}>
              <button
                aria-label={`Clear ${chip.label}`}
                className={styles.chip}
                onClick={chip.onClear}
                type="button"
              >
                <span>{chip.label}</span>
                <span aria-hidden="true" className={styles.chipClear}>
                  ×
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {advancedOpen ? (
        <div className={styles.advancedPanel} id={advancedPanelId}>
          <div className={styles.advancedGrid}>
            <FormField htmlFor="category" label="Category">
              <Select
                clearable
                clearLabel="Clear category"
                id="category"
                onChange={handleTopCategoryChange}
                options={topCategoryOptions}
                placeholder="Any category"
                value={categoryValue}
              />
            </FormField>

            {categoryValue ? (
              <FormField htmlFor="subcategory" label="Subcategory">
                <Select
                  clearable
                  clearLabel="Clear subcategory"
                  id="subcategory"
                  onChange={handleSubcategoryChange}
                  options={subcategoryOptions}
                  placeholder="Any subcategory"
                  value={subcategoryValue}
                />
              </FormField>
            ) : null}

            <FormField htmlFor="osm-tag-key" label="Tag">
              <Select
                clearable
                clearLabel="Clear tag"
                id="osm-tag-key"
                onChange={handleOsmTagKeyChange}
                options={osmTagKeyOptions}
                placeholder="Any key"
                value={criteria.osmTagKey ?? ""}
              />
            </FormField>

            {criteria.osmTagKey ? (
              <FormField htmlFor="osm-tag-value" label="Value">
                <Input
                  clearable
                  clearLabel="Clear value"
                  id="osm-tag-value"
                  onChange={handleOsmTagValueChange}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="e.g. cafe"
                  value={criteria.osmTagValue ?? ""}
                />
              </FormField>
            ) : null}
          </div>
        </div>
      ) : null}

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
