import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { OVERPASS_CLIENT_TIMEOUT_SECONDS } from "@/constants/api.constants";
import { mergeOverpassAttempt } from "@/pages/Places/utils/merge-overpass-attempt";
import {
  preparePlacesForGeometryExport,
  resolveEffectiveGeometryType,
} from "@/services/export/export-places-by-geometry";
import { downloadPlacesCsv } from "@/services/export/places-csv-export";
import type { OverpassAttemptEvent } from "@/services/overpass/overpass-http-client";
import type { IPlaceGeometryExporter } from "@/services/places/place-search-service";
import type {
  PlaceGeometryType,
  PlaceSearchCriteria,
} from "@/types/places.types";

/**
 * Options for the geometry CSV export hook.
 */
export interface UseExportPlacesByGeometryOptions {
  /** Active Places search criteria to re-query. */
  criteria: PlaceSearchCriteria;
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
  canExport: (selectedGeometry: PlaceGeometryType[]) => boolean;
  /** Last export error message, or null. */
  error: string | null;
  /** True while an export Overpass request is in flight. */
  exporting: boolean;
  /** Starts export for the given geometry selection. */
  handleExport: (selectedGeometry: PlaceGeometryType[]) => void;
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
  onClose,
  onExported,
  placeExport,
}: UseExportPlacesByGeometryOptions): UseExportPlacesByGeometryResult {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(
    OVERPASS_CLIENT_TIMEOUT_SECONDS,
  );
  const [overpassAttempts, setOverpassAttempts] = useState<
    OverpassAttemptEvent[]
  >([]);
  const abortRef = useRef<AbortController | null>(null);

  const currentAttemptIndex = useMemo(
    () =>
      overpassAttempts.reduce(
        (max, attempt) => Math.max(max, attempt.index),
        -1,
      ),
    [overpassAttempts],
  );

  useEffect(() => {
    if (!exporting) {
      return;
    }
    // Restart soft budget whenever failover advances currentAttemptIndex.
    setRemainingSeconds(
      currentAttemptIndex >= -1 ? OVERPASS_CLIENT_TIMEOUT_SECONDS : 0,
    );
    const intervalId = window.setInterval(() => {
      setRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [exporting, currentAttemptIndex]);

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
    (selectedGeometry: PlaceGeometryType[]) =>
      selectedGeometry.length > 0 && !exporting,
    [exporting],
  );

  const handleExport = useCallback(
    (selectedGeometry: PlaceGeometryType[]) => {
      if (selectedGeometry.length === 0 || exporting) {
        return;
      }

      setExporting(true);
      setError(null);
      setOverpassAttempts([]);
      const controller = new AbortController();
      abortRef.current = controller;
      const effectiveType = resolveEffectiveGeometryType(selectedGeometry);

      preparePlacesForGeometryExport(
        criteria,
        effectiveType,
        (exportCriteria, geometryType, signal, onAttempt) =>
          placeExport.exportByGeometry(
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
          if (abortRef.current === controller) {
            abortRef.current = null;
          }
          setExporting(false);
          setOverpassAttempts([]);
        });
    },
    [criteria, exporting, onClose, onExported, placeExport],
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
