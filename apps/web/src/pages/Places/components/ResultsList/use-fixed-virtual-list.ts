import {
  type RefObject,
  useCallback,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";

/**
 * One row in a fixed-height virtual window.
 */
export interface FixedVirtualItem {
  /** Zero-based index into the source list. */
  index: number;
  /** Pixel offset from the top of the spacer. */
  start: number;
}

/**
 * Options for {@link useFixedVirtualList}.
 */
export interface UseFixedVirtualListOptions {
  /** Total number of rows in the full list. */
  count: number;
  /** Extra rows rendered above and below the viewport. */
  overscan?: number;
  /** Fixed pixel height of each row. */
  rowHeight: number;
  /** Scrollable viewport element. */
  scrollElementRef: RefObject<HTMLElement | null>;
}

/**
 * Result of {@link useFixedVirtualList}.
 */
export interface UseFixedVirtualListResult {
  /** Total scrollable height for the spacer (`count * rowHeight`). */
  totalHeight: number;
  /** Rows that should be mounted for the current scroll position. */
  virtualItems: FixedVirtualItem[];
}

/**
 * Computes a fixed-row virtual window for a scroll parent.
 * @param options Count, row height, overscan, and scroll element ref.
 */
export function useFixedVirtualList({
  count,
  overscan = 8,
  rowHeight,
  scrollElementRef,
}: UseFixedVirtualListOptions): UseFixedVirtualListResult {
  const [range, setRange] = useState({ end: 0, start: 0 });

  const updateRange = useCallback(() => {
    const element = scrollElementRef.current;
    if (!element || count === 0 || rowHeight <= 0) {
      setRange({ end: 0, start: 0 });
      return;
    }

    const { clientHeight: viewportHeight, scrollTop } = element;
    const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const visibleCount = Math.ceil(viewportHeight / rowHeight) + overscan * 2;
    const end = Math.min(count, start + Math.max(visibleCount, 1));
    setRange((prev) =>
      prev.start === start && prev.end === end ? prev : { end, start },
    );
  }, [count, overscan, rowHeight, scrollElementRef]);

  useLayoutEffect(() => {
    const element = scrollElementRef.current;
    if (!element) {
      return;
    }

    updateRange();
    element.addEventListener("scroll", updateRange, { passive: true });

    let resizeObserver: ResizeObserver | undefined;
    if (typeof ResizeObserver === "function") {
      resizeObserver = new ResizeObserver(() => {
        updateRange();
      });
      resizeObserver.observe(element);
    }

    return () => {
      element.removeEventListener("scroll", updateRange);
      resizeObserver?.disconnect();
    };
  }, [scrollElementRef, updateRange]);

  const virtualItems = useMemo(() => {
    const items: FixedVirtualItem[] = [];
    for (let index = range.start; index < range.end; index += 1) {
      items.push({ index, start: index * rowHeight });
    }
    return items;
  }, [range.end, range.start, rowHeight]);

  return {
    totalHeight: count * rowHeight,
    virtualItems,
  };
}
