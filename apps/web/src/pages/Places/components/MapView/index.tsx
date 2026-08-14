import mapboxgl from "mapbox-gl";
import { useCallback, useEffect, useRef, useState } from "react";
import { MAP_WORLD_BOUNDS, MAPBOX_STYLE_URL } from "@/constants/api.constants";
import { ExportGeometryModal } from "@/pages/Places/components/ExportGeometryModal";
import "mapbox-gl/dist/mapbox-gl.css";
import styles from "./index.module.css";
import type { MapViewProps } from "./index.types";
import { MapControls } from "./MapControls";
import { isGeoJsonSource, nearlyEqual, placesToGeoJson } from "./map-helpers";
import {
  addPlacesMapLayers,
  PLACES_CLUSTERS_LAYER_ID,
  PLACES_LAYER_ID,
  PLACES_SOURCE_ID,
} from "./map-layers";

/** Mapbox GL map with clustered place point markers. */
export function MapView({
  view,
  places,
  selectedPlaceId,
  boundsToFit,
  onBoundsFitted,
  onFitResults,
  onViewChange,
  onSelectPlace,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapReadyRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportModalKey, setExportModalKey] = useState(0);
  const onViewChangeRef = useRef(onViewChange);
  const onSelectPlaceRef = useRef(onSelectPlace);
  const onBoundsFittedRef = useRef(onBoundsFitted);
  const applyingExternalViewRef = useRef(false);
  const accessToken = import.meta.env.VITE_MAPBOX_GL_JS_PUBLIC;

  useEffect(() => {
    onViewChangeRef.current = onViewChange;
    onSelectPlaceRef.current = onSelectPlace;
    onBoundsFittedRef.current = onBoundsFitted;
  }, [onViewChange, onSelectPlace, onBoundsFitted]);

  const handleOpenExportModal = useCallback(() => {
    setExportModalKey((key) => key + 1);
    setExportModalOpen(true);
  }, []);

  const handleCloseExportModal = useCallback(() => {
    setExportModalOpen(false);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const token = import.meta.env.VITE_MAPBOX_GL_JS_PUBLIC;
    if (!(container && token)) {
      return;
    }

    mapboxgl.accessToken = token;
    mapReadyRef.current = false;
    setMapReady(false);
    const map = new mapboxgl.Map({
      bearing: 0,
      bounds: MAP_WORLD_BOUNDS,
      container,
      dragRotate: false,
      fitBoundsOptions: { animate: false, duration: 0 },
      maxBounds: MAP_WORLD_BOUNDS,
      pitch: 0,
      pitchWithRotate: false,
      projection: { name: "mercator" },
      renderWorldCopies: false,
      style: MAPBOX_STYLE_URL,
      touchPitch: false,
    });
    map.touchZoomRotate.disableRotation();

    const onMoveEnd = () => {
      if (applyingExternalViewRef.current) {
        return;
      }
      const center = map.getCenter();
      onViewChangeRef.current({
        lat: center.lat,
        lon: center.lng,
        zoom: map.getZoom(),
      });
    };

    const onPlaceClick = (event: mapboxgl.MapLayerMouseEvent) => {
      const placeId = event.features?.[0]?.properties?.id;
      if (typeof placeId === "string") {
        onSelectPlaceRef.current(placeId);
      }
    };

    const onClusterClick = (event: mapboxgl.MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      if (feature?.geometry.type !== "Point") {
        return;
      }
      const clusterId = feature.properties?.cluster_id;
      if (typeof clusterId !== "number") {
        return;
      }
      const source = map.getSource(PLACES_SOURCE_ID);
      if (!isGeoJsonSource(source)) {
        return;
      }
      const coordinates = feature.geometry.coordinates as [number, number];
      source.getClusterExpansionZoom(clusterId, (error, zoom) => {
        if (error || zoom === null) {
          return;
        }
        map.easeTo({
          center: coordinates,
          zoom,
        });
      });
    };

    const onMouseEnter = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const onMouseLeave = () => {
      map.getCanvas().style.cursor = "";
    };

    const onLoad = () => {
      addPlacesMapLayers(map);
      const center = map.getCenter();
      mapReadyRef.current = true;
      setMapReady(true);
      onViewChangeRef.current({
        lat: center.lat,
        lon: center.lng,
        zoom: map.getZoom(),
      });
    };

    map.on("load", onLoad);
    map.on("moveend", onMoveEnd);
    map.on("click", PLACES_CLUSTERS_LAYER_ID, onClusterClick);
    map.on("click", PLACES_LAYER_ID, onPlaceClick);
    map.on("mouseenter", PLACES_CLUSTERS_LAYER_ID, onMouseEnter);
    map.on("mouseleave", PLACES_CLUSTERS_LAYER_ID, onMouseLeave);
    map.on("mouseenter", PLACES_LAYER_ID, onMouseEnter);
    map.on("mouseleave", PLACES_LAYER_ID, onMouseLeave);

    mapRef.current = map;
    return () => {
      mapReadyRef.current = false;
      setMapReady(false);
      mapRef.current = null;
      map.off("load", onLoad);
      map.off("moveend", onMoveEnd);
      map.off("click", PLACES_CLUSTERS_LAYER_ID, onClusterClick);
      map.off("click", PLACES_LAYER_ID, onPlaceClick);
      map.off("mouseenter", PLACES_CLUSTERS_LAYER_ID, onMouseEnter);
      map.off("mouseleave", PLACES_CLUSTERS_LAYER_ID, onMouseLeave);
      map.off("mouseenter", PLACES_LAYER_ID, onMouseEnter);
      map.off("mouseleave", PLACES_LAYER_ID, onMouseLeave);
      map.remove();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!(map && mapReadyRef.current) || boundsToFit !== null) {
      return;
    }

    const center = map.getCenter();
    const zoom = map.getZoom();
    if (
      nearlyEqual(center.lat, view.lat) &&
      nearlyEqual(center.lng, view.lon) &&
      nearlyEqual(zoom, view.zoom)
    ) {
      return;
    }

    applyingExternalViewRef.current = true;
    map.jumpTo({ center: [view.lon, view.lat], zoom: view.zoom });
    map.once("moveend", () => {
      applyingExternalViewRef.current = false;
    });
  }, [view, boundsToFit]);

  useEffect(() => {
    const map = mapRef.current;
    if (!(map && mapReady && boundsToFit)) {
      return;
    }

    applyingExternalViewRef.current = true;
    map.fitBounds(
      [
        [boundsToFit.west, boundsToFit.south],
        [boundsToFit.east, boundsToFit.north],
      ],
      {
        duration: 700,
        essential: true,
        maxZoom: 18,
        padding: 64,
      },
    );
    map.once("moveend", () => {
      applyingExternalViewRef.current = false;
      const center = map.getCenter();
      onViewChangeRef.current({
        lat: center.lat,
        lon: center.lng,
        zoom: map.getZoom(),
      });
      onBoundsFittedRef.current();
    });
  }, [boundsToFit, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const applyPlaces = () => {
      const placesSource = map.getSource(PLACES_SOURCE_ID);
      if (!isGeoJsonSource(placesSource)) {
        return;
      }

      const visiblePlaces = selectedPlaceId
        ? places.filter((place) => place.id === selectedPlaceId)
        : places;

      placesSource.setData(placesToGeoJson(visiblePlaces, selectedPlaceId));
    };

    if (map.isStyleLoaded()) {
      applyPlaces();
      return;
    }

    map.once("load", applyPlaces);
    return () => {
      map.off("load", applyPlaces);
    };
  }, [places, selectedPlaceId]);

  if (!accessToken) {
    return (
      <div className={styles.root}>
        <p className={styles.tokenMissing}>
          Set <code>VITE_MAPBOX_GL_JS_PUBLIC</code> in{" "}
          <code>apps/web/.env</code> to enable the map.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.mapCanvas} ref={containerRef} />
      {places.length > 0 ? (
        <MapControls
          onExport={handleOpenExportModal}
          onFitResults={onFitResults}
        />
      ) : null}
      {exportModalOpen ? (
        <ExportGeometryModal
          key={exportModalKey}
          onClose={handleCloseExportModal}
          open
        />
      ) : null}
    </div>
  );
}
