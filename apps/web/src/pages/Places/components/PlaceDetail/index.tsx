import { useCallback } from "react";
import { Badge } from "@/components/core/Badge";
import { Button } from "@/components/core/Button";
import { usePlacesSelection } from "@/contexts/PlacesContext";
import { osmPermalink } from "@/utils/osm-permalink";
import { safeHttpUrl } from "@/utils/safe-http-url";
import { safeTelHref } from "@/utils/safe-tel-href";
import styles from "./index.module.css";
import type { DetailProps } from "./index.types";

/** Detail pane for the selected Place record. */
export function PlaceDetail() {
  const { selectedPlace, selectPlace } = usePlacesSelection();

  const handleBack = useCallback(() => {
    selectPlace(null);
  }, [selectPlace]);

  if (!selectedPlace) {
    return null;
  }

  const osmRef = `${selectedPlace.osmType}/${selectedPlace.osmId}`;

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
        <Detail
          href={
            selectedPlace.phoneNumber
              ? safeTelHref(selectedPlace.phoneNumber)
              : null
          }
          label="Phone"
          value={selectedPlace.phoneNumber}
        />
        <Detail
          href={
            selectedPlace.website ? safeHttpUrl(selectedPlace.website) : null
          }
          label="Website"
          value={selectedPlace.website}
        />
        <Detail label="Hours" value={selectedPlace.openHours} />
        <Detail label="Geometry" value={selectedPlace.geometryType} />
        <Detail
          label="Coordinates"
          value={`${selectedPlace.latitude.toFixed(5)}, ${selectedPlace.longitude.toFixed(5)}`}
        />
        <Detail
          href={osmPermalink(selectedPlace.osmType, selectedPlace.osmId)}
          label="OpenStreetMap"
          value={osmRef}
        />
      </dl>
    </div>
  );
}

function Detail({ label, value, href = null }: DetailProps) {
  if (!value) {
    return null;
  }
  const isTel = href?.startsWith("tel:") ?? false;
  return (
    <div className={styles.row}>
      <dt>{label}</dt>
      <dd>
        {href ? (
          <a
            href={href}
            {...(isTel ? {} : { rel: "noopener noreferrer", target: "_blank" })}
          >
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}
