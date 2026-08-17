import { describe, expect, it } from "vitest";
import {
  isAllowedOsmTagKey,
  OSM_TAG_KEY_ALLOWLIST,
} from "./osm-tags.constants.js";

/** Expected allowlist: OSM top-level keys minus boundary and route, A–Z. */
const EXPECTED_ALLOWLIST = [
  "advertising",
  "aerialway",
  "aeroway",
  "amenity",
  "barrier",
  "building",
  "club",
  "craft",
  "departures_board",
  "education",
  "emergency",
  "geological",
  "healthcare",
  "highway",
  "historic",
  "landcover",
  "landuse",
  "leisure",
  "man_made",
  "military",
  "natural",
  "office",
  "piste:type",
  "place",
  "power",
  "public_transport",
  "railway",
  "shop",
  "telecom",
  "tourism",
  "waterway",
] as const;

describe("OSM_TAG_KEY_ALLOWLIST", () => {
  it("matches the curated top-level key set in A–Z order", () => {
    expect(OSM_TAG_KEY_ALLOWLIST).toEqual(EXPECTED_ALLOWLIST);
    const sorted = [...OSM_TAG_KEY_ALLOWLIST].sort((a, b) =>
      a.localeCompare(b, "en"),
    );
    expect([...OSM_TAG_KEY_ALLOWLIST]).toEqual(sorted);
  });

  it("includes keys used by CATEGORY_DEFINITIONS", () => {
    for (const key of [
      "aeroway",
      "amenity",
      "craft",
      "healthcare",
      "highway",
      "historic",
      "landuse",
      "leisure",
      "natural",
      "office",
      "public_transport",
      "railway",
      "shop",
      "tourism",
    ]) {
      expect(isAllowedOsmTagKey(key)).toBe(true);
    }
  });
});

describe("isAllowedOsmTagKey", () => {
  it("rejects boundary, route, and unknown keys", () => {
    expect(isAllowedOsmTagKey("boundary")).toBe(false);
    expect(isAllowedOsmTagKey("route")).toBe(false);
    expect(isAllowedOsmTagKey("not-a-real-key")).toBe(false);
    expect(isAllowedOsmTagKey("cuisine")).toBe(false);
  });
});
