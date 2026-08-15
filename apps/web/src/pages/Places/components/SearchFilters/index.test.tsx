import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { type ReactNode, useEffect } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlacesProvider, usePlaces } from "@/contexts/PlacesContext";
import { ServicesProvider } from "@/contexts/ServicesContext";
import { SearchFilters } from "@/pages/Places/components/SearchFilters";
import type { AppServices } from "@/services/app-services.types";
import type {
  IPlaceGeometryExporter,
  IPlaceSearchService,
} from "@/services/http/http-places-api-client";
import type {
  CategoryDefinition,
  PlaceSearchCriteria,
} from "@/types/places.types";

afterEach(() => {
  cleanup();
});

const coffee: CategoryDefinition = {
  id: "coffee-shops",
  subCategory: "Coffee Shops",
  tags: [{ key: "amenity", value: "cafe" }],
  topCategory: "Food Services",
};

const bakery: CategoryDefinition = {
  id: "bakeries",
  subCategory: "Bakeries",
  tags: [{ key: "shop", value: "bakery" }],
  topCategory: "Food Services",
};

const criteriaHolder: { current: PlaceSearchCriteria } = { current: {} };

function captureCriteria(criteria: PlaceSearchCriteria): void {
  criteriaHolder.current = criteria;
}

function CriteriaProbe({
  onCriteria,
}: {
  onCriteria: (criteria: PlaceSearchCriteria) => void;
}) {
  const { criteria } = usePlaces();
  useEffect(() => {
    onCriteria(criteria);
  }, [criteria, onCriteria]);
  return null;
}

function renderFilters(): {
  getCriteria: () => PlaceSearchCriteria;
} {
  criteriaHolder.current = {};
  const placeExport: IPlaceGeometryExporter = {
    exportByGeometry: vi.fn(() => Promise.resolve([])),
  };
  const placeSearch: IPlaceSearchService = {
    search: vi.fn(() =>
      Promise.resolve({ places: [], scope: {}, truncated: false }),
    ),
  };
  const services: AppServices = {
    brandCatalog: { search: vi.fn(() => []) },
    placeExport,
    placeSearch,
    taxonomy: {
      getById: (id) => [coffee, bakery].find((category) => category.id === id),
      list: () => [coffee, bakery],
      listByTopCategory: (top) =>
        [coffee, bakery].filter((category) => category.topCategory === top),
      listTopCategories: () => ["Food Services"],
    },
  };

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ServicesProvider services={services}>
        <PlacesProvider>{children}</PlacesProvider>
      </ServicesProvider>
    );
  }

  render(
    <Wrapper>
      <CriteriaProbe onCriteria={captureCriteria} />
      <SearchFilters />
    </Wrapper>,
  );

  return {
    getCriteria: () => criteriaHolder.current,
  };
}

