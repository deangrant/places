import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { PlacesProvider, usePlaces } from "@/contexts/PlacesContext";
import { ServicesProvider } from "@/contexts/ServicesContext";
import type { AppServices } from "@/services/app-services.types";
import type {
  IPlaceSearchService,
  PlaceGeometryUpdate,
} from "@/services/places/place-search-service";
import type { Place, PlaceSearchResult } from "@/types/places.types";

function makePlace(overrides: Partial<Place> & Pick<Place, "id">): Place {
  return {
    brands: [],
    city: null,
    geometry: { polygons: [] },
    geometryType: "POINT",
    geometryWkt: "POINT (0 0)",
    isoCountryCode: null,
    latitude: 1,
    locationName: "Place",
    longitude: 2,
    openHours: null,
    osmId: 1,
    osmType: "way",
    phoneNumber: null,
    postalCode: null,
    region: null,
    streetAddress: null,
    subCategory: null,
    tags: {},
    topCategory: null,
    website: null,
    ...overrides,
  };
}

function createWrapper(placeSearch: IPlaceSearchService) {
  const services: AppServices = {
    brandCatalog: { search: () => [] },
    placeSearch,
    taxonomy: {
      getById: () => undefined,
      list: () => [],
      matchTags: () => undefined,
    },
  };
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ServicesProvider services={services}>
        <PlacesProvider>{children}</PlacesProvider>
      </ServicesProvider>
    );
  };
}

describe("PlacesProvider", () => {
  it("ignores stale overlapping search results", async () => {
    let resolveFirst!: (value: PlaceSearchResult) => void;
    const first = new Promise<PlaceSearchResult>((resolve) => {
      resolveFirst = resolve;
    });

    const placeSearch: IPlaceSearchService = {
      fetchPlaceGeometry: vi.fn(() => Promise.resolve(null)),
      search: vi
        .fn()
        .mockImplementationOnce(() => first)
        .mockResolvedValueOnce({
          places: [makePlace({ id: "way/2", locationName: "Second" })],
          scope: {},
          truncated: false,
        }),
    };

    const { result } = renderHook(() => usePlaces(), {
      wrapper: createWrapper(placeSearch),
    });

    act(() => {
      result.current.setCriteria({ brand: "A", city: "X" });
    });

    let firstSearch!: Promise<void>;
    let secondSearch!: Promise<void>;
    act(() => {
      firstSearch = result.current.runSearch();
      secondSearch = result.current.runSearch();
    });

    await act(async () => {
      await secondSearch;
    });

    expect(result.current.places[0]?.id).toBe("way/2");

    await act(async () => {
      resolveFirst({
        places: [makePlace({ id: "way/1", locationName: "First" })],
        scope: {},
        truncated: false,
      });
      await firstSearch;
    });

    expect(result.current.places[0]?.id).toBe("way/2");
  });

  it("surfaces geometry hydration failures", async () => {
    const place = makePlace({ id: "way/9", osmId: 9, osmType: "way" });
    const placeSearch: IPlaceSearchService = {
      fetchPlaceGeometry: vi.fn(() =>
        Promise.reject(new Error("footprint failed")),
      ),
      search: vi.fn(() =>
        Promise.resolve({
          places: [place],
          scope: {},
          truncated: false,
        }),
      ),
    };

    const { result } = renderHook(() => usePlaces(), {
      wrapper: createWrapper(placeSearch),
    });

    await act(async () => {
      await result.current.runSearch();
    });

    act(() => {
      result.current.selectPlace("way/9");
    });

    await waitFor(() => {
      expect(result.current.error).toBe("footprint failed");
    });
    expect(result.current.geometryLoading).toBe(false);
  });

  it("clears truncated on search failure", async () => {
    const placeSearch: IPlaceSearchService = {
      fetchPlaceGeometry: vi.fn(() => Promise.resolve(null)),
      search: vi
        .fn()
        .mockResolvedValueOnce({
          places: [makePlace({ id: "way/1" })],
          scope: {},
          truncated: true,
        })
        .mockRejectedValueOnce(new Error("boom")),
    };

    const { result } = renderHook(() => usePlaces(), {
      wrapper: createWrapper(placeSearch),
    });

    await act(async () => {
      await result.current.runSearch();
    });
    expect(result.current.truncated).toBe(true);

    await act(async () => {
      await result.current.runSearch();
    });
    expect(result.current.truncated).toBe(false);
    expect(result.current.places).toEqual([]);
    expect(result.current.error).toBe("boom");
  });

  it("ignores stale geometry updates after a newer selection", async () => {
    let resolveSlow!: (value: PlaceGeometryUpdate) => void;
    const slow = new Promise<PlaceGeometryUpdate>((resolve) => {
      resolveSlow = resolve;
    });

    const places = [
      makePlace({ id: "way/1", osmId: 1 }),
      makePlace({ id: "way/2", latitude: 3, longitude: 4, osmId: 2 }),
    ];

    const placeSearch: IPlaceSearchService = {
      fetchPlaceGeometry: vi
        .fn()
        .mockImplementationOnce(() => slow)
        .mockResolvedValueOnce({
          geometry: {
            polygons: [
              [
                [
                  { lat: 0, lon: 0 },
                  { lat: 0, lon: 1 },
                  { lat: 1, lon: 1 },
                  { lat: 0, lon: 0 },
                ],
              ],
            ],
          },
          geometryType: "POLYGON",
          geometryWkt: "POLYGON ((0 0, 1 0, 1 1, 0 0))",
          latitude: 3,
          longitude: 4,
        }),
      search: vi.fn(() =>
        Promise.resolve({ places, scope: {}, truncated: false }),
      ),
    };

    const { result } = renderHook(() => usePlaces(), {
      wrapper: createWrapper(placeSearch),
    });

    await act(async () => {
      await result.current.runSearch();
    });

    act(() => {
      result.current.selectPlace("way/1");
      result.current.selectPlace("way/2");
    });

    await waitFor(() => {
      expect(result.current.selectedPlaceId).toBe("way/2");
      expect(result.current.geometryLoading).toBe(false);
    });

    await act(async () => {
      resolveSlow({
        geometry: {
          polygons: [
            [
              [
                { lat: 9, lon: 9 },
                { lat: 9, lon: 10 },
                { lat: 9, lon: 9 },
              ],
            ],
          ],
        },
        geometryType: "POLYGON",
        geometryWkt: "stale",
        latitude: 99,
        longitude: 99,
      });
      await Promise.resolve();
    });

    expect(result.current.places.find((p) => p.id === "way/1")?.latitude).toBe(
      1,
    );
    expect(
      result.current.places.find((p) => p.id === "way/2")?.geometryType,
    ).toBe("POLYGON");
  });
});
