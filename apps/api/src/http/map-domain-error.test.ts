import { describe, expect, it } from "vitest";
import { mapDomainError } from "./map-domain-error.js";
import { problem } from "./problem.js";

describe("mapDomainError", () => {
  it("passes through an attached problem", () => {
    const attached = problem(
      413,
      "Payload too large",
      "too big",
      "/payload-too-large",
    );
    expect(mapDomainError({ problem: attached })).toEqual(attached);
  });

  it("maps unknown category messages to 422", () => {
    const mapped = mapDomainError(new Error("Unknown category id: not-real"));
    expect(mapped.status).toBe(422);
    expect(mapped.type).toContain("/validation");
    expect(mapped.detail).toContain("Unknown category id");
  });

  it("maps spatial scope validation messages to 422", () => {
    const mapped = mapDomainError(
      new Error("Spatial scope requires an area or bounding box."),
    );
    expect(mapped.status).toBe(422);
    expect(mapped.type).toContain("/validation");
  });

  it("maps missing-filter messages to 422", () => {
    const mapped = mapDomainError(
      new Error(
        "Choose a category, brand, place name, or OSM tag before searching.",
      ),
    );
    expect(mapped.status).toBe(422);
  });

  it("maps timeout messages to 504", () => {
    const mapped = mapDomainError(
      new Error(
        "Query timed out after about 180s. Narrow the area or filters.",
      ),
    );
    expect(mapped.status).toBe(504);
    expect(mapped.type).toContain("/upstream-timeout");
  });

  it("maps Overpass reachability to 502 unavailable", () => {
    const mapped = mapDomainError(
      new Error("Could not reach the Overpass API. Try again."),
    );
    expect(mapped.status).toBe(502);
    expect(mapped.type).toContain("/upstream-unavailable");
  });

  it("maps unclassified upstream-style errors to 502 rejected", () => {
    const mapped = mapDomainError(
      new Error("Overpass rejected the query as invalid."),
    );
    expect(mapped.status).toBe(502);
    expect(mapped.type).toContain("/upstream-rejected");
  });
});
