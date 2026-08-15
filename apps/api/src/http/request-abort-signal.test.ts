import { EventEmitter } from "node:events";
import type { IncomingMessage, ServerResponse } from "node:http";
import { describe, expect, it } from "vitest";
import {
  createDisconnectSignal,
  createPlacesRequestSignal,
  isResponseClosed,
} from "./request-abort-signal.js";

function mockRequest(
  partial: { aborted?: boolean; destroyed?: boolean } = {},
): IncomingMessage {
  const emitter = new EventEmitter() as IncomingMessage & EventEmitter;
  Object.defineProperty(emitter, "aborted", {
    configurable: true,
    get: () => partial.aborted ?? false,
  });
  Object.defineProperty(emitter, "destroyed", {
    configurable: true,
    get: () => partial.destroyed ?? false,
  });
  return emitter;
}

function mockResponse(
  partial: {
    destroyed?: boolean;
    writableEnded?: boolean;
    writableFinished?: boolean;
  } = {},
): ServerResponse {
  const emitter = new EventEmitter() as ServerResponse & EventEmitter;
  Object.defineProperty(emitter, "writableFinished", {
    configurable: true,
    get: () => partial.writableFinished ?? false,
  });
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

describe("createDisconnectSignal", () => {
  it("aborts when the response closes before it finishes", async () => {
    const req = mockRequest();
    const res = mockResponse({ writableFinished: false });
    const signal = createDisconnectSignal(req, res);

    expect(signal.aborted).toBe(false);
    res.emit("close");
    expect(signal.aborted).toBe(true);
  });

  it("does not abort when the response closes after finishing", () => {
    const req = mockRequest();
    const res = mockResponse({ writableFinished: true });
    const signal = createDisconnectSignal(req, res);

    res.emit("close");
    expect(signal.aborted).toBe(false);
  });

  it("aborts when the request emits aborted", () => {
    const req = mockRequest();
    const res = mockResponse({ writableFinished: false });
    const signal = createDisconnectSignal(req, res);

    req.emit("aborted");
    expect(signal.aborted).toBe(true);
  });

  it("starts aborted when the request is already destroyed", () => {
    const req = mockRequest({ destroyed: true });
    const res = mockResponse();
    const signal = createDisconnectSignal(req, res);
    expect(signal.aborted).toBe(true);
  });
});

describe("createPlacesRequestSignal", () => {
  it("aborts when the route timeout elapses", async () => {
    const req = mockRequest();
    const res = mockResponse({ writableFinished: false });
    const signal = createPlacesRequestSignal(req, res, 30);

    expect(signal.aborted).toBe(false);
    await new Promise((resolve) => {
      signal.addEventListener("abort", resolve, { once: true });
    });
    expect(signal.aborted).toBe(true);
  });

  it("aborts on disconnect before the timeout", () => {
    const req = mockRequest();
    const res = mockResponse({ writableFinished: false });
    const signal = createPlacesRequestSignal(req, res, 60_000);

    res.emit("close");
    expect(signal.aborted).toBe(true);
  });
});

describe("isResponseClosed", () => {
  it("detects ended or destroyed responses", () => {
    expect(isResponseClosed(mockResponse({ writableEnded: true }))).toBe(true);
    expect(isResponseClosed(mockResponse({ destroyed: true }))).toBe(true);
    expect(isResponseClosed(mockResponse())).toBe(false);
  });
});
