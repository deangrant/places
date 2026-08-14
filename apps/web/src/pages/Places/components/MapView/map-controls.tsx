import styles from "./index.module.css";

export interface MapControlsProps {
  /** Opens the export geometry modal. */
  onExport: () => void;
  /** Fits the map viewport to the current search results. */
  onFitResults: () => void;
}

/** Fit-results and export controls overlaid on the map. */
export function MapControls({ onExport, onFitResults }: MapControlsProps) {
  return (
    <div className={styles.mapControls}>
      <button
        aria-label="Fit results to map"
        className={styles.mapControl}
        onClick={onFitResults}
        type="button"
      >
        <svg
          aria-hidden="true"
          className={styles.mapControlIcon}
          fill="none"
          focusable="false"
          height="18"
          role="presentation"
          viewBox="0 0 24 24"
          width="18"
        >
          <path
            d="M4 9V5h4M20 9V5h-4M4 15v4h4M20 15v4h-4"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.75"
          />
        </svg>
      </button>
      <button
        aria-label="Export places as CSV"
        className={styles.mapControl}
        onClick={onExport}
        title="Export places as CSV"
        type="button"
      >
        <svg
          aria-hidden="true"
          className={styles.mapControlIcon}
          fill="none"
          focusable="false"
          height="18"
          role="presentation"
          viewBox="0 0 24 24"
          width="18"
        >
          <path
            d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.75"
          />
        </svg>
      </button>
    </div>
  );
}
