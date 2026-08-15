import { render, screen } from "@testing-library/react";
import type { OverpassAttemptEvent } from "places-core";
import { describe, expect, it } from "vitest";
import { OverpassQueryStatus } from "./index";

describe("OverpassQueryStatus", () => {
  it("renders hostnames and status labels", () => {
    const attempts: OverpassAttemptEvent[] = [
      {
        endpoint: "https://overpass.example/api/interpreter",
        hostname: "overpass.example",
        index: 0,
        status: "started",
      },
      {
        endpoint: "https://other.example/api/interpreter",
        hostname: "other.example",
        index: 1,
        status: "failed",
      },
    ];

    render(<OverpassQueryStatus attempts={attempts} />);

    expect(screen.getByLabelText("Overpass servers")).toBeInTheDocument();
    expect(screen.getByText("overpass.example")).toBeInTheDocument();
    expect(screen.getByText("Searching")).toBeInTheDocument();
    expect(screen.getByText("other.example")).toBeInTheDocument();
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });
});
