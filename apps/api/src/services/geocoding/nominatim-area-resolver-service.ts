import { NOMINATIM_ENDPOINT } from "places-core/overpass";
import type { BBox, GeocodeResult } from "places-core/places";

/**
 * Resolves administrative areas for Overpass spatial scoping.
 */
export interface IAreaResolver {
  /**
   * Resolves country / region / city filters into a geocode result suitable
   * for Overpass area conversion.
   * @param parts Structured geography filters.
   * @param signal Optional abort signal.
   */
  resolveAdmin: (
    parts: { countryCode?: string; region?: string; city?: string },
    signal?: AbortSignal,
  ) => Promise<GeocodeResult | null>;
}

/**
 * Contact identity required by Nominatim usage policy.
 */
export interface NominatimContact {
  /** Contact email query parameter. */
  email: string;
  /** Identifying User-Agent header value. */
  userAgent: string;
}

const OSM_TYPES = new Set(["node", "way", "relation"]);
const NOMINATIM_RESULT_LIMIT = 5;

/**
 * Nominatim-backed admin area resolver for Overpass spatial scope.
 */
export class NominatimAreaResolver implements IAreaResolver {
  private readonly endpoint: string;
  private readonly contact: NominatimContact;

  /**
   * @param contact Nominatim User-Agent and email.
   * @param endpoint Nominatim search URL.
   */
  constructor(
    contact: NominatimContact,
    endpoint: string = NOMINATIM_ENDPOINT,
  ) {
    this.contact = contact;
    this.endpoint = endpoint;
  }

  /**
   * Resolves country / region / city filters into a geocode result suitable
   * for Overpass area conversion.
   */
  async resolveAdmin(
    parts: { countryCode?: string; region?: string; city?: string },
    signal?: AbortSignal,
  ): Promise<GeocodeResult | null> {
    const { countryCode, region, city } = parts;
    if (!(countryCode || region || city)) {
      return null;
    }

    const url = new URL(this.endpoint);
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", String(NOMINATIM_RESULT_LIMIT));
    url.searchParams.set("email", this.contact.email);

    if (city) {
      url.searchParams.set("city", city);
    }
    if (region) {
      url.searchParams.set("state", region);
    }
    if (countryCode) {
      url.searchParams.set("country", countryCode);
      url.searchParams.set("countrycodes", countryCode.toLowerCase());
    }

    if (city) {
      url.searchParams.set("featureType", "city");
    } else if (region) {
      url.searchParams.set("featureType", "state");
    } else {
      url.searchParams.set("featureType", "country");
    }

    const results = await this.fetchResults(url, signal);
    const preferred =
      results.find(
        (result) => result.osmType === "relation" || result.osmType === "way",
      ) ?? results[0];
    return preferred ?? null;
  }

  /**
   * Performs a Nominatim GET and maps JSON rows to GeocodeResult.
   * @param url Fully built Nominatim URL.
   * @param signal Optional abort signal.
   */
  private async fetchResults(
    url: URL,
    signal?: AbortSignal,
  ): Promise<GeocodeResult[]> {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": this.contact.userAgent,
      },
      signal,
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error(
          "Location search was blocked by Nominatim (HTTP 403). Set NOMINATIM_USER_AGENT and NOMINATIM_EMAIL in apps/api/.env to a real app identity and reachable email (example.com is rejected). See https://operations.osmfoundation.org/policies/nominatim/",
        );
      }
      throw new Error(
        `Location search failed (HTTP ${response.status}). Try again shortly.`,
      );
    }

    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) {
      return [];
    }

    const results: GeocodeResult[] = [];
    for (const row of payload) {
      const mapped = tryMapNominatimRow(row);
      if (mapped) {
        results.push(mapped);
      }
    }
    return results;
  }
}

/**
 * Maps a Nominatim JSON row into the app geocode DTO when valid.
 * @param row Unknown JSON row.
 */
export function tryMapNominatimRow(row: unknown): GeocodeResult | null {
  if (!isPlainObject(row)) {
    return null;
  }

  const osmType = row.osm_type;
  if (typeof osmType !== "string" || !OSM_TYPES.has(osmType)) {
    return null;
  }

  const osmId = Number(row.osm_id);
  const lat = Number(row.lat);
  const lon = Number(row.lon);
  if (
    !(Number.isFinite(osmId) && Number.isFinite(lat) && Number.isFinite(lon))
  ) {
    return null;
  }

  const bbox = parseBoundingBox(row.boundingbox);
  if (!bbox) {
    return null;
  }

  const displayName = row.display_name;
  if (typeof displayName !== "string" || displayName.trim() === "") {
    return null;
  }

  const address = isPlainObject(row.address) ? row.address : undefined;
  const countryRaw = address?.country_code;
  const countryCode =
    typeof countryRaw === "string" ? countryRaw.toUpperCase() : undefined;

  return {
    boundingBox: bbox,
    class: typeof row.class === "string" ? row.class : "",
    countryCode,
    displayName,
    lat,
    lon,
    osmId,
    osmType,
    type: typeof row.type === "string" ? row.type : "",
  };
}

/**
 * Parses Nominatim boundingbox into a finite BBox with south &lt; north.
 * @param value Raw boundingbox field.
 */
function parseBoundingBox(value: unknown): BBox | null {
  if (!Array.isArray(value) || value.length !== 4) {
    return null;
  }
  const south = Number(value[0]);
  const north = Number(value[1]);
  const west = Number(value[2]);
  const east = Number(value[3]);
  if (
    !(
      Number.isFinite(south) &&
      Number.isFinite(north) &&
      Number.isFinite(west) &&
      Number.isFinite(east)
    )
  ) {
    return null;
  }
  if (!(south < north)) {
    return null;
  }
  return { east, north, south, west };
}

/**
 * True when every bbox corner is a finite number.
 * @param bbox Bounding box to check.
 */
export function isFiniteBBox(bbox: BBox): boolean {
  return (
    Number.isFinite(bbox.south) &&
    Number.isFinite(bbox.west) &&
    Number.isFinite(bbox.north) &&
    Number.isFinite(bbox.east)
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
