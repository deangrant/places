import { describe, expect, it } from "vitest";
import { safeTelHref } from "@/utils/safe-tel-href";

describe("safeTelHref", () => {
  it("accepts digits, leading plus, and an existing tel prefix", () => {
    expect(safeTelHref("5551234567")).toBe("tel:5551234567");
    expect(safeTelHref("+1 (555) 123-4567")).toBe("tel:+15551234567");
    expect(safeTelHref("tel:+44-20-7946-0958")).toBe("tel:+442079460958");
    expect(safeTelHref("tel:555-0100")).toBe("tel:5550100");
  });

  it("rejects empty or digit-less values", () => {
    expect(safeTelHref("")).toBeNull();
    expect(safeTelHref("   ")).toBeNull();
    expect(safeTelHref("tel:")).toBeNull();
    expect(safeTelHref("call-me")).toBeNull();
  });
});
