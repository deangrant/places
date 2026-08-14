import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { PlacesProvider, usePlaces } from "@/contexts/PlacesContext";
import { ServicesProvider } from "@/contexts/ServicesContext";
import type { AppServices } from "@/services/app-services.types";
import type {
  IPlaceGeometryExporter,
  IPlaceSearchService,
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
  const placeExport: IPlaceGeometryExporter = {
    exportByGeometry: vi.fn(() => Promise.resolve([])),
  };
  const services: AppServices = {
    brandCatalog: { search: () => [] },
    placeExport,
    placeSearch,
    taxonomy: {
      getById: () => undefined,
      list: () => [],
      listByTopCategory: () => [],
      listTopCategories: () => [],
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

  it("selects a search result without fetching footprints", async () => {
    const place = makePlace({ id: "way/9", osmId: 9, osmType: "way" });
    const placeSearch: IPlaceSearchService = {
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

    expect(result.current.selectedPlaceId).toBe("way/9");
    expect(result.current.error).toBeNull();
  });

  it("clears truncated on search failure", async () => {
    const placeSearch: IPlaceSearchService = {
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
});
