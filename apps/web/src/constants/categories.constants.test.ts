import { describe, expect, it } from "vitest";
import { CATEGORY_DEFINITIONS } from "@/constants/categories.constants";
import { formatCategoryLabel } from "@/services/taxonomy/category-taxonomy";

describe("CATEGORY_DEFINITIONS Strong v1", () => {
  it("meets Strong v1 size floors", () => {
    const predicateCount = CATEGORY_DEFINITIONS.reduce(
      (sum, category) => sum + category.tags.length,
      0,
    );
    expect(CATEGORY_DEFINITIONS.length).toBeGreaterThanOrEqual(80);
    expect(predicateCount).toBeGreaterThanOrEqual(200);
  });

  it("has unique ids", () => {
    const ids = CATEGORY_DEFINITIONS.map((category) => category.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has unique display labels", () => {
    const labels = CATEGORY_DEFINITIONS.map(formatCategoryLabel);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("has unique key=value predicates", () => {
    const predicates = CATEGORY_DEFINITIONS.flatMap((category) =>
      category.tags.map((tag) => `${tag.key}=${tag.value}`),
    );
    expect(new Set(predicates).size).toBe(predicates.length);
  });

  it("requires non-empty fields on every category", () => {
    for (const category of CATEGORY_DEFINITIONS) {
      expect(category.id.trim()).not.toBe("");
      expect(category.topCategory.trim()).not.toBe("");
      expect(category.subCategory.trim()).not.toBe("");
      expect(category.tags.length).toBeGreaterThan(0);
      for (const tag of category.tags) {
        expect(tag.key.trim()).not.toBe("");
        expect(tag.value.trim()).not.toBe("");
      }
    }
  });

  it("preserves legacy coffee-shops id", () => {
    expect(
      CATEGORY_DEFINITIONS.some((category) => category.id === "coffee-shops"),
    ).toBe(true);
  });
});
