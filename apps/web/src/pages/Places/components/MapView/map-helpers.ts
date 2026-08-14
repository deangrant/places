import type { GeoJSONSource, Source } from "mapbox-gl";
import type { Place } from "@/types/places.types";

/**
 * Builds point features for place markers.
 * @param places Search result places.
 * @param selectedPlaceId Currently selected place id.
 */
export function placesToGeoJson(
  places: Place[],
  selectedPlaceId: string | null,
): GeoJSON.FeatureCollection {
  return {
    features: places.map((place) => ({
      geometry: {
        coordinates: [place.longitude, place.latitude],
        type: "Point",
      },
      properties: {
        id: place.id,
        selected: place.id === selectedPlaceId,
      },
      type: "Feature",
    })),
    type: "FeatureCollection",
  };
}

/** Narrows a Mapbox source to GeoJSON when present. */
export function isGeoJsonSource(
  source: Source | undefined,
): source is GeoJSONSource {
  return source !== undefined && source.type === "geojson";
}

/** True when two numbers differ by less than epsilon. */
export function nearlyEqual(a: number, b: number, epsilon = 1e-9): boolean {
  return Math.abs(a - b) < epsilon;
}
