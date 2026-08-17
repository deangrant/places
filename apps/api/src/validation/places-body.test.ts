import { describe, expect, it } from "vitest";
import {
  validatePlaceExportBody,
  validatePlaceSearchCriteria,
} from "./places-body.js";

describe("validatePlaceSearchCriteria", () => {
  it("accepts a known categoryId", () => {
    const result = validatePlaceSearchCriteria({
      categoryId: "coffee-shops",
      countryCode: "us",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.categoryId).toBe("coffee-shops");
      expect(result.value.countryCode).toBe("US");
    }
  });

  it("rejects an unknown categoryId with a field error", () => {
    const result = validatePlaceSearchCriteria({
      categoryId: "not-a-real-category",
      countryCode: "us",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.problem.status).toBe(422);
      expect(result.problem.type).toContain("/validation");
      expect(result.problem.errors?.categoryId[0]).toContain(
        "unknown category id",
      );
    }
  });

  it("rejects unsupported OSM tag keys", () => {
    const result = validatePlaceSearchCriteria({
      countryCode: "us",
      osmTagKey: "not-a-real-key",
      osmTagValue: "x",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.problem.errors?.osmTagKey[0]).toContain(
        "unsupported OSM tag key",
      );
    }
  });

  it("omits empty and whitespace-only optional strings", () => {
    const result = validatePlaceSearchCriteria({
      brand: "",
      city: "  ",
      countryCode: "us",
      nameContains: "\t",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ countryCode: "US" });
      expect(result.value).not.toHaveProperty("brand");
      expect(result.value).not.toHaveProperty("city");
      expect(result.value).not.toHaveProperty("nameContains");
    }
  });

  it("rejects free-text fields longer than 200 characters", () => {
    const result = validatePlaceSearchCriteria({
      countryCode: "us",
      nameContains: "a".repeat(201),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.problem.status).toBe(422);
      expect(result.problem.errors?.nameContains[0]).toBe(
        "must be at most 200 characters",
      );
    }
  });

  it("rejects id fields longer than 64 characters", () => {
    const result = validatePlaceSearchCriteria({
      categoryId: "a".repeat(65),
      countryCode: "us",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.problem.errors?.categoryId[0]).toBe(
        "must be at most 64 characters",
      );
    }
  });

  it.each([
    {
      body: { countryCode: "us", unexpected: true },
      field: "unexpected",
      message: "is not an allowed property",
      name: "unknown top-level key",
    },
    {
      body: { categoryId: "coffee-shops", countryCode: "USA" },
      field: "countryCode",
      message: "must be a 2-letter ISO country code",
      name: "non-ISO country code",
    },
    {
      body: { countryCode: "1" },
      field: "countryCode",
      message: "must be a 2-letter ISO country code",
      name: "too-short country code",
    },
  ])("rejects $name", ({ body, field, message }) => {
    const result = validatePlaceSearchCriteria(body);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.problem.status).toBe(422);
      expect(result.problem.errors?.[field]?.[0]).toBe(message);
    }
  });
});

describe("validatePlaceExportBody", () => {
  it("rejects unknown categoryId nested under criteria", () => {
    const result = validatePlaceExportBody({
      criteria: {
        categoryId: "not-a-real-category",
        countryCode: "us",
      },
      geometryType: "POINT",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.problem.status).toBe(422);
      expect(result.problem.errors?.categoryId[0]).toContain(
        "unknown category id",
      );
    }
  });

  it.each([
    {
      body: {
        criteria: { countryCode: "us" },
        extra: 1,
        geometryType: "POINT",
      },
      field: "extra",
      message: "is not an allowed property",
      name: "unknown top-level key",
    },
    {
      body: {
        criteria: { countryCode: "us", unexpected: true },
        geometryType: "POINT",
      },
      field: "unexpected",
      message: "is not an allowed property",
      name: "unknown nested criteria key",
    },
    {
      body: {
        criteria: { countryCode: "us" },
        geometryType: "LINESTRING",
      },
      field: "geometryType",
      message: "must be POINT, POLYGON, or MULTIPOLYGON",
      name: "invalid geometryType enum",
    },
  ])("rejects $name", ({ body, field, message }) => {
    const result = validatePlaceExportBody(body);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.problem.status).toBe(422);
      expect(result.problem.errors?.[field]?.[0]).toBe(message);
    }
  });

  it("defaults includeRetailArea to false when omitted", () => {
    const result = validatePlaceExportBody({
      criteria: { brand: "Starbucks", countryCode: "us" },
      geometryType: "POLYGON",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.includeRetailArea).toBe(false);
    }
  });

  it("accepts includeRetailArea true", () => {
    const result = validatePlaceExportBody({
      criteria: { brand: "Starbucks", countryCode: "us" },
      geometryType: "MULTIPOLYGON",
      includeRetailArea: true,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.includeRetailArea).toBe(true);
    }
  });

  it("rejects non-boolean includeRetailArea", () => {
    const result = validatePlaceExportBody({
      criteria: { brand: "Starbucks", countryCode: "us" },
      geometryType: "POLYGON",
      includeRetailArea: "yes",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.problem.errors.includeRetailArea[0]).toBe(
        "must be a boolean",
      );
    }
  });
});
