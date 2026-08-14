/**
 * Props for the map overlay fit and export controls.
 */
export interface MapControlsProps {
  /** Opens the export geometry modal. */
  onExport: () => void;
  /** Fits the map viewport to the current search results. */
  onFitResults: () => void;
}
