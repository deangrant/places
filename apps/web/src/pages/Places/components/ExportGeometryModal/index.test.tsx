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
} from "@/services/http/http-places-api-client";
import type { Place } from "@/types/places.types";

const downloadPlacesCsv = vi.hoisted(() => vi.fn());
const EXPORT_BUTTON = /^export$/i;
const CANCEL_BUTTON = /^cancel$/i;

vi.mock(
  "@/services/export/places-csv-export-service",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("@/services/export/places-csv-export-service")
      >();
    return {
      ...actual,
      browserPlacesCsvDownloader: {
        download: downloadPlacesCsv,
      },
      downloadPlacesCsv,
    };
  },
);

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

/**
 * Resolves only when the provided abort signal fires.
 */
function hangUntilAborted(
  _criteria: unknown,
  _geometryType: unknown,
  signal?: AbortSignal,
): Promise<Place[]> {
  return new Promise((_resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("The operation was aborted.", "AbortError"));
      return;
    }
    signal?.addEventListener(
      "abort",
      () => {
        reject(new DOMException("The operation was aborted.", "AbortError"));
      },
      { once: true },
    );
  });
}

function renderModal(
  onClose = vi.fn(),
  onExported = vi.fn(),
): {
  onClose: ReturnType<typeof vi.fn>;
  onExported: ReturnType<typeof vi.fn>;
  placeExport: IPlaceGeometryExporter;
  unmount: () => void;
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
    placeExport,
    placeSearch,
    taxonomy: {
      getById: vi.fn(),
      list: vi.fn(() => []),
      listByTopCategory: vi.fn(() => []),
      listTopCategories: vi.fn(() => []),
    },
  };

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ServicesProvider services={services}>
        <PlacesProvider>{children}</PlacesProvider>
      </ServicesProvider>
    );
  }

  const view = render(
    <Wrapper>
      <ExportGeometryModal onClose={onClose} onExported={onExported} open />
    </Wrapper>,
  );

  return { onClose, onExported, placeExport, unmount: view.unmount };
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

  it("exports the last selected geometry type when switching tiles", async () => {
    const { onExported, placeExport } = renderModal();
    const polygonPlace: Place = {
      ...place,
      geometryType: "POLYGON",
      id: "way/1",
    };
    vi.mocked(placeExport.exportByGeometry).mockResolvedValueOnce([
      polygonPlace,
    ]);

    fireEvent.click(screen.getByRole("button", { name: "POINT" }));
    fireEvent.click(screen.getByRole("button", { name: "POLYGON" }));
    fireEvent.click(screen.getByRole("button", { name: EXPORT_BUTTON }));

    await waitFor(() => {
      expect(onExported).toHaveBeenCalledWith("POLYGON");
    });
    expect(placeExport.exportByGeometry).toHaveBeenCalledWith(
      {},
      "POLYGON",
      expect.any(AbortSignal),
      expect.any(Function),
    );
    expect(downloadPlacesCsv).toHaveBeenCalledWith([polygonPlace]);
  });

  it("shows an error and keeps the modal open when no places match", async () => {
    const { onClose, onExported, placeExport } = renderModal();
    vi.mocked(placeExport.exportByGeometry).mockResolvedValueOnce([]);

    fireEvent.click(screen.getByRole("button", { name: "POINT" }));
    fireEvent.click(screen.getByRole("button", { name: EXPORT_BUTTON }));

    await waitFor(() => {
      expect(
        screen.getByText(
          "No places matched this geometry. Try a different type.",
        ),
      ).toBeInTheDocument();
    });
    expect(downloadPlacesCsv).not.toHaveBeenCalled();
    expect(onExported).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "Export places" })).toBeVisible();
  });

  it("cancels an in-flight export from the overlay and restores the picker", async () => {
    const { onClose, onExported, placeExport } = renderModal();
    let capturedSignal: AbortSignal | undefined;
    vi.mocked(placeExport.exportByGeometry).mockImplementation(
      (_criteria, _geometryType, signal) => {
        capturedSignal = signal;
        return hangUntilAborted(_criteria, _geometryType, signal);
      },
    );

    fireEvent.click(screen.getByRole("button", { name: "POINT" }));
    fireEvent.click(screen.getByRole("button", { name: EXPORT_BUTTON }));

    await waitFor(() => {
      expect(
        screen.getByText("Preparing export. Please wait..."),
      ).toBeInTheDocument();
    });

    const cancelButtons = screen.getAllByRole("button", {
      name: CANCEL_BUTTON,
    });
    const overlayCancel = cancelButtons.find(
      (button) => !(button as HTMLButtonElement).disabled,
    );
    expect(overlayCancel).toBeDefined();
    fireEvent.click(overlayCancel as HTMLButtonElement);

    await waitFor(() => {
      expect(
        screen.getByRole("dialog", { name: "Export places" }),
      ).toBeVisible();
    });
    expect(capturedSignal?.aborted).toBe(true);
    expect(onClose).not.toHaveBeenCalled();
    expect(onExported).not.toHaveBeenCalled();
    expect(downloadPlacesCsv).not.toHaveBeenCalled();
    const exportButton = screen.getByRole("button", { name: EXPORT_BUTTON });
    expect(exportButton).toBeEnabled();
    exportButton.focus();
    expect(document.activeElement).toBe(exportButton);
  });

  it("aborts an in-flight export when the modal unmounts", async () => {
    const { placeExport, unmount } = renderModal();
    let capturedSignal: AbortSignal | undefined;
    vi.mocked(placeExport.exportByGeometry).mockImplementation(
      (_criteria, _geometryType, signal) => {
        capturedSignal = signal;
        return hangUntilAborted(_criteria, _geometryType, signal);
      },
    );

    fireEvent.click(screen.getByRole("button", { name: "POINT" }));
    fireEvent.click(screen.getByRole("button", { name: EXPORT_BUTTON }));

    await waitFor(() => {
      expect(
        screen.getByText("Preparing export. Please wait..."),
      ).toBeInTheDocument();
    });

    unmount();

    expect(capturedSignal?.aborted).toBe(true);
  });
});
