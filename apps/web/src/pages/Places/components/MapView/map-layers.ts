import type { FilterSpecification, Map as MapboxMap } from "mapbox-gl";

/** Fill color for unselected place markers. */
export const MARKER_COLOR = "#3d9b7a";
/** Fill color for the selected place marker. */
export const MARKER_SELECTED_COLOR = "#2f7d62";
/** Fill color for large cluster circles. */
export const MARKER_CLUSTER_LARGE_COLOR = "#24634e";
/** Stroke color for place and cluster circles. */
export const MARKER_STROKE_COLOR = "#ffffff";
/** Soft halo color behind unclustered markers. */
export const MARKER_HALO_COLOR = "rgba(15, 26, 23, 0.22)";

/** GeoJSON source id for clustered place points. */
export const PLACES_SOURCE_ID = "places";
/** Halo circle layer id under cluster markers. */
export const PLACES_CLUSTERS_HALO_LAYER_ID = "places-clusters-halo";
/** Cluster circle layer id. */
export const PLACES_CLUSTERS_LAYER_ID = "places-clusters";
/** Cluster count label layer id. */
export const PLACES_CLUSTER_COUNT_LAYER_ID = "places-cluster-count";
/** Halo circle layer id under unclustered markers. */
export const PLACES_HALO_LAYER_ID = "places-halo";
/** Unclustered place circle layer id. */
export const PLACES_LAYER_ID = "places-circle";

const UNCLUSTERED_POINT_FILTER: FilterSpecification = [
  "!",
  ["has", "point_count"],
];
const CLUSTER_FILTER: FilterSpecification = ["has", "point_count"];

/**
 * Registers clustered place point sources and layers on a loaded map.
 * @param map Mapbox map instance after style load.
 */
export function addPlacesMapLayers(map: MapboxMap): void {
  map.addSource(PLACES_SOURCE_ID, {
    cluster: true,
    clusterMaxZoom: 14,
    clusterRadius: 56,
    data: { features: [], type: "FeatureCollection" },
    type: "geojson",
  });

  map.addLayer({
    filter: CLUSTER_FILTER,
    id: PLACES_CLUSTERS_HALO_LAYER_ID,
    paint: {
      "circle-color": MARKER_HALO_COLOR,
      "circle-radius": ["step", ["get", "point_count"], 20, 25, 24, 100, 28],
      "circle-stroke-width": 0,
    },
    source: PLACES_SOURCE_ID,
    type: "circle",
  });
  map.addLayer({
    filter: CLUSTER_FILTER,
    id: PLACES_CLUSTERS_LAYER_ID,
    paint: {
      "circle-color": [
        "step",
        ["get", "point_count"],
        MARKER_COLOR,
        25,
        MARKER_SELECTED_COLOR,
        100,
        MARKER_CLUSTER_LARGE_COLOR,
      ],
      "circle-radius": ["step", ["get", "point_count"], 16, 25, 20, 100, 24],
      "circle-stroke-color": MARKER_STROKE_COLOR,
      "circle-stroke-width": 2,
    },
    source: PLACES_SOURCE_ID,
    type: "circle",
  });
  map.addLayer({
    filter: CLUSTER_FILTER,
    id: PLACES_CLUSTER_COUNT_LAYER_ID,
    layout: {
      "text-field": ["get", "point_count_abbreviated"],
      "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
      "text-size": 12,
    },
    paint: {
      "text-color": MARKER_STROKE_COLOR,
    },
    source: PLACES_SOURCE_ID,
    type: "symbol",
  });

  map.addLayer({
    filter: UNCLUSTERED_POINT_FILTER,
    id: PLACES_HALO_LAYER_ID,
    paint: {
      "circle-color": MARKER_HALO_COLOR,
      "circle-radius": ["case", ["boolean", ["get", "selected"], false], 11, 8],
      "circle-stroke-width": 0,
    },
    source: PLACES_SOURCE_ID,
    type: "circle",
  });
  map.addLayer({
    filter: UNCLUSTERED_POINT_FILTER,
    id: PLACES_LAYER_ID,
    paint: {
      "circle-color": [
        "case",
        ["boolean", ["get", "selected"], false],
        MARKER_SELECTED_COLOR,
        MARKER_COLOR,
      ],
      "circle-radius": [
        "case",
        ["boolean", ["get", "selected"], false],
        7.5,
        5.5,
      ],
      "circle-stroke-color": MARKER_STROKE_COLOR,
      "circle-stroke-width": 2,
    },
    source: PLACES_SOURCE_ID,
    type: "circle",
  });
}
