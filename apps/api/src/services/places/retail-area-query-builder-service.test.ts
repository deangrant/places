import { describe, expect, it } from "vitest";
import { RetailAreaQueryBuilder } from "./retail-area-query-builder-service.js";

describe("RetailAreaQueryBuilder", () => {
  const builder = new RetailAreaQueryBuilder();

  it("queries landuse=retail, shop=mall, and landuse=commercial with out geom in an area scope", () => {
    const query = builder.build({ areaId: 3_600_000_100 });
    expect(query).toContain('wr["landuse"="retail"](area.searchArea)');
    expect(query).toContain('wr["shop"="mall"](area.searchArea)');
    expect(query).toContain('wr["landuse"="commercial"](area.searchArea)');
    expect(query).toContain("out geom");
    expect(query).toContain("area(3600000100)->.searchArea");
  });

  it("uses a bbox filter when no area id is present", () => {
    const query = builder.build({
      bbox: { east: 2, north: 3, south: 0, west: 1 },
    });
    expect(query).toContain('wr["landuse"="retail"](0,1,3,2)');
    expect(query).toContain('wr["shop"="mall"](0,1,3,2)');
    expect(query).toContain('wr["landuse"="commercial"](0,1,3,2)');
  });
});
