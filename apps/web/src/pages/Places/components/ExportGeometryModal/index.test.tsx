import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlacesProvider } from "@/contexts/PlacesContext";
import { ServicesProvider } from "@/contexts/ServicesContext";
import { ExportGeometryModal } from "@/pages/Places/components/ExportGeometryModal";
import type { AppServices } from "@/services/app-services.types";
import type {
  IPlaceGeometryExporter,
  IPlaceSearchService,
} from "@/services/places/place-search-service";
import type { Place } from "@/types/places.types";

const downloadPlacesCsv = vi.hoisted(() => vi.fn());
const EXPORT_BUTTON = /^export$/i;

vi.mock("@/services/export/places-csv-export", () => ({
  downloadPlacesCsv,
}));

afterEach(() => {
  cleanup();
  downloadPlacesCsv.mockClear();
});

const place: Place = {
  brands: [],
  city: null,
  geometry: { polygons: [] },
  geometryType: "POINT",
  geometryWkt: "POINT(0 0)",
  id: "node/1",
  isoCountryCode: null,
  latitude: 0,
  locationName: "Cafe",
  longitude: 0,
  openHours: null,
  osmId: 1,
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

function renderModal(
  onClose = vi.fn(),
  onExported = vi.fn(),
): {
  onClose: ReturnType<typeof vi.fn>;
  onExported: ReturnType<typeof vi.fn>;
  placeExport: IPlaceGeometryExporter;
} {
  const placeExport: IPlaceGeometryExporter = {
    exportByGeometry: vi.fn(() => Promise.resolve([place])),
  };
  const placeSearch: IPlaceSearchService = {
    search: vi.fn(() =>
      Promise.resolve({ places: [], scope: {}, truncated: false }),
    ),
  };

  const services: AppServices = {
    brandCatalog: { search: vi.fn(() => []) },
    placeExport,
    placeSearch,
    taxonomy: {
      getById: vi.fn(),
      list: vi.fn(() => []),
      listByTopCategory: vi.fn(() => []),
      listTopCategories: vi.fn(() => []),
      matchTags: vi.fn(),
    },
  };

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ServicesProvider services={services}>
        <PlacesProvider>{children}</PlacesProvider>
      </ServicesProvider>
    );
  }

  render(
    <Wrapper>
      <ExportGeometryModal onClose={onClose} onExported={onExported} open />
    </Wrapper>,
  );

  return { onClose, onExported, placeExport };
}

describe("ExportGeometryModal", () => {
  it("exports POINT via criteria requery without batch geometry fetch", async () => {
    const { onClose, onExported, placeExport } = renderModal();

    fireEvent.click(screen.getByRole("button", { name: "POINT" }));
    fireEvent.click(screen.getByRole("button", { name: EXPORT_BUTTON }));

    await waitFor(() => {
      expect(downloadPlacesCsv).toHaveBeenCalledWith([place]);
    });
    expect(placeExport.exportByGeometry).toHaveBeenCalledWith(
      {},
      "POINT",
      expect.any(AbortSignal),
      expect.any(Function),
    );
    expect(onExported).toHaveBeenCalledWith("POINT");
    expect(onClose).toHaveBeenCalled();
  });

  it("resolves MULTIPOLYGON when all tiles are selected", async () => {
    const { onExported, placeExport } = renderModal();
    vi.mocked(placeExport.exportByGeometry).mockResolvedValueOnce([]);

    fireEvent.click(screen.getByRole("button", { name: "POINT" }));
    fireEvent.click(screen.getByRole("button", { name: "POLYGON" }));
    fireEvent.click(screen.getByRole("button", { name: "MULTIPOLYGON" }));
    fireEvent.click(screen.getByRole("button", { name: EXPORT_BUTTON }));

    await waitFor(() => {
      expect(onExported).toHaveBeenCalledWith("MULTIPOLYGON");
    });
    expect(placeExport.exportByGeometry).toHaveBeenCalledWith(
      {},
      "MULTIPOLYGON",
      expect.any(AbortSignal),
      expect.any(Function),
    );
    expect(downloadPlacesCsv).toHaveBeenCalledWith([]);
  });
});
