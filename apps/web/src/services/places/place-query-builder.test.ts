import { describe, expect, it } from "vitest";
import {
  PlaceQueryBuilder,
  toOverpassAreaId,
} from "@/services/places/place-query-builder";
import type { ICategoryLookup } from "@/services/taxonomy/category-taxonomy";
import type { CategoryDefinition } from "@/types/places.types";

const NODE_TYPE_ERROR = /relation or way/i;
const MISSING_SCOPE_ERROR = /area or bounding box/i;

const coffee: CategoryDefinition = {
  id: "coffee-shops",
  subCategory: "Coffee Shops",
  tags: [
    { key: "amenity", value: "cafe" },
    { key: "amenity", value: 'cof"fee' },
  ],
  topCategory: "Food Services",
};

const weirdKeys: CategoryDefinition = {
  id: "weird-keys",
  subCategory: "Weird Keys",
  tags: [
    { key: 'foo"bar', value: "baz" },
    { key: "a\\b", value: "c" },
  ],
  topCategory: "Test",
};

const taxonomy: ICategoryLookup = {
  getById: (id) => {
    if (id === coffee.id) {
      return coffee;
    }
    if (id === weirdKeys.id) {
      return weirdKeys;
    }
  },
  list: () => [coffee, weirdKeys],
  listByTopCategory: (topCategory) =>
    [coffee, weirdKeys].filter(
      (category) => category.topCategory === topCategory,
    ),
  listTopCategories: () => [coffee.topCategory, weirdKeys.topCategory],
};

describe("toOverpassAreaId", () => {
  it("offsets relation and way ids", () => {
    expect(toOverpassAreaId("relation", 123)).toBe(3_600_000_123);
    expect(toOverpassAreaId("R", 1)).toBe(3_600_000_001);
    expect(toOverpassAreaId("way", 10)).toBe(2_400_000_010);
    expect(toOverpassAreaId("W", 2)).toBe(2_400_000_002);
  });

  it("rejects node types", () => {
    expect(() => toOverpassAreaId("node", 1)).toThrow(NODE_TYPE_ERROR);
  });
});

describe("PlaceQueryBuilder", () => {
  const builder = new PlaceQueryBuilder(taxonomy);

  it("emits area preamble and searchArea filter for area-id scope", () => {
    const ql = builder.build(
      { brand: "Starbucks", categoryId: "coffee-shops" },
      { areaId: 3_600_000_001 },
    );
    expect(ql).toContain("area(3600000001)->.searchArea;");
    expect(ql).toContain("(area.searchArea)");
    expect(ql).not.toContain("undefined");
  });

  it("uses bbox when areaId is omitted", () => {
    const ql = builder.build(
      { nameContains: "cafe" },
      { bbox: { east: 1, north: 2, south: 0, west: -1 } },
    );
    expect(ql).not.toContain("area(");
    expect(ql).toContain("(0,-1,2,1)");
  });

  it("throws when spatial scope has neither area nor bbox", () => {
    expect(() => builder.build({ brand: "X" }, {})).toThrow(
      MISSING_SCOPE_ERROR,
    );
  });

  it("escapes Overpass string and regex metacharacters", () => {
    const ql = builder.build(
      {
        brand: "A.B*C?",
        categoryId: "coffee-shops",
        nameContains: "foo.bar",
      },
      { areaId: 1 },
    );
    expect(ql).toContain('["brand"~"^A\\.B\\*C\\?$",i]');
    expect(ql).toContain('["name"~"foo\\.bar",i]');
    expect(ql).toContain('nwr["amenity"="cof\\"fee"]');
  });

  it("escapes taxonomy and OSM tag keys inside Overpass string literals", () => {
    const categoryQl = builder.build(
      { categoryId: "weird-keys" },
      { areaId: 1 },
    );
    expect(categoryQl).toContain('nwr["foo\\"bar"="baz"]');
    expect(categoryQl).toContain('nwr["a\\\\b"="c"]');

    const osmQl = builder.build(
      { osmTagKey: "amenity", osmTagValue: 'x"y' },
      { areaId: 1 },
    );
    expect(osmQl).toContain('nwr["amenity"="x\\"y"]');
  });

  it("emits out center by default and out geom when requested", () => {
    const centerQl = builder.build(
      { brand: "Starbucks" },
      { areaId: 3_600_000_001 },
    );
    expect(centerQl).toContain("out center 2500;");
    expect(centerQl).not.toContain("out geom");

    const geomQl = builder.build(
      { brand: "Starbucks" },
      { areaId: 3_600_000_001 },
      "geom",
    );
    expect(geomQl).toContain("out geom 2500;");
    expect(geomQl).not.toContain("out center");
  });
});
