import { useCallback, useRef } from "react";
import { Button } from "@/components/core/Button";
import { Input } from "@/components/core/Input";
import { usePlaces } from "@/contexts/PlacesContext";
import styles from "./index.module.css";
import type { ResultRowProps, ResultsListProps } from "./index.types";
import { useFixedVirtualList } from "./use-fixed-virtual-list";

/** Fixed row height for virtualization (fits name, meta, location + padding). */
const RESULT_ROW_HEIGHT_PX = 84;

/** Compact Places results list with row selection and results filter. */
export function ResultsList({
  places,
  totalCount,
  query,
  onQueryChange,
}: ResultsListProps) {
  const { selectedPlaceId, selectPlace, truncated } = usePlaces();
  const listRef = useRef<HTMLElement>(null);
  const { totalHeight, virtualItems } = useFixedVirtualList({
    count: places.length,
    overscan: 8,
    rowHeight: RESULT_ROW_HEIGHT_PX,
    scrollElementRef: listRef,
  });

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
            aria-label="Filter results"
            id="results-address-filter"
            onChange={onQueryChange}
            placeholder="Filter results…"
            type="search"
            value={query}
          />
          {isFiltering ? (
            <Button
              className={styles.clear}
              onClick={handleClear}
              title="Clear results filter"
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
            ? "No places match this filter"
            : "No places yet. Choose filters and run a search."}
        </div>
      ) : (
        <section
          aria-label="Search results"
          className={styles.list}
          ref={listRef}
        >
          <ul className={styles.listInner} style={{ height: totalHeight }}>
            {virtualItems.map((item) => {
              const place = places[item.index];
              if (!place) {
                return null;
              }
              return (
                <li
                  className={styles.listRow}
                  key={place.id}
                  style={{
                    height: RESULT_ROW_HEIGHT_PX,
                    transform: `translateY(${item.start}px)`,
                  }}
                >
                  <ResultRow
                    onSelect={selectPlace}
                    place={place}
                    selected={place.id === selectedPlaceId}
                  />
                </li>
              );
            })}
          </ul>
        </section>
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
  );
}
