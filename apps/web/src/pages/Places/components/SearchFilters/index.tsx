import { AdvancedFilterChips } from "./AdvancedFilterChips";
import { AdvancedFiltersPanel } from "./AdvancedFiltersPanel";
import styles from "./index.module.css";
import { PrimaryFiltersRow } from "./PrimaryFiltersRow";
import { useSearchFilters } from "./use-search-filters";

/** Filter chrome for brand, geography, and advanced search actions. */
export function SearchFilters() {
  const {
    advancedActiveCount,
    advancedChips,
    advancedOpen,
    advancedPanelId,
    brand,
    categoryValue,
    city,
    countryCode,
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
    nameContains,
    osmTagKey,
    osmTagKeyOptions,
    osmTagValue,
    region,
    subcategoryOptions,
    subcategoryValue,
    topCategoryOptions,
  } = useSearchFilters();

  return (
    <section aria-label="Place filters" className={styles.root}>
      <PrimaryFiltersRow
        advancedActiveCount={advancedActiveCount}
        advancedOpen={advancedOpen}
        advancedPanelId={advancedPanelId}
        brand={brand}
        city={city}
        countryCode={countryCode}
        countryOptions={countryOptions}
        filtersDirty={filtersDirty}
        loading={loading}
        nameContains={nameContains}
        onBrandChange={handleBrandChange}
        onCityChange={handleCityChange}
        onCountryChange={handleCountryChange}
        onNameChange={handleNameChange}
        onRegionChange={handleRegionChange}
        onReset={handleReset}
        onSearchClick={handleSearchClick}
        onSearchKeyDown={handleSearchKeyDown}
        onToggleAdvanced={handleToggleAdvanced}
        region={region}
      />

      <AdvancedFilterChips advancedOpen={advancedOpen} chips={advancedChips} />

      {advancedOpen ? (
        <AdvancedFiltersPanel
          advancedPanelId={advancedPanelId}
          categoryValue={categoryValue}
          onOsmTagKeyChange={handleOsmTagKeyChange}
          onOsmTagValueChange={handleOsmTagValueChange}
          onSearchKeyDown={handleSearchKeyDown}
          onSubcategoryChange={handleSubcategoryChange}
          onTopCategoryChange={handleTopCategoryChange}
          osmTagKey={osmTagKey}
          osmTagKeyOptions={osmTagKeyOptions}
          osmTagValue={osmTagValue}
          subcategoryOptions={subcategoryOptions}
          subcategoryValue={subcategoryValue}
          topCategoryOptions={topCategoryOptions}
        />
      ) : null}

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