describe("SearchFilters", () => {
  it("shows brand, place name, and geography on the primary strip by default", () => {
    renderFilters();
    expect(screen.getByPlaceholderText("e.g. Starbucks")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Contains…")).toBeInTheDocument();
    expect(screen.getByLabelText("Any country")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. California")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("e.g. San Francisco"),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Any category")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Tag")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Advanced" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("omits subcategory until a top category is selected in Advanced", () => {
    const { getCriteria } = renderFilters();
    fireEvent.click(screen.getByRole("button", { name: "Advanced" }));
    expect(screen.queryByLabelText("Any subcategory")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Any category"), {
      target: { value: "Food Services" },
    });
    expect(getCriteria().categoryId).toBeUndefined();
    expect(screen.getByLabelText("Any subcategory")).toBeInTheDocument();
  });

  it("keeps categoryId unset for top category, empty subcategory, and geography", () => {
    const { getCriteria } = renderFilters();
    fireEvent.click(screen.getByRole("button", { name: "Advanced" }));
    fireEvent.change(screen.getByLabelText("Any category"), {
      target: { value: "Food Services" },
    });
    fireEvent.change(screen.getByLabelText("Any country"), {
      target: { value: "US" },
    });
    fireEvent.change(screen.getByPlaceholderText("e.g. San Francisco"), {
      target: { value: "Seattle" },
    });
    expect(getCriteria()).toMatchObject({
      categoryId: undefined,
      city: "Seattle",
      countryCode: "US",
    });
  });

  it("sets brand without inventing a categoryId when subcategory is empty", () => {
    const { getCriteria } = renderFilters();
    fireEvent.click(screen.getByRole("button", { name: "Advanced" }));
    fireEvent.change(screen.getByLabelText("Any category"), {
      target: { value: "Food Services" },
    });
    const brand = screen.getByPlaceholderText("e.g. Starbucks");
    fireEvent.change(brand, { target: { value: "Starbucks" } });
    expect(getCriteria().brand).toBe("Starbucks");
    expect(getCriteria().categoryId).toBeUndefined();

    fireEvent.change(screen.getByLabelText("Any subcategory"), {
      target: { value: "coffee-shops" },
    });
    expect(getCriteria().categoryId).toBe("coffee-shops");
    expect(getCriteria().brand).toBe("Starbucks");
  });

  it("exposes advanced fields when Advanced is expanded", () => {
    const { getCriteria } = renderFilters();
    fireEvent.click(screen.getByRole("button", { name: "Advanced" }));

    expect(screen.getByRole("button", { name: "Advanced" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    fireEvent.change(screen.getByLabelText("Any category"), {
      target: { value: "Food Services" },
    });
    expect(getCriteria().categoryId).toBeUndefined();
    expect(screen.getByLabelText("Any subcategory")).toBeInTheDocument();
  });

  it("omits OSM tag value until a key is selected and clears value when key clears", () => {
    const { getCriteria } = renderFilters();
    fireEvent.click(screen.getByRole("button", { name: "Advanced" }));

    expect(screen.queryByPlaceholderText("e.g. cafe")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Any key"), {
      target: { value: "amenity" },
    });
    fireEvent.change(screen.getByPlaceholderText("e.g. cafe"), {
      target: { value: "cafe" },
    });
    expect(getCriteria()).toMatchObject({
      osmTagKey: "amenity",
      osmTagValue: "cafe",
    });

    fireEvent.change(screen.getByLabelText("Any key"), {
      target: { value: "" },
    });
    expect(getCriteria().osmTagKey).toBeUndefined();
    expect(getCriteria().osmTagValue).toBe("");
    expect(screen.queryByPlaceholderText("e.g. cafe")).not.toBeInTheDocument();
  });

  it("shows clearable chips for advanced values while the panel is collapsed", () => {
    const { getCriteria } = renderFilters();
    fireEvent.click(screen.getByRole("button", { name: "Advanced" }));
    fireEvent.change(screen.getByLabelText("Any category"), {
      target: { value: "Food Services" },
    });
    fireEvent.change(screen.getByLabelText("Any subcategory"), {
      target: { value: "coffee-shops" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Advanced/ }));

    expect(screen.getByText("1")).toBeInTheDocument();
    const chip = screen.getByRole("button", {
      name: "Clear Food Services: Coffee Shops",
    });
    expect(chip).toBeInTheDocument();

    fireEvent.click(chip);
    expect(getCriteria().categoryId).toBeUndefined();
    expect(
      screen.queryByRole("button", {
        name: "Clear Food Services: Coffee Shops",
      }),
    ).not.toBeInTheDocument();
  });

  it("keeps brand and country limitation copy as titles", () => {
    renderFilters();
    expect(
      screen.getByTitle(
        "Exact OSM brand match (suggestions are helpers only).",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByTitle("Curated country list — not every ISO code."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Exact OSM brand match (suggestions are helpers only).",
      ),
    ).not.toBeInTheDocument();
  });
});
