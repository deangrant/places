import { describe, expect, it } from "vitest";
import {
  mockServices,
  testConfig,
  withServer,
} from "./test/http-listener-harness.js";

const PROBLEM_JSON = /application\/problem\+json/;
const METHOD_NOT_ALLOWED_TYPE = /\/method-not-allowed$/;

describe("createRequestListener health methods", () => {
  it("rejects non-GET methods on live and ready with 405", async () => {
    await withServer(testConfig(), mockServices(), async (baseUrl) => {
      const live = await fetch(`${baseUrl}/health/live`, { method: "POST" });
      expect(live.status).toBe(405);
      expect(live.headers.get("Content-Type")).toMatch(PROBLEM_JSON);
      await expect(live.json()).resolves.toMatchObject({
        detail: "POST is not allowed for /health/live.",
        status: 405,
        title: "Method not allowed",
        type: expect.stringMatching(METHOD_NOT_ALLOWED_TYPE),
      });

      const ready = await fetch(`${baseUrl}/health/ready`, { method: "POST" });
      expect(ready.status).toBe(405);
      expect(ready.headers.get("Content-Type")).toMatch(PROBLEM_JSON);
      await expect(ready.json()).resolves.toMatchObject({
        detail: "POST is not allowed for /health/ready.",
        status: 405,
        title: "Method not allowed",
        type: expect.stringMatching(METHOD_NOT_ALLOWED_TYPE),
      });
    });
  });
});
