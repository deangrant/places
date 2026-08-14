import { describe, expect, it, vi } from "vitest";
import { RESULT_LIMIT } from "@/constants/api.constants";
import type { IAreaResolver } from "@/services/geocoding/nominatim-area-resolver";
import type { IOverpassClient } from "@/services/overpass/overpass-http-client";
import type { IOsmPlaceNormalizer } from "@/services/places/osm-place-normalizer";
import type { IPlaceQueryBuilder } from "@/services/places/place-query-builder";
import { PlaceSearchService } from "@/services/places/place-search-service";
import type {
  GeocodeResult,
  Place,
  PlaceSearchCriteria,
} from "@/types/places.types";

const WHAT_FILTER_ERROR = /category, brand, place name, or OSM tag/i;
const GEO_FILTER_ERROR = /country, region, or city/i;
const PARTIAL_TAG_ERROR = /both OSM tag key and value/i;
const TIMEOUT_REMARK = /timed out/i;

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

const adminNode: GeocodeResult = {
  ...adminRelation,
  osmId: 55,
  osmType: "node",
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

function createService(options: {
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
  return {
    areaResolver,
    normalizer,
    overpass,
    queryBuilder,
    service: new PlaceSearchService(
      overpass,
      queryBuilder,
      normalizer,
      areaResolver,
    ),
  };
}

describe("PlaceSearchService.assertHasFilters", () => {
  const { service } = createService({});

  it("requires a what filter and geography", async () => {
    await expect(service.search({ countryCode: "US" })).rejects.toThrow(
      WHAT_FILTER_ERROR,
    );
    await expect(service.search({ brand: "X" })).rejects.toThrow(
      GEO_FILTER_ERROR,
    );
  });

  it("rejects partial OSM tags", async () => {
    await expect(
      service.search({ city: "X", osmTagKey: "amenity" }),
    ).rejects.toThrow(PARTIAL_TAG_ERROR);
  });
});

describe("PlaceSearchService.search", () => {
  it("throws on Overpass remark errors", async () => {
    const { service } = createService({
      overpass: {
        query: vi.fn(async () => ({
          elements: [],
          remark: "runtime error: Query timed out",
        })),
      },
    });
    await expect(service.search(baseCriteria)).rejects.toThrow(TIMEOUT_REMARK);
  });

  it("marks truncated at RESULT_LIMIT", async () => {
    const elements = Array.from({ length: RESULT_LIMIT }, (_, id) => ({
      id,
      type: "node" as const,
    }));
    const { service } = createService({
      overpass: { query: vi.fn(async () => ({ elements })) },
    });
    const result = await service.search(baseCriteria);
    expect(result.truncated).toBe(true);
  });

  it("falls back to bbox when area id conversion fails", async () => {
    const queryBuilder: IPlaceQueryBuilder = {
      build: vi.fn(() => "query"),
    };
    const { service } = createService({
      areaResolver: { resolveAdmin: vi.fn(async () => adminNode) },
      queryBuilder,
    });
    await service.search(baseCriteria);
    expect(queryBuilder.build).toHaveBeenCalledWith(
      baseCriteria,
      expect.objectContaining({ bbox: adminNode.boundingBox }),
      "center",
    );
  });

  it("aborts when the signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    const overpass: IOverpassClient = {
      query: (_q, signal) => {
        if (signal?.aborted) {
          return Promise.reject(new DOMException("Aborted", "AbortError"));
        }
        return Promise.resolve({ elements: [] });
      },
    };
    const { service } = createService({ overpass });
    await expect(
      service.search(baseCriteria, controller.signal),
    ).rejects.toMatchObject({ name: "AbortError" });
  });
});

describe("PlaceSearchService.exportByGeometry", () => {
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
    const { service } = createService({ normalizer, overpass, queryBuilder });

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
    const { service } = createService({ normalizer, queryBuilder });

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
