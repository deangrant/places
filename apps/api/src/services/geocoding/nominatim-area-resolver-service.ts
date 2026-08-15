import type { BBox, GeocodeResult } from "places-core";
import { NOMINATIM_ENDPOINT } from "places-core";

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
    url.searchParams.set("limit", "1");
    url.searchParams.set("email", this.contact.email);

    if (city) {
      url.searchParams.set("city", city);
    }
    if (region) {
      url.searchParams.set("state", region);
    }
    if (countryCode) {
      url.searchParams.set("country", countryCode);
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

    const rows = (await response.json()) as NominatimRow[];
    return rows.map(mapNominatimRow);
  }
}

interface NominatimRow {
  address?: {
    country_code?: string;
  };
  boundingbox: [string, string, string, string];
  class: string;
  display_name: string;
  lat: string;
  lon: string;
  osm_id: number;
  osm_type: string;
  type: string;
}

/**
 * Maps a Nominatim JSON row into the app geocode DTO.
 * @param row Raw Nominatim payload row.
 */
function mapNominatimRow(row: NominatimRow): GeocodeResult {
  const [south, north, west, east] = row.boundingbox.map(Number);
  const bbox: BBox = { east, north, south, west };
  return {
    boundingBox: bbox,
    class: row.class,
    countryCode: row.address?.country_code?.toUpperCase(),
    displayName: row.display_name,
    lat: Number(row.lat),
    lon: Number(row.lon),
    osmId: row.osm_id,
    osmType: row.osm_type,
    type: row.type,
  };
}
