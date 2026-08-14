import { useCallback } from "react";
import { usePlaces } from "@/contexts/PlacesContext";
import styles from "./index.module.css";
import type { ResultRowProps } from "./index.types";

/** Compact Places results list with row selection. */
export function ResultsList() {
  const { places, selectedPlaceId, selectPlace, truncated } = usePlaces();

  if (places.length === 0) {
    return (
      <div className={styles.empty}>
        No places yet. Choose filters and run a search.
      </div>
    );
  }

  const title = places.length === 1 ? "1 place" : `${places.length} places`;

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {truncated ? (
          <p className={styles.hint}>Result limit reached — refine filters.</p>
        ) : null}
      </header>

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
