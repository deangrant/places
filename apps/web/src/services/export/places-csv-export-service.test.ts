import { describe, expect, it } from "vitest";
import {
  buildPlacesCsv,
  escapeCsvField,
  mapPlaceToExportRow,
  PLACE_CSV_BASE_COLUMNS,
  resolvePlaceCsvColumns,
} from "@/services/export/places-csv-export-service";
import type { Place } from "@/types/places.types";

/** Unneutralized formula cell starting a field (CSV injection regression). */
const UNPREFIXED_HYPERLINK_CELL = /(?:^|,)=HYPERLINK/;

function place(partial: Partial<Place> & Pick<Place, "id">): Place {
  return {
    brands: [],
    city: null,
    geometry: { polygons: [] },
    geometryType: "POINT",
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

describe("escapeCsvField", () => {
  it("quotes fields that contain commas, quotes, or newlines", () => {
    expect(escapeCsvField("plain")).toBe("plain");
    expect(escapeCsvField("a,b")).toBe('"a,b"');
    expect(escapeCsvField('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsvField("line\nbreak")).toBe('"line\nbreak"');
  });

  it("prefixes spreadsheet formula-risk values with an apostrophe", () => {
    expect(escapeCsvField("=cmd")).toBe("'=cmd");
    expect(escapeCsvField("+1")).toBe("'+1");
    expect(escapeCsvField("-1")).toBe("'-1");
    expect(escapeCsvField("@sum")).toBe("'@sum");
    expect(escapeCsvField(" =cmd")).toBe("' =cmd");
    expect(escapeCsvField("\t=cmd")).toBe("'\t=cmd");
    expect(escapeCsvField("\r=cmd")).toBe('"\'\r=cmd"');
    expect(escapeCsvField("\thostile")).toBe("'\thostile");
  });

  it("quotes formula-risk values that also need RFC4180 escaping", () => {
    expect(escapeCsvField("=cmd,run")).toBe('"\'=cmd,run"');
    expect(escapeCsvField('=say "hi"')).toBe('"\'=say ""hi"""');
  });
});

describe("resolvePlaceCsvColumns", () => {
  it("omits tags by default", () => {
    expect(resolvePlaceCsvColumns()).toEqual([...PLACE_CSV_BASE_COLUMNS]);
    expect(resolvePlaceCsvColumns({ includeTags: false })).not.toContain(
      "tags",
    );
  });

  it("appends tags when includeTags is true", () => {
    expect(resolvePlaceCsvColumns({ includeTags: true })).toEqual([
      ...PLACE_CSV_BASE_COLUMNS,
      "tags",
    ]);
  });
});

describe("mapPlaceToExportRow", () => {
  it("maps placekey, addr fallbacks, brand, and residual tags JSON", () => {
    const row = mapPlaceToExportRow(
      place({
        brands: ["Acme"],
        city: "Seattle",
        geometryType: "POLYGON",
        geometryWkt: "POLYGON((0 0,1 0,1 1,0 0))",
        id: "way/42",
        isoCountryCode: "US",
        locationName: "Acme Store",
        openHours: "24/7",
        postalCode: "98101",
        region: "WA",
        tags: {
          "addr:housenumber": "100",
          "addr:street": "Main St",
          "addr:unit": "B",
          building: "retail",
          opening_hours: "24/7",
          operator: "Acme Co",
          payment: "yes",
          "payment:credit_cards": "yes",
          website: "https://example.com",
        },
        website: "https://fallback.example",
      }),
    );

    expect(row.placekey).toBe("way/42");
    expect(row.addr_housenumber).toBe("100");
    expect(row.addr_street).toBe("Main St");
    expect(row.addr_unit).toBe("B");
    expect(row.addr_city).toBe("Seattle");
    expect(row.addr_state).toBe("WA");
    expect(row.addr_postcode).toBe("98101");
    expect(row.addr_country).toBe("US");
    expect(row.brand).toBe("Acme");
    expect(row.building).toBe("retail");
    expect(row.name).toBe("Acme Store");
    expect(row.website).toBe("https://example.com");
    expect(row.geometry_type).toBe("POLYGON");
    expect(row.wkt).toBe("POLYGON((0 0,1 0,1 1,0 0))");
    expect(JSON.parse(row.tags ?? "{}")).toEqual({
      opening_hours: "24/7",
      operator: "Acme Co",
      payment: "yes",
      "payment:credit_cards": "yes",
    });
    expect(row).not.toHaveProperty("opening_hours");
    expect(row).not.toHaveProperty("operator");
    expect(row).not.toHaveProperty("payment");
  });

  it("omits column-covered keys from tags while keeping residual keys", () => {
    const row = mapPlaceToExportRow(
      place({
        id: "node/7",
        tags: {
          amenity: "cafe",
          brand: "Acme",
          "contact:website": "https://contact.example",
          name: "Shop",
          "payment:visa": "yes",
          phone: "+1-555-0100",
          website: "https://example.com",
        },
      }),
    );
    const residual = JSON.parse(row.tags ?? "{}") as Record<string, string>;
    expect(residual).toEqual({
      amenity: "cafe",
      "payment:visa": "yes",
      phone: "+1-555-0100",
    });
    expect(residual).not.toHaveProperty("brand");
    expect(residual).not.toHaveProperty("name");
    expect(residual).not.toHaveProperty("website");
    expect(residual).not.toHaveProperty("contact:website");
  });

  it("falls back to POINT WKT when tags omit geometry", () => {
    const row = mapPlaceToExportRow(
      place({
        geometryType: "POINT",
        geometryWkt: "POINT(-122.3 47.6)",
        id: "node/1",
        tags: { name: "Only Name" },
      }),
    );
    expect(row.geometry_type).toBe("POINT");
    expect(row.wkt).toBe("POINT(-122.3 47.6)");
    expect(row.name).toBe("Only Name");
    expect(row.tags).toBe("{}");
  });

  it("prefers addr:province when addr:state is absent", () => {
    const row = mapPlaceToExportRow(
      place({
        id: "node/2",
        tags: { "addr:province": "California" },
      }),
    );
    expect(row.addr_state).toBe("California");
    expect(row.tags).toBe("{}");
  });
});

describe("buildPlacesCsv", () => {
  it("emits base header-only CSV for an empty list by default", () => {
    expect(buildPlacesCsv([])).toBe(`${PLACE_CSV_BASE_COLUMNS.join(",")}\n`);
  });

  it("omits the tags column when includeTags is off", () => {
    const csv = buildPlacesCsv([
      place({
        id: "node/9",
        tags: { amenity: "cafe", name: "Shop" },
      }),
    ]);
    const [header] = csv.trimEnd().split("\n");
    expect(header.split(",")).not.toContain("tags");
    expect(header.split(",")).not.toContain("opening_hours");
    expect(header.split(",")).not.toContain("operator");
    expect(header.split(",")).not.toContain("payment");
  });

  it("includes residual tags when includeTags is true", () => {
    const csv = buildPlacesCsv(
      [
        place({
          id: "node/9",
          tags: {
            amenity: "cafe",
            name: "Shop",
            opening_hours: "Mo-Fr 09:00-17:00",
            operator: "Acme",
          },
        }),
      ],
      { includeTags: true },
    );
    const [header, dataLine] = csv.trimEnd().split("\n");
    expect(header.split(",").at(-1)).toBe("tags");
    expect(dataLine).toContain("opening_hours");
    expect(dataLine).toContain("operator");
    expect(dataLine).toContain("amenity");
  });

  it("quotes JSON and comma-containing fields", () => {
    const csv = buildPlacesCsv([
      place({
        id: "node/9",
        locationName: "Cafe, Downtown",
        tags: { name: 'Cafe "Downtown"' },
      }),
    ]);
    const [, dataLine] = csv.trimEnd().split("\n");
    expect(dataLine).toContain('"Cafe ""Downtown"""');
    expect(dataLine).toContain("node/9");
  });

  it("neutralizes formula-risk OSM name values in the CSV body", () => {
    const csv = buildPlacesCsv([
      place({
        id: "node/99",
        tags: { name: '=HYPERLINK("http://evil.example")' },
      }),
    ]);
    const [, dataLine] = csv.trimEnd().split("\n");
    expect(dataLine).toContain("'=HYPERLINK");
    expect(dataLine).not.toMatch(UNPREFIXED_HYPERLINK_CELL);
  });
});
