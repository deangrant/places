import type { Place } from "@/types/places.types";

/** Always-exported CSV column headers for Places geometry export. */
export const PLACE_CSV_BASE_COLUMNS = [
  "placekey",
  "addr_housenumber",
  "addr_street",
  "addr_unit",
  "addr_city",
  "addr_state",
  "addr_postcode",
  "addr_country",
  "brand",
  "building",
  "name",
  "website",
  "geometry_type",
  "wkt",
] as const;

/** Optional residual-tags column appended when Include Tags is enabled. */
export const PLACE_CSV_TAGS_COLUMN = "tags" as const;

/**
 * All CSV columns that may appear in an export (base + optional tags).
 * Prefer {@link resolvePlaceCsvColumns} for the active header set.
 */
export const PLACE_CSV_COLUMNS = [
  ...PLACE_CSV_BASE_COLUMNS,
  PLACE_CSV_TAGS_COLUMN,
] as const;

const CSV_ESCAPE_PATTERN = /[",\n\r]/;

/** Cells that spreadsheets may treat as formulas (OWASP CSV injection). */
const CSV_FORMULA_RISK_PATTERN = /^([\t\r]|[ \t\r]*[=+\-@])/;

/** OSM keys already represented by dedicated CSV columns (omitted from `tags`). */
const TAGS_COLUMN_EXCLUDED_KEYS = new Set([
  "addr:city",
  "addr:country",
  "addr:housenumber",
  "addr:postcode",
  "addr:province",
  "addr:state",
  "addr:street",
  "addr:unit",
  "brand",
  "building",
  "contact:website",
  "name",
  "website",
]);

/** Base CSV column name. */
export type PlaceCsvBaseColumn = (typeof PLACE_CSV_BASE_COLUMNS)[number];

/** Any CSV column that may appear in an export. */
export type PlaceCsvColumn = PlaceCsvBaseColumn | typeof PLACE_CSV_TAGS_COLUMN;

/**
 * Client-only options for CSV shaping (not sent to the Places BFF).
 */
export interface PlacesCsvExportOptions {
  /**
   * When true, appends a `tags` column of residual OSM key/value pairs.
   * Defaults to false.
   */
  includeTags?: boolean;
}

/** One CSV export row; `tags` is present only when Include Tags is enabled. */
export type PlaceCsvRow = Record<PlaceCsvBaseColumn, string> & {
  tags?: string;
};

/**
 * Returns the ordered CSV header columns for the given export options.
 * @param options Client CSV shaping options.
 */
export function resolvePlaceCsvColumns(
  options?: PlacesCsvExportOptions,
): readonly PlaceCsvColumn[] {
  if (options?.includeTags === true) {
    return [...PLACE_CSV_BASE_COLUMNS, PLACE_CSV_TAGS_COLUMN];
  }
  return PLACE_CSV_BASE_COLUMNS;
}

/**
 * Maps a Place into a snake_case CSV row using in-memory fields and OSM tags.
 * Always includes residual `tags` JSON; callers omit that field from the CSV
 * when Include Tags is off.
 * @param place Place from the latest (possibly filtered) search result.
 */
export function mapPlaceToExportRow(place: Place): PlaceCsvRow {
  const {
    brands,
    city,
    geometryType,
    geometryWkt,
    id,
    isoCountryCode,
    locationName,
    postalCode,
    region,
    tags,
    website,
  } = place;
  return {
    addr_city: readTag(tags, "addr:city") || city || "",
    addr_country: readTag(tags, "addr:country") || isoCountryCode || "",
    addr_housenumber: readTag(tags, "addr:housenumber"),
    addr_postcode: readTag(tags, "addr:postcode") || postalCode || "",
    addr_state:
      readTag(tags, "addr:state") ||
      readTag(tags, "addr:province") ||
      region ||
      "",
    addr_street: readTag(tags, "addr:street"),
    addr_unit: readTag(tags, "addr:unit"),
    brand: readTag(tags, "brand") || brands.join(";") || "",
    building: readTag(tags, "building"),
    geometry_type: geometryType,
    name: readTag(tags, "name") || locationName || "",
    placekey: id,
    tags: formatResidualTags(tags),
    website:
      readTag(tags, "website") ||
      readTag(tags, "contact:website") ||
      website ||
      "",
    wkt: geometryWkt,
  };
}

/**
 * Builds an RFC4180 CSV document for the given places.
 * @param places Places to export.
 * @param options Client CSV shaping options.
 */
export function buildPlacesCsv(
  places: Place[],
  options?: PlacesCsvExportOptions,
): string {
  const columns = resolvePlaceCsvColumns(options);
  const header = columns.join(",");
  if (places.length === 0) {
    return `${header}\n`;
  }
  const includeTags = options?.includeTags === true;
  const lines = places.map((place) => {
    const row = mapPlaceToExportRow(place);
    return columns
      .map((column) => {
        if (column === PLACE_CSV_TAGS_COLUMN) {
          return escapeCsvField(includeTags ? (row.tags ?? "{}") : "");
        }
        return escapeCsvField(row[column]);
      })
      .join(",");
  });
  return `${header}\n${lines.join("\n")}\n`;
}

/**
 * Browser adapter that downloads Places CSV via an anchor click.
 */
export interface IPlacesCsvDownloader {
  /**
   * Triggers a CSV download for the given places.
   * @param places Places to export.
   * @param options Client CSV options and optional download filename.
   */
  download: (
    places: Place[],
    options?: PlacesCsvExportOptions & { filename?: string },
  ) => void;
}

/**
 * Triggers a browser download of places as CSV.
 * @param places Places to export (typically the filtered map/list set).
 * @param options Client CSV options and optional download filename.
 */
export function downloadPlacesCsv(
  places: Place[],
  options?: PlacesCsvExportOptions & { filename?: string },
): void {
  const { filename = defaultExportFilename(), ...csvOptions } = options ?? {};
  const csv = buildPlacesCsv(places, csvOptions);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/** Default browser CSV downloader used by the export modal. */
export const browserPlacesCsvDownloader: IPlacesCsvDownloader = {
  download: downloadPlacesCsv,
};

/**
 * Escapes a CSV field for spreadsheet-safe RFC4180 output.
 * Prefixes formula-risk values with `'` then quotes when needed.
 * @param value Raw field value.
 */
export function escapeCsvField(value: string): string {
  let cell = value;
  if (CSV_FORMULA_RISK_PATTERN.test(cell)) {
    cell = `'${cell}`;
  }
  if (CSV_ESCAPE_PATTERN.test(cell)) {
    return `"${cell.replaceAll('"', '""')}"`;
  }
  return cell;
}

/**
 * Builds a timestamped default CSV filename.
 */
function defaultExportFilename(): string {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    "-",
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
  ].join("");
  return `places-export-${stamp}.csv`;
}

/**
 * JSON of OSM tags not already exported as dedicated columns, keys sorted.
 * @param tags Raw OSM tags on the place.
 */
function formatResidualTags(tags: Record<string, string>): string {
  const residualEntries = Object.entries(tags)
    .filter(([key]) => !TAGS_COLUMN_EXCLUDED_KEYS.has(key))
    .sort(([left], [right]) => left.localeCompare(right));
  return JSON.stringify(Object.fromEntries(residualEntries));
}

/**
 * Reads an OSM tag when present; otherwise returns an empty string.
 * @param tags OSM tags.
 * @param key Tag key.
 */
function readTag(tags: Record<string, string>, key: string): string {
  if (!Object.hasOwn(tags, key)) {
    return "";
  }
  return tags[key];
}
