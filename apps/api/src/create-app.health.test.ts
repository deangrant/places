import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { describe, expect, it, vi } from "vitest";
import type { ApiConfig } from "./config.js";
import { createRequestListener } from "./create-app.js";
import type { ApiServices } from "./create-services.js";
import { PlacesRateLimiter } from "./http/rate-limit.js";

function testConfig(): ApiConfig {
  return {
    corsOrigins: ["http://localhost:5173"],
    host: "127.0.0.1",
    maxBodyBytes: 1_048_576,
    nominatimEmail: "test@example.com",
    nominatimUserAgent: "PlacesAPI/test",
    port: 0,
    rateLimit: {
      burst: 2,
      maxConcurrent: 2,
      refillPerMinute: 1,
    },
  };
}

function mockServices(): ApiServices {
  return {
    brandCatalog: {} as ApiServices["brandCatalog"],
    placeExport: {
      exportByGeometry: vi.fn(async () => []),
    },
    placeSearch: {
      search: vi.fn(async () => ({
        places: [],
        scope: {},
        truncated: false,
      })),
    },
    taxonomy: {} as ApiServices["taxonomy"],
  };
}

async function withServer(
  run: (baseUrl: string) => Promise<void>,
): Promise<void> {
  const config = testConfig();
  const server = createServer(
    createRequestListener(
      config,
      mockServices(),
      new PlacesRateLimiter(config.rateLimit),
    ),
  );
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });
  const { port } = server.address() as AddressInfo;
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

describe("createRequestListener health methods", () => {
  it("rejects non-GET methods on live and ready with 405", async () => {
    await withServer(async (baseUrl) => {
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
