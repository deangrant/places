import { useCallback } from "react";
import { Button } from "@/components/core/Button";
import { Input } from "@/components/core/Input";
import { usePlaces } from "@/contexts/PlacesContext";
import styles from "./index.module.css";
import type { ResultRowProps, ResultsListProps } from "./index.types";

/** Compact Places results list with row selection and address filter. */
export function ResultsList({
  places,
  totalCount,
  query,
  onQueryChange,
}: ResultsListProps) {
  const { selectedPlaceId, selectPlace, truncated } = usePlaces();

  const handleClear = useCallback(() => {
    onQueryChange("");
  }, [onQueryChange]);

  const isFiltering = query.trim().length > 0;
  let title = totalCount === 1 ? "1 place" : `${totalCount} places`;
  if (isFiltering) {
    title = `${places.length} of ${totalCount} places`;
  }

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {truncated ? (
          <p className={styles.hint}>Result limit reached — refine filters.</p>
        ) : null}
        <div className={styles.filterRow}>
          <Input
            aria-label="Filter results by address"
            id="results-address-filter"
            onChange={onQueryChange}
            placeholder="Filter by address…"
            type="search"
            value={query}
          />
          {isFiltering ? (
            <Button
              className={styles.clear}
              onClick={handleClear}
              title="Clear address filter"
              type="button"
              variant="ghost"
            >
              Clear
            </Button>
          ) : null}
        </div>
      </header>

      {places.length === 0 ? (
        <div className={styles.empty}>
          {isFiltering
            ? "No places match this address"
            : "No places yet. Choose filters and run a search."}
        </div>
      ) : (
        <ul className={styles.list}>
          {places.map((place) => (
            <ResultRow
              key={place.id}
              onSelect={selectPlace}
              place={place}
              selected={place.id === selectedPlaceId}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function ResultRow({ place, selected, onSelect }: ResultRowProps) {
  const handleClick = useCallback(() => {
    onSelect(place.id);
  }, [onSelect, place.id]);

  const meta = [place.brands[0], place.subCategory].filter(Boolean).join(" · ");
  const location = [
    place.streetAddress,
    place.city,
    place.region,
    place.isoCountryCode,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <li>
      <button
        className={[styles.row, selected ? styles.selected : undefined]
          .filter(Boolean)
          .join(" ")}
        onClick={handleClick}
        type="button"
      >
        <span className={styles.name}>
          {place.locationName ?? "Unnamed place"}
        </span>
        {meta ? <span className={styles.meta}>{meta}</span> : null}
        {location ? <span className={styles.location}>{location}</span> : null}
      </button>
    </li>
  );
}
