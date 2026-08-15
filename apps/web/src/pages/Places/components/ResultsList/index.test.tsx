import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PlacesContextValue } from "@/contexts/PlacesContext/index.types";
import { ResultsList } from "@/pages/Places/components/ResultsList";
import type { Place } from "@/types/places.types";

const PLACE_ROW_NAME = /Place \d+/;

vi.mock("@/contexts/PlacesContext", () => ({
  usePlaces: (): PlacesContextValue => mockValue,
  usePlacesSelection: (): PlacesContextValue => mockValue,
}));

let mockValue: PlacesContextValue;

function stubPlaces(partial: Partial<PlacesContextValue> = {}): void {
  mockValue = {
    boundsToFit: null,
    cancelSearch: vi.fn(),
    clearBoundsToFit: vi.fn(),
    criteria: {},
    error: null,
    fitResultsBounds: vi.fn(),
    loading: false,
    mapView: { lat: 0, lon: 0, zoom: 1 },
    places: [],
    runSearch: vi.fn(() => Promise.resolve()),
    selectedPlace: null,
    selectedPlaceId: null,
    selectPlace: vi.fn(),
    setCriteria: vi.fn(),
    setMapView: vi.fn(),
    truncated: false,
    ...partial,
  };
}

function makePlace(index: number): Place {
  return {
    brands: [],
    city: null,
    geometry: { polygons: [] },
    geometryType: "POINT",
    geometryWkt: "POINT(0 0)",
    id: `node/${index}`,
    isoCountryCode: null,
    latitude: 0,
    locationName: `Place ${index}`,
    longitude: 0,
    openHours: null,
    osmId: index,
    osmType: "node",
    phoneNumber: null,
    postalCode: null,
    region: null,
    streetAddress: null,
    subCategory: null,
    tags: {},
    topCategory: null,
    website: null,
  };
}

afterEach(() => {
  cleanup();
});

describe("ResultsList virtualization", () => {
  it("mounts only a window of rows for a large result set", () => {
    stubPlaces();
    const places = Array.from({ length: 200 }, (_, index) => makePlace(index));

    render(
      <div style={{ height: "400px" }}>
        <ResultsList
          onQueryChange={vi.fn()}
          places={places}
          query=""
          totalCount={200}
        />
      </div>,
    );

    const scrollParent = screen.getByLabelText("Search results");
    Object.defineProperty(scrollParent, "clientHeight", {
      configurable: true,
      value: 400,
    });
    fireEvent.scroll(scrollParent);

    const rows = screen.getAllByRole("button", { name: PLACE_ROW_NAME });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.length).toBeLessThan(places.length);
    expect(screen.getByRole("heading", { name: "200 places" })).toBeVisible();
  });

  it("shows filtered count in the title", () => {
    stubPlaces();
    const places = Array.from({ length: 5 }, (_, index) => makePlace(index));

    render(
      <ResultsList
        onQueryChange={vi.fn()}
        places={places}
        query="seattle"
        totalCount={200}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "5 of 200 places" }),
    ).toBeVisible();
  });
});
