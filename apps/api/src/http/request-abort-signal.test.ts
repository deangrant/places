import { EventEmitter } from "node:events";
import type { ServerResponse } from "node:http";
import { describe, expect, it } from "vitest";
import {
  createPlacesRouteTimeoutSignal,
  errorForDomainMapping,
  isAbortError,
  isResponseClosed,
  isRouteTimeout,
  shouldQuietEndOnAbort,
} from "./request-abort-signal.js";

function mockResponse(
  partial: { destroyed?: boolean; writableEnded?: boolean } = {},
): ServerResponse {
  const emitter = new EventEmitter() as ServerResponse & EventEmitter;
  Object.defineProperty(emitter, "writableEnded", {
    configurable: true,
    get: () => partial.writableEnded ?? false,
  });
  Object.defineProperty(emitter, "destroyed", {
    configurable: true,
    get: () => partial.destroyed ?? false,
  });
  return emitter;
}

describe("createPlacesRouteTimeoutSignal", () => {
  it("aborts when the route timeout elapses", async () => {
    const signal = createPlacesRouteTimeoutSignal(30);

    expect(signal.aborted).toBe(false);
    await new Promise((resolve) => {
      signal.addEventListener("abort", resolve, { once: true });
    });
    expect(signal.aborted).toBe(true);
    expect(signal.reason).toMatchObject({ name: "TimeoutError" });
  });
});

describe("isResponseClosed", () => {
  it("detects ended or destroyed responses", () => {
    expect(isResponseClosed(mockResponse({ writableEnded: true }))).toBe(true);
    expect(isResponseClosed(mockResponse({ destroyed: true }))).toBe(true);
    expect(isResponseClosed(mockResponse())).toBe(false);
  });
});

describe("isAbortError", () => {
  it("recognizes AbortError by name only", () => {
    expect(
      isAbortError(
        new DOMException("The operation was aborted.", "AbortError"),
      ),
    ).toBe(true);
    expect(
      isAbortError(Object.assign(new Error("aborted"), { name: "AbortError" })),
    ).toBe(true);
    expect(isAbortError(new Error("This operation was aborted"))).toBe(false);
  });

  it("does not treat timeouts or ordinary errors as aborts", () => {
    expect(
      isAbortError(
        new DOMException("The operation timed out.", "TimeoutError"),
      ),
    ).toBe(false);
    expect(isAbortError(new Error("Could not reach the Overpass API."))).toBe(
      false,
    );
  });
});

describe("route timeout vs cancel", () => {
  it("detects TimeoutError on the thrown value", () => {
    const signal = createPlacesRouteTimeoutSignal(60_000);
    expect(
      isRouteTimeout(
        signal,
        new DOMException("The operation timed out.", "TimeoutError"),
      ),
    ).toBe(true);
  });

  it("detects AbortError after the route signal timed out", async () => {
    const signal = createPlacesRouteTimeoutSignal(30);
    await new Promise((resolve) => {
      signal.addEventListener("abort", resolve, { once: true });
    });
    const fetchAbort = new DOMException(
      "This operation was aborted",
      "AbortError",
    );
    expect(isRouteTimeout(signal, fetchAbort)).toBe(true);
    expect(shouldQuietEndOnAbort(fetchAbort, signal)).toBe(false);
    expect(errorForDomainMapping(fetchAbort, signal)).toMatchObject({
      name: "TimeoutError",
    });
  });

  it("quiet-ends true cancel when the route signal is still active", () => {
    const signal = createPlacesRouteTimeoutSignal(60_000);
    const cancel = new DOMException("The operation was aborted.", "AbortError");
    expect(shouldQuietEndOnAbort(cancel, signal)).toBe(true);
    expect(errorForDomainMapping(cancel, signal)).toBe(cancel);
  });
});
