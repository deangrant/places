import type {
  GeocodeResult,
  Place,
  PlaceSearchCriteria,
} from "places-core/places";
import { describe, expect, it, vi } from "vitest";
import type { IAreaResolver } from "../geocoding/nominatim-area-resolver-service.js";
import type { IOverpassClient } from "../overpass/overpass-http-client-service.js";
import type { IOsmPlaceNormalizer } from "./osm-place-normalizer-service.js";
import { PlaceGeometryExportService } from "./place-geometry-export-service.js";
import { PlaceOverpassPipeline } from "./place-overpass-pipeline-service.js";
import type { IPlaceQueryBuilder } from "./place-query-builder-service.js";

const baseCriteria: PlaceSearchCriteria = {
  brand: "Starbucks",
  city: "Seattle",
  countryCode: "US",
};

const adminRelation: GeocodeResult = {
  boundingBox: { east: 1, north: 2, south: 0, west: -1 },
  class: "boundary",
  countryCode: "US",
  displayName: "Seattle",
  lat: 1,
  lon: 0,
  osmId: 100,
  osmType: "relation",
  type: "administrative",
};

function makePlace(
  partial: Partial<Place> & Pick<Place, "id" | "geometryType">,
): Place {
  return {
    brands: [],
    city: null,
    geometry: { polygons: [] },
    geometryWkt: "POINT(0 0)",
    isoCountryCode: null,
    latitude: 0,
    locationName: null,
    longitude: 0,
    openHours: null,
    osmId: 1,
    osmType: "node",
    phoneNumber: null,
    postalCode: null,
    region: null,
    streetAddress: null,
    subCategory: null,
    tags: {},
    topCategory: null,
    website: null,
    ...partial,
  };
}

function createExporter(options: {
  areaResolver?: IAreaResolver;
  overpass?: IOverpassClient;
  queryBuilder?: IPlaceQueryBuilder;
  normalizer?: IOsmPlaceNormalizer;
}) {
  const overpass: IOverpassClient = options.overpass ?? {
    query: vi.fn(async () => ({ elements: [] })),
  };
  const queryBuilder: IPlaceQueryBuilder = options.queryBuilder ?? {
    build: vi.fn(() => "query"),
  };
  const normalizer: IOsmPlaceNormalizer = options.normalizer ?? {
    normalize: vi.fn(() => []),
    normalizeWithGeometry: vi.fn(() => []),
  };
  const areaResolver: IAreaResolver = options.areaResolver ?? {
    resolveAdmin: vi.fn(async () => adminRelation),
  };
  const pipeline = new PlaceOverpassPipeline(
    overpass,
    queryBuilder,
    areaResolver,
  );
  return {
    normalizer,
    queryBuilder,
    service: new PlaceGeometryExportService(pipeline, normalizer, normalizer),
  };
}

describe("PlaceGeometryExportService.exportByGeometry", () => {
  it("uses center output and center normalizer for POINT", async () => {
    const queryBuilder: IPlaceQueryBuilder = {
      build: vi.fn(() => "center-query"),
    };
    const normalizer: IOsmPlaceNormalizer = {
      normalize: vi.fn(() => [
        makePlace({ geometryType: "POINT", id: "node/1" }),
      ]),
      normalizeWithGeometry: vi.fn(() => []),
    };
    const overpass = {
      query: vi.fn(async () => ({
        elements: [{ id: 1, type: "node" as const }],
      })),
    };
    const { service } = createExporter({ normalizer, overpass, queryBuilder });

    const places = await service.exportByGeometry(baseCriteria, "POINT");

    expect(queryBuilder.build).toHaveBeenCalledWith(
      baseCriteria,
      expect.objectContaining({ areaId: expect.any(Number) }),
      "center",
    );
    expect(normalizer.normalize).toHaveBeenCalled();
    expect(normalizer.normalizeWithGeometry).not.toHaveBeenCalled();
    expect(places).toHaveLength(1);
    expect(places[0].geometryType).toBe("POINT");
  });

  it("uses geom output and keeps only matching POLYGON rows", async () => {
    const queryBuilder: IPlaceQueryBuilder = {
      build: vi.fn(() => "geom-query"),
    };
    const normalizer: IOsmPlaceNormalizer = {
      normalize: vi.fn(() => []),
      normalizeWithGeometry: vi.fn(() => [
        makePlace({ geometryType: "POINT", id: "node/1", osmType: "node" }),
        makePlace({
          geometryType: "POLYGON",
          id: "way/2",
          osmId: 2,
          osmType: "way",
        }),
        makePlace({
          geometryType: "MULTIPOLYGON",
          id: "relation/3",
          osmId: 3,
          osmType: "relation",
        }),
      ]),
    };
    const { service } = createExporter({ normalizer, queryBuilder });

    const places = await service.exportByGeometry(baseCriteria, "POLYGON");

    expect(queryBuilder.build).toHaveBeenCalledWith(
      baseCriteria,
      expect.anything(),
      "geom",
    );
    expect(normalizer.normalizeWithGeometry).toHaveBeenCalled();
    expect(normalizer.normalize).not.toHaveBeenCalled();
    expect(places).toHaveLength(1);
    expect(places[0].id).toBe("way/2");
  });
});
