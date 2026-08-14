import { useCallback } from "react";
import { Badge } from "@/components/core/Badge";
import { Button } from "@/components/core/Button";
import { usePlaces } from "@/contexts/PlacesContext";
import { safeHttpUrl } from "@/utils/safe-http-url";
import styles from "./index.module.css";
import type { DetailProps } from "./index.types";

/** Detail pane for the selected Place record. */
export function PlaceDetail() {
  const { selectedPlace, selectPlace, geometryLoading } = usePlaces();

  const handleBack = useCallback(() => {
    selectPlace(null);
  }, [selectPlace]);

  if (!selectedPlace) {
    return null;
  }

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <Button onClick={handleBack} title="Back to results" variant="ghost">
          ← Results
        </Button>
      </div>

      <div className={styles.header}>
        <h2 className={styles.title}>
          {selectedPlace.locationName ?? "Unnamed place"}
        </h2>
        {selectedPlace.subCategory ? (
          <Badge>{selectedPlace.subCategory}</Badge>
        ) : null}
      </div>

      <dl className={styles.list}>
        <Detail label="Brand" value={selectedPlace.brands.join(", ")} />
        <Detail
          label="Category"
          value={[selectedPlace.topCategory, selectedPlace.subCategory]
            .filter(Boolean)
            .join(" · ")}
        />
        <Detail label="Address" value={selectedPlace.streetAddress} />
        <Detail label="City" value={selectedPlace.city} />
        <Detail label="Region" value={selectedPlace.region} />
        <Detail label="Postal" value={selectedPlace.postalCode} />
        <Detail label="Country" value={selectedPlace.isoCountryCode} />
        <Detail label="Phone" value={selectedPlace.phoneNumber} />
        <Detail isLink label="Website" value={selectedPlace.website} />
        <Detail label="Hours" value={selectedPlace.openHours} />
        <Detail
          label="Geometry"
          value={
            geometryLoading ? "Loading footprint…" : selectedPlace.geometryType
          }
        />
        <Detail
          label="Coordinates"
          value={`${selectedPlace.latitude.toFixed(5)}, ${selectedPlace.longitude.toFixed(5)}`}
        />
      </dl>
    </div>
  );
}

function Detail({ label, value, isLink = false }: DetailProps) {
  if (!value) {
    return null;
  }
  const href = isLink ? safeHttpUrl(value) : null;
  return (
    <div className={styles.row}>
      <dt>{label}</dt>
      <dd>
        {href ? (
          <a href={href} rel="noopener noreferrer" target="_blank">
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}
