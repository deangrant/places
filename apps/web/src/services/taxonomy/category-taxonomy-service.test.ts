import { describe, expect, it } from "vitest";
import { CategoryTaxonomy } from "@/services/taxonomy/category-taxonomy-service";

describe("CategoryTaxonomy", () => {
  const taxonomy = new CategoryTaxonomy();

  it("lists unique top categories sorted A–Z", () => {
    const tops = taxonomy.listTopCategories();
    expect(tops).toHaveLength(12);
    expect(tops).toEqual([...tops].sort((a, b) => a.localeCompare(b)));
    expect(new Set(tops).size).toBe(tops.length);
  });

  it("lists Food Services leaves including coffee-shops", () => {
    const food = taxonomy.listByTopCategory("Food Services");
    expect(food.some((category) => category.id === "coffee-shops")).toBe(true);
    expect(
      food.every((category) => category.topCategory === "Food Services"),
    ).toBe(true);
    const labels = food.map((category) => category.subCategory);
    expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b)));
  });

  it("returns an empty list for an unknown top category", () => {
    expect(taxonomy.listByTopCategory("Not A Real Top")).toEqual([]);
  });

  it("matches bakery and lawyer tags to curated categories", () => {
    expect(taxonomy.matchTags({ shop: "bakery" })?.id).toBe("bakeries");
    expect(taxonomy.matchTags({ office: "lawyer" })?.id).toBe("lawyers");
  });

  it("keeps ATMs out of the banks category after the split", () => {
    expect(taxonomy.matchTags({ amenity: "atm" })?.id).toBe("atms");
    expect(taxonomy.matchTags({ amenity: "bank" })?.id).toBe("banks");
  });
});
