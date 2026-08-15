import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isFiniteBBox,
  NominatimAreaResolver,
  tryMapNominatimRow,
} from "./nominatim-area-resolver-service.js";

const HTTP_503_ERROR = /Location search failed \(HTTP 503\)/;
const HTTP_403_ERROR = /Location search was blocked by Nominatim \(HTTP 403\)/;

const TEST_CONTACT = {
  email: "places-test@example.com",
  userAgent: "PlacesAPI/1.0 (test)",
} as const;

const TEST_ENDPOINT = "https://nominatim.example/search";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function nominatimRow(
  partial: Partial<{
    address: { country_code?: string };
    boundingbox: [string, string, string, string];
    class: string;
    display_name: string;
    lat: string;
    lon: string;
    osm_id: number;
    osm_type: string;
    type: string;
  }> = {},
) {
  return {
    address: { country_code: "us" },
    boundingbox: ["47.4", "47.8", "-122.5", "-122.1"] as [
      string,
      string,
      string,
      string,
    ],
    class: "boundary",
    display_name: "Seattle, Washington, USA",
    lat: "47.6",
    lon: "-122.3",
    osm_id: 100,
    osm_type: "relation",
    type: "administrative",
    ...partial,
  };
}

describe("tryMapNominatimRow", () => {
  it("maps a valid Nominatim row", () => {
    expect(tryMapNominatimRow(nominatimRow())).toEqual({
      boundingBox: {
        east: -122.1,
        north: 47.8,
        south: 47.4,
        west: -122.5,
      },
      class: "boundary",
      countryCode: "US",
      displayName: "Seattle, Washington, USA",
      lat: 47.6,
      lon: -122.3,
      osmId: 100,
      osmType: "relation",
      type: "administrative",
    });
  });

  it("rejects non-numeric coordinates", () => {
    expect(
      tryMapNominatimRow(nominatimRow({ lat: "not-a-number", lon: "-122.3" })),
    ).toBeNull();
  });

  it("rejects malformed bounding boxes", () => {
    expect(
      tryMapNominatimRow(
        nominatimRow({
          boundingbox: ["a", "b", "c", "d"] as unknown as [
            string,
            string,
            string,
            string,
          ],
        }),
      ),
    ).toBeNull();
    expect(
      tryMapNominatimRow(
        nominatimRow({
          boundingbox: ["48", "47", "-122", "-121"] as [
            string,
            string,
            string,
            string,
          ],
        }),
      ),
    ).toBeNull();
  });

  it("rejects unknown osm types", () => {
    expect(tryMapNominatimRow(nominatimRow({ osm_type: "other" }))).toBeNull();
  });
});

describe("isFiniteBBox", () => {
  it("rejects NaN corners", () => {
    expect(
      isFiniteBBox({ east: 1, north: 2, south: 0, west: Number.NaN }),
    ).toBe(false);
  });
});

describe("NominatimAreaResolver", () => {
  it("returns null when no geography parts are provided", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const resolver = new NominatimAreaResolver(TEST_CONTACT, TEST_ENDPOINT);
    await expect(resolver.resolveAdmin({})).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("requests limit=5 and countrycodes when a country is set", async () => {
    const fetchMock = vi.fn((input: string | URL) => {
      const url = new URL(String(input));
      expect(url.searchParams.get("limit")).toBe("5");
      expect(url.searchParams.get("countrycodes")).toBe("us");
      expect(url.searchParams.get("country")).toBe("US");
      return Promise.resolve({
        json: () => Promise.resolve([nominatimRow()]),
        ok: true,
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    const resolver = new NominatimAreaResolver(TEST_CONTACT, TEST_ENDPOINT);
    await resolver.resolveAdmin({ city: "Seattle", countryCode: "US" });
    expect(fetchMock).toHaveBeenCalled();
  });

  it("maps Nominatim JSON into a GeocodeResult", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        json: async () => [nominatimRow()],
        ok: true,
      })),
    );
    const resolver = new NominatimAreaResolver(TEST_CONTACT, TEST_ENDPOINT);
    const result = await resolver.resolveAdmin({
      city: "Seattle",
      countryCode: "US",
    });
    expect(result).toEqual({
      boundingBox: {
        east: -122.1,
        north: 47.8,
        south: 47.4,
        west: -122.5,
      },
      class: "boundary",
      countryCode: "US",
      displayName: "Seattle, Washington, USA",
      lat: 47.6,
      lon: -122.3,
      osmId: 100,
      osmType: "relation",
      type: "administrative",
    });
  });

  it("prefers relation or way results over node", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        json: async () => [
          nominatimRow({ osm_id: 1, osm_type: "node" }),
          nominatimRow({ osm_id: 2, osm_type: "relation" }),
        ],
        ok: true,
      })),
    );
    const resolver = new NominatimAreaResolver(TEST_CONTACT, TEST_ENDPOINT);
    const result = await resolver.resolveAdmin({ city: "Seattle" });
    expect(result?.osmType).toBe("relation");
    expect(result?.osmId).toBe(2);
  });

  it("returns null when JSON is not an array", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        json: async () => ({ error: "boom" }),
        ok: true,
      })),
    );
    const resolver = new NominatimAreaResolver(TEST_CONTACT, TEST_ENDPOINT);
    await expect(
      resolver.resolveAdmin({ city: "Seattle" }),
    ).resolves.toBeNull();
  });

  it("skips invalid rows and returns null when none remain", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        json: async () => [
          nominatimRow({ lat: "NaN", lon: "NaN" }),
          nominatimRow({
            boundingbox: ["x", "y", "z", "w"] as unknown as [
              string,
              string,
              string,
              string,
            ],
          }),
        ],
        ok: true,
      })),
    );
    const resolver = new NominatimAreaResolver(TEST_CONTACT, TEST_ENDPOINT);
    await expect(
      resolver.resolveAdmin({ city: "Seattle" }),
    ).resolves.toBeNull();
  });

  it("throws on non-OK HTTP responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 503,
      })),
    );
    const resolver = new NominatimAreaResolver(TEST_CONTACT, TEST_ENDPOINT);
    await expect(resolver.resolveAdmin({ countryCode: "US" })).rejects.toThrow(
      HTTP_503_ERROR,
    );
  });

  it("throws a blocked-identity message on HTTP 403", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 403,
      })),
    );
    const resolver = new NominatimAreaResolver(TEST_CONTACT, TEST_ENDPOINT);
    await expect(resolver.resolveAdmin({ countryCode: "US" })).rejects.toThrow(
      HTTP_403_ERROR,
    );
  });

  it("surfaces abort errors from fetch", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url, init?: RequestInit) =>
          new Promise((_resolve, reject) => {
            const signal = init?.signal;
            if (signal?.aborted) {
              reject(
                new DOMException("The operation was aborted.", "AbortError"),
              );
              return;
            }
            signal?.addEventListener(
              "abort",
              () => {
                reject(
                  new DOMException("The operation was aborted.", "AbortError"),
                );
              },
              { once: true },
            );
          }),
      ),
    );
    const resolver = new NominatimAreaResolver(TEST_CONTACT, TEST_ENDPOINT);
    const controller = new AbortController();
    const pending = resolver.resolveAdmin(
      { city: "Seattle" },
      controller.signal,
    );
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  });
});
