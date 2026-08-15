import type { PlaceSearchCriteria } from "places-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HttpPlacesApiClient } from "./http-places-api-client.js";

const criteria: PlaceSearchCriteria = {
  city: "Seattle",
  countryCode: "US",
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function hangingFetch(
  _input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  return new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener(
      "abort",
      () => {
        reject(new DOMException("The operation was aborted.", "AbortError"));
      },
      { once: true },
    );
  });
}

describe("HttpPlacesApiClient abort fallback", () => {
  it("cancels fetch without AbortSignal.any when the caller aborts", async () => {
    const originalAny = AbortSignal.any;
    Object.defineProperty(AbortSignal, "any", {
      configurable: true,
      value: undefined,
    });

    let fetchSignal: AbortSignal | undefined;
    const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      fetchSignal = init?.signal;
      return hangingFetch(_input, init);
    });
    vi.stubGlobal("fetch", fetchMock);

    try {
      const client = new HttpPlacesApiClient("http://api.test");
      const controller = new AbortController();
      const pending = client.search(criteria, controller.signal);

      await vi.waitFor(() => {
        expect(fetchMock).toHaveBeenCalled();
      });

      controller.abort();

      await expect(pending).rejects.toSatisfy(
        (error: unknown) =>
          error instanceof DOMException && error.name === "AbortError",
      );
      expect(fetchSignal?.aborted).toBe(true);
    } finally {
      Object.defineProperty(AbortSignal, "any", {
        configurable: true,
        value: originalAny,
      });
    }
  });

  it("passes a timeout signal when no caller signal is provided", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({ places: [], truncated: false }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const client = new HttpPlacesApiClient("http://api.test");
    await client.search(criteria);

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });
});

describe("HttpPlacesApiClient response shape", () => {
  it("accepts a search body with a places array", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ places: [], scope: {}, truncated: false }),
      ),
    );
    const client = new HttpPlacesApiClient("http://api.test");
    await expect(client.search(criteria)).resolves.toEqual({
      places: [],
      scope: {},
      truncated: false,
    });
  });

  it("rejects a search body without a places array", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ truncated: false })),
    );
    const client = new HttpPlacesApiClient("http://api.test");
    await expect(client.search(criteria)).rejects.toThrow(
      /Deploy the web app and API from the same revision/,
    );
  });

  it("rejects an export body without a places array", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({})),
    );
    const client = new HttpPlacesApiClient("http://api.test");
    await expect(client.exportByGeometry(criteria, "POINT")).rejects.toThrow(
      /Deploy the web app and API from the same revision/,
    );
  });
});
