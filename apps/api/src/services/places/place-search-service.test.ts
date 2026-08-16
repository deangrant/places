import { RESULT_LIMIT } from "places-core/overpass";
import type {
  GeocodeResult,
  Place,
  PlaceSearchCriteria,
} from "places-core/places";
import { describe, expect, it, vi } from "vitest";
import type { IAreaResolver } from "../geocoding/nominatim-area-resolver-service.js";
import type { IOverpassClient } from "../overpass/overpass-http-client-service.js";
import type { IOsmPlaceNormalizer } from "./osm-place-normalizer-service.js";
import { PlaceOverpassPipeline } from "./place-overpass-pipeline-service.js";
import type { IPlaceQueryBuilder } from "./place-query-builder-service.js";
import { PlaceSearchService } from "./place-search-service.js";

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
  const pipeline = new PlaceOverpassPipeline(
    overpass,
    queryBuilder,
    areaResolver,
  );
  return {
    areaResolver,
    normalizer,
    overpass,
    queryBuilder,
    service: new PlaceSearchService(pipeline, normalizer),
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

  it("marks truncated when Overpass elements reach RESULT_LIMIT", async () => {
    const elements = Array.from({ length: RESULT_LIMIT }, (_, id) => ({
      id,
      type: "node" as const,
    }));
    const places = Array.from({ length: RESULT_LIMIT }, (_, id) =>
      makePlace({ geometryType: "POINT", id: `node/${id}` }),
    );
    const { service } = createService({
      normalizer: {
        normalize: vi.fn(() => places),
        normalizeWithGeometry: vi.fn(() => []),
      },
      overpass: { query: vi.fn(async () => ({ elements })) },
    });
    const result = await service.search(baseCriteria);
    expect(result.truncated).toBe(true);
  });

  it("marks truncated when Overpass page is full even if places drop", async () => {
    const elements = Array.from({ length: RESULT_LIMIT }, (_, id) => ({
      id,
      type: "node" as const,
    }));
    const places = Array.from({ length: RESULT_LIMIT - 1 }, (_, id) =>
      makePlace({ geometryType: "POINT", id: `node/${id}` }),
    );
    const { service } = createService({
      normalizer: {
        normalize: vi.fn(() => places),
        normalizeWithGeometry: vi.fn(() => []),
      },
      overpass: { query: vi.fn(async () => ({ elements })) },
    });
    const result = await service.search(baseCriteria);
    expect(result.places).toHaveLength(RESULT_LIMIT - 1);
    expect(result.truncated).toBe(true);
  });

  it("does not mark truncated below RESULT_LIMIT Overpass elements", async () => {
    const places = [makePlace({ geometryType: "POINT", id: "node/1" })];
    const { service } = createService({
      normalizer: {
        normalize: vi.fn(() => places),
        normalizeWithGeometry: vi.fn(() => []),
      },
      overpass: {
        query: vi.fn(async () => ({
          elements: [{ id: 1, type: "node" as const }],
        })),
      },
    });
    const result = await service.search(baseCriteria);
    expect(result.truncated).toBe(false);
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
