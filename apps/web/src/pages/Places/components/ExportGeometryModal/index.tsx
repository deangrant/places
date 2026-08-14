import type { MouseEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/core/Button";
import { Modal } from "@/components/core/Modal";
import { Spinner } from "@/components/core/Spinner";
import { OVERPASS_TIMEOUT_SECONDS } from "@/constants/api.constants";
import { usePlaces } from "@/contexts/PlacesContext";
import { useServices } from "@/contexts/ServicesContext";
import { OverpassQueryStatus } from "@/pages/Places/components/OverpassQueryStatus";
import {
  EXPORT_GEOMETRY_TYPE_PRIORITY,
  preparePlacesForGeometryExport,
  resolveEffectiveGeometryType,
} from "@/services/export/export-places-by-geometry";
import { downloadPlacesCsv } from "@/services/export/places-csv-export";
import type { OverpassAttemptEvent } from "@/services/overpass/overpass-http-client";
import { mergeOverpassAttempt } from "@/services/overpass/overpass-http-client";
import type { PlaceGeometryType } from "@/types/places.types";
import styles from "./index.module.css";
import type { ExportGeometryModalProps } from "./index.types";

/** Supported CSV geometry encodings for export. */
export type PlaceExportFormat = "WKT";

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

const DEFAULT_GEOMETRY_SELECTION: PlaceGeometryType[] = [];
const DEFAULT_FORMAT_SELECTION: PlaceExportFormat[] = ["WKT"];

/** Modal for choosing geometry and format for a Places CSV export. */
export function ExportGeometryModal({
  open,
  onClose,
  onExported,
}: ExportGeometryModalProps) {
  const { criteria } = usePlaces();
  const { placeSearch } = useServices();
  const [selectedGeometry, setSelectedGeometry] = useState<PlaceGeometryType[]>(
    DEFAULT_GEOMETRY_SELECTION,
  );
  const [selectedFormats, setSelectedFormats] = useState<PlaceExportFormat[]>(
    DEFAULT_FORMAT_SELECTION,
  );
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(
    OVERPASS_TIMEOUT_SECONDS,
  );
  const [overpassAttempts, setOverpassAttempts] = useState<
    OverpassAttemptEvent[]
  >([]);

  useEffect(() => {
    if (!exporting) {
      return;
    }
    setRemainingSeconds(OVERPASS_TIMEOUT_SECONDS);
    const intervalId = window.setInterval(() => {
      setRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [exporting]);

  const toggleGeometry = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    const type = event.currentTarget.dataset.geometryType;
    if (type !== "POINT" && type !== "POLYGON" && type !== "MULTIPOLYGON") {
      return;
    }
    setSelectedGeometry((prev) => {
      if (prev.includes(type)) {
        return prev.filter((entry) => entry !== type);
      }
      return [...prev, type];
    });
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

  const canExport =
    selectedGeometry.length > 0 && selectedFormats.length > 0 && !exporting;

  const handleExport = useCallback(() => {
    if (
      !(selectedGeometry.length > 0 && selectedFormats.length > 0) ||
      exporting
    ) {
      return;
    }

    setExporting(true);
    setError(null);
    setOverpassAttempts([]);
    const controller = new AbortController();
    const effectiveType = resolveEffectiveGeometryType(selectedGeometry);

    preparePlacesForGeometryExport(
      criteria,
      effectiveType,
      (exportCriteria, geometryType, signal, onAttempt) =>
        placeSearch.exportByGeometry(
          exportCriteria,
          geometryType,
          signal,
          onAttempt,
        ),
      controller.signal,
      (attempt) => {
        setOverpassAttempts((prev) => mergeOverpassAttempt(prev, attempt));
      },
    )
      .then((prepared) => {
        downloadPlacesCsv(prepared);
        onExported?.(effectiveType);
        onClose();
      })
      .catch((exportError: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        const message =
          exportError instanceof Error
            ? exportError.message
            : "Couldn't create the export. Please try again.";
        setError(message);
      })
      .finally(() => {
        setExporting(false);
        setOverpassAttempts([]);
      });
  }, [
    criteria,
    exporting,
    onClose,
    onExported,
    placeSearch,
    selectedFormats.length,
    selectedGeometry,
  ]);

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
          Select geometry and format for your CSV. If more than one geometry is
          selected, Multipolygon takes priority, then Polygon, then Point.
        </p>

        <fieldset className={styles.tiles}>
          <legend className={styles.legend}>Geometry</legend>
          {EXPORT_GEOMETRY_TYPE_PRIORITY.map((type) => {
            const isSelected = selectedGeometry.includes(type);
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
                onClick={toggleGeometry}
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
            disabled={!canExport}
            onClick={handleExport}
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
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

/**
 * Formats remaining seconds as M:SS for the export timeout countdown.
 * @param totalSeconds Seconds left before the soft Overpass timeout.
 */
function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
