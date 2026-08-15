import type { Place } from "@/types/places.types";

/** Ordered CSV column headers for Places export. */
export const PLACE_CSV_COLUMNS = [
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
  "opening_hours",
  "operator",
  "payment",
  "tags",
  "website",
  "geometry_type",
  "wkt",
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
  "opening_hours",
  "operator",
  "payment",
  "website",
]);

/** One CSV export row keyed by snake_case column name. */
export type PlaceCsvRow = Record<(typeof PLACE_CSV_COLUMNS)[number], string>;

/**
 * Maps a Place into a snake_case CSV row using in-memory fields and OSM tags.
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
    openHours,
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
    opening_hours: readTag(tags, "opening_hours") || openHours || "",
    operator: readTag(tags, "operator"),
    payment: formatPaymentTags(tags),
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
 */
export function buildPlacesCsv(places: Place[]): string {
  const header = PLACE_CSV_COLUMNS.join(",");
  if (places.length === 0) {
    return `${header}\n`;
  }
  const lines = places.map((place) => {
    const row = mapPlaceToExportRow(place);
    return PLACE_CSV_COLUMNS.map((column) => escapeCsvField(row[column])).join(
      ",",
    );
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
   * @param filename Optional download filename.
   */
  download: (places: Place[], filename?: string) => void;
}

/**
 * Triggers a browser download of places as CSV.
 * @param places Places to export (typically the filtered map/list set).
 * @param filename Optional download filename.
 */
export function downloadPlacesCsv(
  places: Place[],
  filename: string = defaultExportFilename(),
): void {
  const csv = buildPlacesCsv(places);
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
 * Collects payment-related OSM tags into a stable JSON object string.
 * @param tags Raw OSM tags on the place.
 */
function formatPaymentTags(tags: Record<string, string>): string {
  const paymentEntries = Object.entries(tags)
    .filter(([key]) => isPaymentTagKey(key))
    .sort(([left], [right]) => left.localeCompare(right));
  if (paymentEntries.length === 0) {
    return "";
  }
  return JSON.stringify(Object.fromEntries(paymentEntries));
}

/**
 * JSON of OSM tags not already exported as dedicated columns, keys sorted.
 * @param tags Raw OSM tags on the place.
 */
function formatResidualTags(tags: Record<string, string>): string {
  const residualEntries = Object.entries(tags)
    .filter(([key]) => !isExcludedFromTagsColumn(key))
    .sort(([left], [right]) => left.localeCompare(right));
  return JSON.stringify(Object.fromEntries(residualEntries));
}

/**
 * True when an OSM key is already covered by a dedicated CSV column.
 * @param key OSM tag key.
 */
function isExcludedFromTagsColumn(key: string): boolean {
  return TAGS_COLUMN_EXCLUDED_KEYS.has(key) || isPaymentTagKey(key);
}

/**
 * True when an OSM key belongs in the payment column.
 * @param key OSM tag key.
 */
function isPaymentTagKey(key: string): boolean {
  return key === "payment" || key.startsWith("payment:");
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
