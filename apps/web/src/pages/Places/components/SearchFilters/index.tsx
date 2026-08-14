import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useCallback, useMemo } from "react";
import { Button } from "@/components/core/Button";
import { Input } from "@/components/core/Input";
import { Select } from "@/components/core/Select";
import { Autocomplete } from "@/components/patterns/Autocomplete";
import { FormField } from "@/components/patterns/FormField";
import { COUNTRY_OPTIONS } from "@/constants/categories.constants";
import { OSM_TAG_KEY_ALLOWLIST } from "@/constants/osm-tags.constants";
import { usePlaces } from "@/contexts/PlacesContext";
import { useServices } from "@/contexts/ServicesContext";
import styles from "./index.module.css";

/** Filter chrome for category, brand, geography, and search actions. */
export function SearchFilters() {
  const { criteria, setCriteria, loading, runSearch, error } = usePlaces();
  const { brandCatalog, taxonomy } = useServices();

  const categoryOptions = useMemo(
    () =>
      taxonomy.list().map((category) => ({
        label: `${category.topCategory} · ${category.subCategory}`,
        value: category.id,
      })),
    [taxonomy],
  );

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

  const brandSuggestions = useMemo(
    () => brandCatalog.search(criteria.brand ?? ""),
    [brandCatalog, criteria.brand],
  );

  const handleBrandChange = useCallback(
    (value: string) => {
      setCriteria({ brand: value });
    },
    [setCriteria],
  );

  const handleBrandSelect = useCallback(
    (value: string) => {
      setCriteria({ brand: value });
    },
    [setCriteria],
  );

  const handleCategoryChange = useCallback(
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
      setCriteria({ osmTagKey: value || undefined });
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

  return (
    <section aria-label="Place filters" className={styles.root}>
      <div className={styles.grid}>
        <FormField htmlFor="brand" label="Brand">
          <Autocomplete
            id="brand"
            onChange={handleBrandChange}
            onSelect={handleBrandSelect}
            placeholder="e.g. Starbucks"
            suggestions={brandSuggestions}
            value={criteria.brand ?? ""}
          />
        </FormField>

        <FormField htmlFor="category" label="Industry / category">
          <Select
            id="category"
            onChange={handleCategoryChange}
            options={categoryOptions}
            placeholder="Any category"
            value={criteria.categoryId ?? ""}
          />
        </FormField>

        <FormField htmlFor="name" label="Place name">
          <Input
            id="name"
            onChange={handleNameChange}
            onKeyDown={handleSearchKeyDown}
            placeholder="Contains…"
            value={criteria.nameContains ?? ""}
          />
        </FormField>

        <FormField htmlFor="country" label="Country">
          <Select
            id="country"
            onChange={handleCountryChange}
            options={countryOptions}
            placeholder="Any country"
            value={criteria.countryCode ?? ""}
          />
        </FormField>

        <FormField htmlFor="region" label="State / region">
          <Input
            id="region"
            onChange={handleRegionChange}
            onKeyDown={handleSearchKeyDown}
            placeholder="e.g. California"
            value={criteria.region ?? ""}
          />
        </FormField>

        <FormField htmlFor="city" label="City">
          <Input
            id="city"
            onChange={handleCityChange}
            onKeyDown={handleSearchKeyDown}
            placeholder="e.g. San Francisco"
            value={criteria.city ?? ""}
          />
        </FormField>

        <FormField htmlFor="osm-tag-key" label="OSM tag key">
          <Select
            id="osm-tag-key"
            onChange={handleOsmTagKeyChange}
            options={osmTagKeyOptions}
            placeholder="Any key"
            value={criteria.osmTagKey ?? ""}
          />
        </FormField>

        <FormField htmlFor="osm-tag-value" label="OSM tag value">
          <Input
            id="osm-tag-value"
            onChange={handleOsmTagValueChange}
            onKeyDown={handleSearchKeyDown}
            placeholder="e.g. cafe"
            value={criteria.osmTagValue ?? ""}
          />
        </FormField>

        <div className={styles.actions}>
          <Button
            className={styles.search}
            disabled={loading}
            onClick={handleSearchClick}
          >
            Search
          </Button>
        </div>
      </div>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
