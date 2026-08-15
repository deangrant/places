import { Button } from "@/components/core/Button";
import { Input } from "@/components/core/Input";
import { Select } from "@/components/core/Select";
import { FormField } from "@/components/patterns/FormField";
import styles from "../index.module.css";
import type { PrimaryFiltersRowProps } from "./index.types";

/**
 * Renders brand, geography, and search action controls for Places filters.
 */
export function PrimaryFiltersRow({
  advancedActiveCount,
  advancedOpen,
  advancedPanelId,
  brand,
  city,
  countryCode,
  countryOptions,
  filtersDirty,
  loading,
  nameContains,
  region,
  onBrandChange,
  onCityChange,
  onCountryChange,
  onNameChange,
  onRegionChange,
  onReset,
  onSearchClick,
  onSearchKeyDown,
  onToggleAdvanced,
}: PrimaryFiltersRowProps) {
  return (
    <div className={styles.primaryRow}>
      <FormField htmlFor="brand" label="Brand">
        <div title="Exact OSM brand match.">
          <Input
            clearable
            clearLabel="Clear brand"
            id="brand"
            onChange={onBrandChange}
            onKeyDown={onSearchKeyDown}
            placeholder="e.g. Starbucks"
            value={brand}
          />
        </div>
      </FormField>

      <FormField htmlFor="name" label="Place name">
        <Input
          clearable
          clearLabel="Clear place name"
          id="name"
          onChange={onNameChange}
          onKeyDown={onSearchKeyDown}
          placeholder="Contains…"
          value={nameContains}
        />
      </FormField>

      <FormField htmlFor="country" label="Country">
        <div title="Curated country list — not every ISO code.">
          <Select
            clearable
            clearLabel="Clear country"
            id="country"
            onChange={onCountryChange}
            options={countryOptions}
            placeholder="Any country"
            value={countryCode}
          />
        </div>
      </FormField>

      <FormField htmlFor="region" label="State / region">
        <Input
          clearable
          clearLabel="Clear state / region"
          id="region"
          onChange={onRegionChange}
          onKeyDown={onSearchKeyDown}
          placeholder="e.g. California"
          value={region}
        />
      </FormField>

      <FormField htmlFor="city" label="City">
        <Input
          clearable
          clearLabel="Clear city"
          id="city"
          onChange={onCityChange}
          onKeyDown={onSearchKeyDown}
          placeholder="e.g. San Francisco"
          value={city}
        />
      </FormField>

      <div className={styles.actions}>
        <Button
          aria-controls={advancedPanelId}
          aria-expanded={advancedOpen}
          className={styles.advancedToggle}
          onClick={onToggleAdvanced}
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
          onClick={onReset}
          title="Clear all filters"
          variant="ghost"
        >
          Reset
        </Button>
        <Button
          className={styles.search}
          disabled={loading}
          onClick={onSearchClick}
        >
          Search
        </Button>
      </div>
    </div>
  );
}
