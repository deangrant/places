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
      expect(result.problem.errors?.categoryId?.[0]).toContain(
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
      expect(result.problem.errors?.osmTagKey?.[0]).toContain(
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
      expect(result.problem.errors?.nameContains?.[0]).toBe(
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
      expect(result.problem.errors?.categoryId?.[0]).toBe(
        "must be at most 64 characters",
      );
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
      expect(result.problem.errors?.categoryId?.[0]).toContain(
        "unknown category id",
      );
    }
  });
});
