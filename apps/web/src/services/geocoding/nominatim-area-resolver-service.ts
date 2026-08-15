import { NOMINATIM_ENDPOINT } from "@/constants/api.constants";
import type { BBox, GeocodeResult } from "@/types/places.types";

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
 * Nominatim-backed admin area resolver for Overpass spatial scope.
 */
export class NominatimAreaResolver implements IAreaResolver {
  private readonly endpoint: string;

  /**
   * @param endpoint Nominatim search URL.
   */
  constructor(endpoint: string = NOMINATIM_ENDPOINT) {
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
    // Browser clients cannot set User-Agent; Nominatim accepts email for contact.
    url.searchParams.set("email", "places-explorer@localhost");

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
      },
      signal,
    });

    if (!response.ok) {
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
