import { describe, expect, it } from "vitest";
import { loadApiConfig } from "./config.js";

const REQUIRED_ENV = {
  NOMINATIM_EMAIL: "test@example.com",
  NOMINATIM_USER_AGENT: "PlacesAPI/test",
} as const;

describe("loadApiConfig host", () => {
  it("defaults HOST to 127.0.0.1 when unset", () => {
    const config = loadApiConfig({ ...REQUIRED_ENV });
    expect(config.host).toBe("127.0.0.1");
  });

  it("respects an explicit HOST override", () => {
    const config = loadApiConfig({
      ...REQUIRED_ENV,
      HOST: "0.0.0.0",
    });
    expect(config.host).toBe("0.0.0.0");
  });

  it("rejects a blank HOST", () => {
    expect(() =>
      loadApiConfig({
        ...REQUIRED_ENV,
        HOST: "   ",
      }),
    ).toThrow(/HOST must be a non-empty listen address/);
  });
});
