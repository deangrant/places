import { afterEach, describe, expect, it, vi } from "vitest";
import { OVERPASS_TIMEOUT_SECONDS } from "@/constants/api.constants";
import {
  OverpassError,
  OverpassHttpClient,
  overpassTimeoutMessage,
} from "@/services/overpass/overpass-http-client";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("OverpassHttpClient query timeout", () => {
  it("throws OverpassError when the client timeout elapses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url: string, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener(
              "abort",
              () => {
                reject(
                  new DOMException("The operation was aborted.", "AbortError"),
                );
              },
              { once: true },
            );
          }),
      ),
    );

    const client = new OverpassHttpClient(
      "https://example.test/interpreter",
      25,
    );
    await expect(client.query("[out:json];out;")).rejects.toSatisfy(
      (error: unknown) =>
        error instanceof OverpassError &&
        error.message === overpassTimeoutMessage(),
    );
  });

  it("rethrows when the caller signal aborts instead of rewriting as timeout", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url: string, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener(
              "abort",
              () => {
                reject(
                  new DOMException("The operation was aborted.", "AbortError"),
                );
              },
              { once: true },
            );
          }),
      ),
    );

    const controller = new AbortController();
    const client = new OverpassHttpClient(
      "https://example.test/interpreter",
      OVERPASS_TIMEOUT_SECONDS * 1000,
    );
    const pending = client.query("[out:json];out;", controller.signal);
    controller.abort();

    await expect(pending).rejects.toSatisfy(
      (error: unknown) =>
        error instanceof DOMException && error.name === "AbortError",
    );
  });
});

describe("overpassTimeoutMessage", () => {
  it("includes the configured Overpass timeout seconds", () => {
    expect(overpassTimeoutMessage()).toContain(
      String(OVERPASS_TIMEOUT_SECONDS),
    );
  });
});
