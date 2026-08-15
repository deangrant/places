import { renderHook } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { useFixedVirtualList } from "@/pages/Places/components/ResultsList/use-fixed-virtual-list";

describe("useFixedVirtualList", () => {
  it("returns a bounded window for the current viewport", () => {
    const scrollElement = document.createElement("div");
    Object.defineProperty(scrollElement, "clientHeight", {
      configurable: true,
      value: 216,
    });
    Object.defineProperty(scrollElement, "scrollTop", {
      configurable: true,
      value: 0,
    });
    const scrollElementRef = createRef<HTMLElement | null>();
    (scrollElementRef as { current: HTMLElement | null }).current =
      scrollElement;

    const { result } = renderHook(() =>
      useFixedVirtualList({
        count: 100,
        overscan: 2,
        rowHeight: 72,
        scrollElementRef,
      }),
    );

    // viewport 216px => 3 visible + 2*2 overscan => 7 rows
    expect(result.current.totalHeight).toBe(7200);
    expect(result.current.virtualItems).toHaveLength(7);
    expect(result.current.virtualItems[0]).toEqual({ index: 0, start: 0 });
    expect(result.current.virtualItems.at(-1)?.index).toBe(6);
  });
});
