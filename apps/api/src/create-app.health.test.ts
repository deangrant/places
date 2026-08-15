import { describe, expect, it } from "vitest";
import {
  mockServices,
  testConfig,
  withServer,
} from "./test/http-listener-harness.js";

describe("createRequestListener health methods", () => {
  it("rejects non-GET methods on live and ready with 405", async () => {
    await withServer(testConfig(), mockServices(), async (baseUrl) => {
      for (const path of ["/health/live", "/health/ready"] as const) {
        const response = await fetch(`${baseUrl}${path}`, { method: "POST" });
        expect(response.status).toBe(405);
        expect(response.headers.get("Content-Type")).toMatch(
          /application\/problem\+json/,
        );
        await expect(response.json()).resolves.toMatchObject({
          detail: `POST is not allowed for ${path}.`,
          status: 405,
          title: "Method not allowed",
          type: expect.stringMatching(/\/method-not-allowed$/),
        });
      }
    });
  });
});
