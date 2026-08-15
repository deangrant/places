import type { PlaceGeometryType } from "@/types/places.types";

/** Supported CSV geometry encodings for export. */
export type PlaceExportFormat = "WKT";

/**
 * Props for the export geometry type selection modal.
 */
export interface ExportGeometryModalProps {
  /** Called when the user dismisses without exporting. */
  onClose: () => void;
  /**
   * Called after a successful CSV download with the effective geometry type.
   * Optional; used by tests and callers that need to observe completion.
   */
  onExported?: (effectiveType: PlaceGeometryType) => void;
  /** When true the modal is visible. */
  open: boolean;
}
