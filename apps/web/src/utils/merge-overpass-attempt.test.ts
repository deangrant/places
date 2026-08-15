import type { OverpassAttemptEvent } from "places-core";
import { describe, expect, it } from "vitest";
import { mergeOverpassAttempt } from "@/utils/merge-overpass-attempt";

describe("mergeOverpassAttempt", () => {
  it("merges attempt events by index", () => {
    const started: OverpassAttemptEvent = {
      endpoint: "https://a.example/api/interpreter",
      hostname: "a.example",
      index: 0,
      status: "started",
    };
    const failed: OverpassAttemptEvent = {
      ...started,
      status: "failed",
    };
    expect(mergeOverpassAttempt([started], failed)).toEqual([failed]);
  });
});
