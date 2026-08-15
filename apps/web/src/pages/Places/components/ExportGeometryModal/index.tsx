import type { MouseEvent } from "react";
import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/core/Button";
import { Modal } from "@/components/core/Modal";
import { Spinner } from "@/components/core/Spinner";
import { usePlacesSearch } from "@/contexts/PlacesContext";
import { useServices } from "@/contexts/ServicesContext";
import { OverpassQueryStatus } from "@/pages/Places/components/OverpassQueryStatus";
import { EXPORT_GEOMETRY_TYPE_PRIORITY } from "@/services/export/export-places-by-geometry-service";
import { browserPlacesCsvDownloader } from "@/services/export/places-csv-export-service";
import type { PlaceGeometryType } from "@/types/places.types";
import { formatCountdown } from "@/utils/format-countdown";
import styles from "./index.module.css";
import type {
  ExportGeometryModalProps,
  PlaceExportFormat,
} from "./index.types";
import { useExportPlacesByGeometry } from "./use-export-places-by-geometry";

const GEOMETRY_LABELS: Record<PlaceGeometryType, string> = {
  MULTIPOLYGON: "Multipolygon",
  POINT: "Point",
  POLYGON: "Polygon",
};

const GEOMETRY_HINTS: Record<PlaceGeometryType, string> = {
  MULTIPOLYGON: "Complex footprints with multiple outer rings",
  POINT: "Place centroids",
  POLYGON: "Building and area footprints",
};

const EXPORT_FORMATS = ["WKT"] as const satisfies readonly PlaceExportFormat[];

const FORMAT_LABELS: Record<PlaceExportFormat, string> = {
  WKT: "WKT",
};

const FORMAT_HINTS: Record<PlaceExportFormat, string> = {
  WKT: "Well-Known Text — standard text geometry for GIS and spatial tools",
};

const DEFAULT_FORMAT_SELECTION: PlaceExportFormat[] = ["WKT"];

/** Renders the geometry and format picker for a Places CSV export. */
export function ExportGeometryModal({
  open,
  onClose,
  onExported,
}: ExportGeometryModalProps) {
  const { criteria } = usePlacesSearch();
  const { placeExport } = useServices();
  const [selectedGeometry, setSelectedGeometry] =
    useState<PlaceGeometryType | null>(null);
  const [selectedFormats, setSelectedFormats] = useState<PlaceExportFormat[]>(
    DEFAULT_FORMAT_SELECTION,
  );
  const {
    canExport,
    cancelExport,
    error,
    exporting,
    handleExport,
    overpassAttempts,
    remainingSeconds,
  } = useExportPlacesByGeometry({
    criteria,
    csvDownloader: browserPlacesCsvDownloader,
    onClose,
    onExported,
    placeExport,
  });

  const selectGeometry = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    const type = event.currentTarget.dataset.geometryType;
    if (type !== "POINT" && type !== "POLYGON" && type !== "MULTIPOLYGON") {
      return;
    }
    setSelectedGeometry(type);
  }, []);

  const toggleFormat = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    const format = event.currentTarget.dataset.exportFormat;
    if (format !== "WKT") {
      return;
    }
    setSelectedFormats((prev) => {
      if (prev.includes(format)) {
        // Sole available format stays selected until more options ship.
        if (EXPORT_FORMATS.length === 1) {
          return prev;
        }
        return prev.filter((entry) => entry !== format);
      }
      return [...prev, format];
    });
  }, []);

  const exportEnabled =
    canExport(selectedGeometry) && selectedFormats.length > 0;

  const onExportClick = useCallback(() => {
    if (!selectedGeometry) {
      return;
    }
    handleExport(selectedGeometry);
  }, [handleExport, selectedGeometry]);

  return (
    <>
      <Modal
        closeOnBackdrop={false}
        closeOnEscape={false}
        onClose={onClose}
        open={open && !exporting}
        showCloseButton={false}
        title="Export places"
      >
        <p className={styles.hint}>
          Choose one geometry type and a format for your CSV. Only the selected
          geometry type is exported.
        </p>

        <fieldset className={styles.tiles}>
          <legend className={styles.legend}>Geometry</legend>
          {EXPORT_GEOMETRY_TYPE_PRIORITY.map((type) => {
            const isSelected = selectedGeometry === type;
            return (
              <button
                aria-label={type}
                aria-pressed={isSelected}
                className={[styles.tile, isSelected ? styles.tileSelected : ""]
                  .filter(Boolean)
                  .join(" ")}
                data-geometry-type={type}
                disabled={exporting}
                key={type}
                onClick={selectGeometry}
                type="button"
              >
                <span className={styles.tileLabel}>
                  {GEOMETRY_LABELS[type]}
                </span>
                <span className={styles.tileHint}>{GEOMETRY_HINTS[type]}</span>
              </button>
            );
          })}
        </fieldset>

        <fieldset className={styles.tiles}>
          <legend className={styles.legend}>Format</legend>
          {EXPORT_FORMATS.map((format) => {
            const isSelected = selectedFormats.includes(format);
            const formatLocked = EXPORT_FORMATS.length === 1 && isSelected;
            return (
              <button
                aria-disabled={formatLocked || undefined}
                aria-label={format}
                aria-pressed={isSelected}
                className={[styles.tile, isSelected ? styles.tileSelected : ""]
                  .filter(Boolean)
                  .join(" ")}
                data-export-format={format}
                disabled={exporting}
                key={format}
                onClick={toggleFormat}
                title={
                  formatLocked
                    ? "Required while WKT is the only available format"
                    : undefined
                }
                type="button"
              >
                <span className={styles.tileLabel}>
                  {FORMAT_LABELS[format]}
                </span>
                <span className={styles.tileHint}>{FORMAT_HINTS[format]}</span>
              </button>
            );
          })}
        </fieldset>

        {error ? <p className={styles.error}>{error}</p> : null}

        <div className={styles.actions}>
          <Button disabled={exporting} onClick={onClose} variant="ghost">
            Cancel
          </Button>
          <Button
            disabled={!exportEnabled}
            onClick={onExportClick}
            variant="primary"
          >
            Export
          </Button>
        </div>
      </Modal>

      {exporting
        ? createPortal(
            <div
              aria-busy="true"
              aria-live="polite"
              className={styles.loadingOverlay}
            >
              <div className={styles.loadingCard}>
                <Spinner label="Preparing export. Please wait..." size="lg" />
                <p className={styles.countdown}>
                  Up to {formatCountdown(remainingSeconds)} remaining
                </p>
                <OverpassQueryStatus attempts={overpassAttempts} />
                <Button onClick={cancelExport} variant="ghost">
                  Cancel
                </Button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
