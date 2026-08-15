import { Input } from "@/components/core/Input";
import { Select } from "@/components/core/Select";
import { FormField } from "@/components/patterns/FormField";
import styles from "../index.module.css";
import type { AdvancedFiltersPanelProps } from "./index.types";

/**
 * Renders category and OSM tag fields when Advanced filters are expanded.
 */
export function AdvancedFiltersPanel({
  advancedPanelId,
  categoryValue,
  osmTagKey,
  osmTagKeyOptions,
  osmTagValue,
  subcategoryOptions,
  subcategoryValue,
  topCategoryOptions,
  onOsmTagKeyChange,
  onOsmTagValueChange,
  onSearchKeyDown,
  onSubcategoryChange,
  onTopCategoryChange,
}: AdvancedFiltersPanelProps) {
  return (
    <div className={styles.advancedPanel} id={advancedPanelId}>
      <div className={styles.advancedGrid}>
        <FormField htmlFor="category" label="Category">
          <Select
            clearable
            clearLabel="Clear category"
            id="category"
            onChange={onTopCategoryChange}
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
              onChange={onSubcategoryChange}
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
            onChange={onOsmTagKeyChange}
            options={osmTagKeyOptions}
            placeholder="Any key"
            value={osmTagKey}
          />
        </FormField>

        {osmTagKey ? (
          <FormField htmlFor="osm-tag-value" label="Value">
            <Input
              clearable
              clearLabel="Clear value"
              id="osm-tag-value"
              onChange={onOsmTagValueChange}
              onKeyDown={onSearchKeyDown}
              placeholder="e.g. cafe"
              value={osmTagValue}
            />
          </FormField>
        ) : null}
      </div>
    </div>
  );
}
