import { useCallback, useEffect, useRef, useState } from "react";
import { useOverpassAttemptCountdown } from "@/pages/Places/use-overpass-attempt-countdown";
import { preparePlacesForGeometryExport } from "@/services/export/export-places-by-geometry-service";
import {
  browserPlacesCsvDownloader,
  type IPlacesCsvDownloader,
} from "@/services/export/places-csv-export-service";
import type { OverpassAttemptEvent } from "@/services/overpass/overpass-http-client-service";
import type { IPlaceGeometryExporter } from "@/services/places/place-geometry-export-service";
import type {
  PlaceGeometryType,
  PlaceSearchCriteria,
} from "@/types/places.types";
import { mergeOverpassAttempt } from "@/utils/merge-overpass-attempt";

/**
 * Options for the geometry CSV export hook.
 */
export interface UseExportPlacesByGeometryOptions {
  /** Active Places search criteria to re-query. */
  criteria: PlaceSearchCriteria;
  /** Triggers the browser CSV download after places are prepared. */
  csvDownloader?: IPlacesCsvDownloader;
  /** Called when the dialog should close after a successful export. */
  onClose: () => void;
  /** Optional callback after a successful download with the effective type. */
  onExported?: (geometryType: PlaceGeometryType) => void;
  /** Geometry export service port. */
  placeExport: IPlaceGeometryExporter;
}

/**
 * Result of the geometry CSV export hook for the export modal.
 */
export interface UseExportPlacesByGeometryResult {
  /** Aborts the in-flight export and returns to the picker. */
  cancelExport: () => void;
  /** True when export is allowed for the current selection. */
  canExport: (geometryType: PlaceGeometryType | null) => boolean;
  /** Last export error message, or null. */
  error: string | null;
  /** True while an export Overpass request is in flight. */
  exporting: boolean;
  /** Starts export for the given geometry type. */
  handleExport: (geometryType: PlaceGeometryType) => void;
  /** Live Overpass interpreter attempts for the in-flight export. */
  overpassAttempts: OverpassAttemptEvent[];
  /** Soft timeout countdown seconds remaining. */
  remainingSeconds: number;
}

/**
 * Manages geometry CSV export state, Overpass progress, and download side effects.
 * @param options Criteria, exporter, and completion callbacks.
 */
export function useExportPlacesByGeometry({
  criteria,
  csvDownloader = browserPlacesCsvDownloader,
  onClose,
  onExported,
  placeExport,
}: UseExportPlacesByGeometryOptions): UseExportPlacesByGeometryResult {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overpassAttempts, setOverpassAttempts] = useState<
    OverpassAttemptEvent[]
  >([]);
  const abortRef = useRef<AbortController | null>(null);

  const remainingSeconds = useOverpassAttemptCountdown({
    active: exporting,
    attempts: overpassAttempts,
  });

  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    [],
  );

  const cancelExport = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const canExport = useCallback(
    (geometryType: PlaceGeometryType | null) =>
      geometryType !== null && !exporting,
    [exporting],
  );

  const handleExport = useCallback(
    (geometryType: PlaceGeometryType) => {
      if (exporting) {
        return;
      }

      setExporting(true);
      setError(null);
      setOverpassAttempts([]);
      const controller = new AbortController();
      abortRef.current = controller;

      preparePlacesForGeometryExport(
        criteria,
        geometryType,
        (exportCriteria, type, signal, onAttempt) =>
          placeExport.exportByGeometry(exportCriteria, type, signal, onAttempt),
        controller.signal,
        (attempt) => {
          setOverpassAttempts((prev) => mergeOverpassAttempt(prev, attempt));
        },
      )
        .then((prepared) => {
          if (prepared.length === 0) {
            setError("No places matched this geometry. Try a different type.");
            return;
          }
          csvDownloader.download(prepared);
          onExported?.(geometryType);
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
          if (abortRef.current === controller) {
            abortRef.current = null;
          }
          setExporting(false);
          setOverpassAttempts([]);
        });
    },
    [criteria, csvDownloader, exporting, onClose, onExported, placeExport],
  );

  return {
    cancelExport,
    canExport,
    error,
    exporting,
    handleExport,
    overpassAttempts,
    remainingSeconds,
  };
}
