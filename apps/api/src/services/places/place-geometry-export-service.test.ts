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
import type { IRetailAreaGeometryResolver } from "./retail-area-geometry-service.js";
import type { IRetailAreaQueryBuilder } from "./retail-area-query-builder-service.js";

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
  retailAreaGeometry?: IRetailAreaGeometryResolver;
  retailAreaQueryBuilder?: IRetailAreaQueryBuilder;
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
  const retailAreaQueryBuilder: IRetailAreaQueryBuilder =
    options.retailAreaQueryBuilder ?? {
      build: vi.fn(() => "retail-query"),
    };
  const retailAreaGeometry: IRetailAreaGeometryResolver =
    options.retailAreaGeometry ?? {
      applyEnclosingRetailAreas: vi.fn((places) => places),
    };
  const pipeline = new PlaceOverpassPipeline(
    overpass,
    queryBuilder,
    areaResolver,
  );
  return {
    normalizer,
    overpass,
    queryBuilder,
    retailAreaGeometry,
    retailAreaQueryBuilder,
    service: new PlaceGeometryExportService(
      pipeline,
      normalizer,
      normalizer,
      retailAreaQueryBuilder,
      retailAreaGeometry,
    ),
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

  it("skips retail-area fetch for POINT even when the flag is set", async () => {
    const retailAreaQueryBuilder: IRetailAreaQueryBuilder = {
      build: vi.fn(() => "retail-query"),
    };
    const retailAreaGeometry: IRetailAreaGeometryResolver = {
      applyEnclosingRetailAreas: vi.fn((places) => places),
    };
    const overpass = {
      query: vi.fn(async () => ({
        elements: [{ id: 1, type: "node" as const }],
      })),
    };
    const normalizer: IOsmPlaceNormalizer = {
      normalize: vi.fn(() => [
        makePlace({ geometryType: "POINT", id: "node/1" }),
      ]),
      normalizeWithGeometry: vi.fn(() => []),
    };
    const { service } = createExporter({
      normalizer,
      overpass,
      retailAreaGeometry,
      retailAreaQueryBuilder,
    });

    await service.exportByGeometry(
      baseCriteria,
      "POINT",
      undefined,
      undefined,
      {
        includeRetailArea: true,
      },
    );

    expect(overpass.query).toHaveBeenCalledTimes(1);
    expect(retailAreaQueryBuilder.build).not.toHaveBeenCalled();
    expect(retailAreaGeometry.applyEnclosingRetailAreas).not.toHaveBeenCalled();
  });

  it("fetches retail areas and applies them for POLYGON when requested", async () => {
    const polygonPlace = makePlace({
      geometry: {
        polygons: [
          [
            [
              { lat: 0, lon: 0 },
              { lat: 0, lon: 1 },
              { lat: 1, lon: 1 },
              { lat: 1, lon: 0 },
              { lat: 0, lon: 0 },
            ],
          ],
        ],
      },
      geometryType: "POLYGON",
      geometryWkt: "POLYGON ((0 0, 1 0, 1 1, 0 1, 0 0))",
      id: "way/2",
      latitude: 0.5,
      longitude: 0.5,
      osmId: 2,
      osmType: "way",
    });
    const rewritten = {
      ...polygonPlace,
      geometryWkt: "POLYGON ((0 0, 4 0, 4 4, 0 4, 0 0))",
    };
    const retailAreaQueryBuilder: IRetailAreaQueryBuilder = {
      build: vi.fn(() => "retail-query"),
    };
    const retailAreaGeometry: IRetailAreaGeometryResolver = {
      applyEnclosingRetailAreas: vi.fn(() => [rewritten]),
    };
    const overpass = {
      query: vi
        .fn()
        .mockResolvedValueOnce({
          elements: [{ id: 2, type: "way" as const }],
        })
        .mockResolvedValueOnce({
          elements: [{ id: 99, type: "way" as const }],
        }),
    };
    const normalizer: IOsmPlaceNormalizer = {
      normalize: vi.fn(() => []),
      normalizeWithGeometry: vi.fn(() => [polygonPlace]),
    };
    const { service } = createExporter({
      normalizer,
      overpass,
      retailAreaGeometry,
      retailAreaQueryBuilder,
    });

    const places = await service.exportByGeometry(
      baseCriteria,
      "POLYGON",
      undefined,
      undefined,
      { includeRetailArea: true },
    );

    expect(overpass.query).toHaveBeenCalledTimes(2);
    expect(retailAreaQueryBuilder.build).toHaveBeenCalled();
    expect(retailAreaGeometry.applyEnclosingRetailAreas).toHaveBeenCalledWith(
      [polygonPlace],
      [{ id: 99, type: "way" }],
    );
    expect(places[0].geometryWkt).toBe(rewritten.geometryWkt);
  });
});
