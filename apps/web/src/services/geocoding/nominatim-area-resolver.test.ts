import { afterEach, describe, expect, it, vi } from "vitest";
import { NominatimAreaResolver } from "@/services/geocoding/nominatim-area-resolver";

const HTTP_503_ERROR = /Location search failed \(HTTP 503\)/;

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

describe("NominatimAreaResolver", () => {
  it("returns null when no geography parts are provided", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const resolver = new NominatimAreaResolver(
      "https://nominatim.example/search",
    );
    await expect(resolver.resolveAdmin({})).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps Nominatim JSON into a GeocodeResult", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        json: async () => [nominatimRow()],
        ok: true,
      })),
    );
    const resolver = new NominatimAreaResolver(
      "https://nominatim.example/search",
    );
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
    const resolver = new NominatimAreaResolver(
      "https://nominatim.example/search",
    );
    const result = await resolver.resolveAdmin({ city: "Seattle" });
    expect(result?.osmType).toBe("relation");
    expect(result?.osmId).toBe(2);
  });

  it("throws on non-OK HTTP responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 503,
      })),
    );
    const resolver = new NominatimAreaResolver(
      "https://nominatim.example/search",
    );
    await expect(resolver.resolveAdmin({ countryCode: "US" })).rejects.toThrow(
      HTTP_503_ERROR,
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
    const resolver = new NominatimAreaResolver(
      "https://nominatim.example/search",
    );
    const controller = new AbortController();
    const pending = resolver.resolveAdmin(
      { city: "Seattle" },
      controller.signal,
    );
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  });
});
