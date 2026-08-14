import { describe, expect, it } from "vitest";
import { safeHttpUrl } from "@/utils/safe-http-url";

const HTTP_SCHEME = /^http:\/\//;

describe("safeHttpUrl", () => {
  it("accepts http(s) and scheme-less hosts", () => {
    expect(safeHttpUrl("https://example.com/a")).toBe("https://example.com/a");
    expect(safeHttpUrl("http://example.com")).toMatch(HTTP_SCHEME);
    expect(safeHttpUrl("example.com")).toBe("https://example.com/");
    expect(safeHttpUrl("//cdn.example.com/x")).toBe(
      "https://cdn.example.com/x",
    );
  });

  it("rejects non-http schemes", () => {
    expect(safeHttpUrl("javascript:alert(1)")).toBeNull();
    expect(safeHttpUrl("data:text/html,hi")).toBeNull();
    expect(safeHttpUrl("ftp://files.example.com")).toBeNull();
    expect(safeHttpUrl("")).toBeNull();
  });
});
