import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PlacesContextValue } from "@/contexts/PlacesContext/index.types";
import { PlaceDetail } from "@/pages/Places/components/PlaceDetail";
import type { Place } from "@/types/places.types";

const JAVASCRIPT_SCHEME = /javascript/i;

const basePlace: Place = {
  brands: [],
  city: null,
  geometry: { polygons: [] },
  geometryType: "POINT",
  geometryWkt: "POINT (0 0)",
  id: "node/1",
  isoCountryCode: null,
  latitude: 1,
  locationName: "Cafe",
  longitude: 2,
  openHours: null,
  osmId: 1,
  osmType: "node",
  phoneNumber: "+1 (206) 555-0100",
  postalCode: null,
  region: null,
  streetAddress: null,
  subCategory: null,
  tags: {},
  topCategory: null,
  website: null,
};

vi.mock("@/contexts/PlacesContext", () => ({
  usePlaces: (): PlacesContextValue => mockValue,
  usePlacesSelection: (): PlacesContextValue => mockValue,
}));

let mockValue: PlacesContextValue;

function stubPlaces(partial: Partial<PlacesContextValue>): void {
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

describe("PlaceDetail", () => {
  it("rejects non-http website schemes and links safe http/tel/osm", () => {
    stubPlaces({
      selectedPlace: {
        ...basePlace,
        website: "javascript:alert(1)",
      },
      selectedPlaceId: basePlace.id,
    });
    const { rerender } = render(<PlaceDetail />);
    expect(screen.queryByRole("link", { name: JAVASCRIPT_SCHEME })).toBeNull();
    expect(screen.getByText("javascript:alert(1)")).toBeInTheDocument();

    stubPlaces({
      selectedPlace: {
        ...basePlace,
        website: "https://example.com",
      },
      selectedPlaceId: basePlace.id,
    });
    rerender(<PlaceDetail />);
    expect(
      screen.getByRole("link", { name: "https://example.com" }),
    ).toHaveAttribute("href", "https://example.com/");

    expect(
      screen.getByRole("link", { name: "+1 (206) 555-0100" }),
    ).toHaveAttribute("href", "tel:+12065550100");

    expect(screen.getByRole("link", { name: "node/1" })).toHaveAttribute(
      "href",
      "https://www.openstreetmap.org/node/1",
    );
  });
});
