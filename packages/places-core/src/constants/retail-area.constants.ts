/**
 * OSM tag predicates that identify enclosing retail-area polygons for export.
 */
export const RETAIL_AREA_TAG_SELECTORS = [
  { key: "landuse", value: "retail" },
  { key: "shop", value: "mall" },
  { key: "landuse", value: "commercial" },
] as const;
