import { describe, expect, it } from "vitest";
import { COUNTRY_OPTIONS } from "./countries.constants.js";

const CODE_PATTERN = /^[A-Z]{2}$/;

describe("COUNTRY_OPTIONS", () => {
  it("has at least 240 ISO alpha-2 entries", () => {
    expect(COUNTRY_OPTIONS.length).toBeGreaterThanOrEqual(240);
  });

  it("uses unique non-empty uppercase alpha-2 codes", () => {
    const codes = COUNTRY_OPTIONS.map((country) => country.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const country of COUNTRY_OPTIONS) {
      expect(country.code).toMatch(CODE_PATTERN);
      expect(country.name.trim()).not.toBe("");
    }
  });

  it("is sorted by English name", () => {
    const names = COUNTRY_OPTIONS.map((country) => country.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b, "en"));
    expect(names).toEqual(sorted);
  });

  it("includes prior curated countries and additional global codes", () => {
    const codes = new Set(COUNTRY_OPTIONS.map((country) => country.code));
    for (const code of [
      "US",
      "CA",
      "GB",
      "DE",
      "FR",
      "AU",
      "ZA",
      "KR",
      "SG",
      "AE",
    ]) {
      expect(codes.has(code)).toBe(true);
    }
  });
});
