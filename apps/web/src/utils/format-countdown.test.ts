import { describe, expect, it } from "vitest";
import { formatCountdown } from "@/utils/format-countdown";

describe("formatCountdown", () => {
  it("formats zero and sub-minute values as M:SS", () => {
    expect(formatCountdown(0)).toBe("0:00");
    expect(formatCountdown(59)).toBe("0:59");
  });

  it("formats exact and multi-minute values", () => {
    expect(formatCountdown(60)).toBe("1:00");
    expect(formatCountdown(125)).toBe("2:05");
  });
});
