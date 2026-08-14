import { describe, expect, it, vi } from "vitest";
import { RESULT_LIMIT } from "@/constants/api.constants";
import type { IAreaResolver } from "@/services/geocoding/nominatim-area-resolver";
import type { IOverpassClient } from "@/services/overpass/overpass-http-client";
import type { IOsmPlaceNormalizer } from "@/services/places/osm-place-normalizer";
import type { IPlaceQueryBuilder } from "@/services/places/place-query-builder";
import { PlaceSearchService } from "@/services/places/place-search-service";
import type {
  GeocodeResult,
  OsmElement,
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
    buildGeometryQuery: vi.fn(() => "geom"),
  };
  const normalizer: IOsmPlaceNormalizer = options.normalizer ?? {
    normalize: vi.fn(() => []),
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
      buildGeometryQuery: vi.fn(() => "geom"),
    };
    const { service } = createService({
      areaResolver: { resolveAdmin: vi.fn(async () => adminNode) },
      queryBuilder,
    });
    await service.search(baseCriteria);
    expect(queryBuilder.build).toHaveBeenCalledWith(
      baseCriteria,
      expect.objectContaining({ bbox: adminNode.boundingBox }),
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

describe("PlaceSearchService.fetchPlaceGeometry", () => {
  it("returns null for nodes", async () => {
    const { service } = createService({});
    await expect(service.fetchPlaceGeometry("node", 1)).resolves.toBeNull();
  });

  it("hydrates geometry from the first Overpass element", async () => {
    const element: OsmElement = {
      geometry: [
        { lat: 0, lon: 0 },
        { lat: 0, lon: 1 },
        { lat: 1, lon: 1 },
        { lat: 1, lon: 0 },
        { lat: 0, lon: 0 },
      ],
      id: 9,
      type: "way",
    };
    const { service } = createService({
      overpass: { query: vi.fn(async () => ({ elements: [element] })) },
    });
    const update = await service.fetchPlaceGeometry("way", 9);
    expect(update).not.toBeNull();
    if (!update) {
      return;
    }
    expect(update.geometryType).toBe("POLYGON");
    expect(update.geometry.polygons).toHaveLength(1);
  });
});
