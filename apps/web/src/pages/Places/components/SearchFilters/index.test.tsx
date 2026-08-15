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

const ADVANCED_BUTTON_NAME = /Advanced/;

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

/**
 * Opens a labeled Select and chooses an option by visible label.
 * @param fieldLabel FormField / trigger accessible name.
 * @param optionLabel Option text in the listbox.
 */
function chooseSelectOption(fieldLabel: string, optionLabel: string): void {
  fireEvent.click(screen.getByLabelText(fieldLabel));
  fireEvent.click(screen.getByRole("option", { name: optionLabel }));
}

describe("SearchFilters", () => {
  it("shows brand, place name, and geography on the primary strip by default", () => {
    renderFilters();
    expect(screen.getByPlaceholderText("e.g. Starbucks")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Contains…")).toBeInTheDocument();
    expect(screen.getByLabelText("Country")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. California")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("e.g. San Francisco"),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Category")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Tag")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Advanced" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("omits subcategory until a top category is selected in Advanced", () => {
    const { getCriteria } = renderFilters();
    fireEvent.click(screen.getByRole("button", { name: "Advanced" }));
    expect(screen.queryByLabelText("Subcategory")).not.toBeInTheDocument();

    chooseSelectOption("Category", "Food Services");
    expect(getCriteria().categoryId).toBeUndefined();
    expect(screen.getByLabelText("Subcategory")).toBeInTheDocument();
  });

  it("keeps categoryId unset for top category, empty subcategory, and geography", () => {
    const { getCriteria } = renderFilters();
    fireEvent.click(screen.getByRole("button", { name: "Advanced" }));
    chooseSelectOption("Category", "Food Services");
    chooseSelectOption("Country", "United States");
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
    chooseSelectOption("Category", "Food Services");
    const brand = screen.getByPlaceholderText("e.g. Starbucks");
    fireEvent.change(brand, { target: { value: "Starbucks" } });
    expect(getCriteria().brand).toBe("Starbucks");
    expect(getCriteria().categoryId).toBeUndefined();

    chooseSelectOption("Subcategory", "Coffee Shops");
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
    chooseSelectOption("Category", "Food Services");
    expect(getCriteria().categoryId).toBeUndefined();
    expect(screen.getByLabelText("Subcategory")).toBeInTheDocument();
  });

  it("omits OSM tag value until a key is selected and clears value when key clears", () => {
    const { getCriteria } = renderFilters();
    fireEvent.click(screen.getByRole("button", { name: "Advanced" }));

    expect(screen.queryByPlaceholderText("e.g. cafe")).not.toBeInTheDocument();

    chooseSelectOption("Tag", "amenity");
    fireEvent.change(screen.getByPlaceholderText("e.g. cafe"), {
      target: { value: "cafe" },
    });
    expect(getCriteria()).toMatchObject({
      osmTagKey: "amenity",
      osmTagValue: "cafe",
    });

    chooseSelectOption("Tag", "Any key");
    expect(getCriteria().osmTagKey).toBeUndefined();
    expect(getCriteria().osmTagValue).toBe("");
    expect(screen.queryByPlaceholderText("e.g. cafe")).not.toBeInTheDocument();
  });

  it("shows clearable chips for advanced values while the panel is collapsed", () => {
    const { getCriteria } = renderFilters();
    fireEvent.click(screen.getByRole("button", { name: "Advanced" }));
    chooseSelectOption("Category", "Food Services");
    chooseSelectOption("Subcategory", "Coffee Shops");
    fireEvent.click(screen.getByRole("button", { name: ADVANCED_BUTTON_NAME }));

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
    expect(screen.getByTitle("Exact OSM brand match.")).toBeInTheDocument();
    expect(
      screen.getByTitle("Curated country list — not every ISO code."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Exact OSM brand match."),
    ).not.toBeInTheDocument();
  });

  it("disables Reset when pristine and clears all filters when pressed", () => {
    const { getCriteria } = renderFilters();
    const reset = screen.getByRole("button", { name: "Reset" });
    expect(reset).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText("e.g. Starbucks"), {
      target: { value: "Starbucks" },
    });
    chooseSelectOption("Country", "United States");
    expect(reset).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Advanced" }));
    chooseSelectOption("Category", "Food Services");
    expect(screen.getByLabelText("Subcategory")).toBeInTheDocument();

    fireEvent.click(reset);
    expect(getCriteria()).toEqual({});
    expect(reset).toBeDisabled();
    expect(screen.getByRole("button", { name: "Advanced" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByLabelText("Category")).not.toBeInTheDocument();
  });

  it("clears one field without wiping siblings", () => {
    const { getCriteria } = renderFilters();
    fireEvent.change(screen.getByPlaceholderText("e.g. Starbucks"), {
      target: { value: "Starbucks" },
    });
    fireEvent.change(screen.getByPlaceholderText("e.g. San Francisco"), {
      target: { value: "Seattle" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Clear brand" }));
    expect(getCriteria()).toMatchObject({
      brand: "",
      city: "Seattle",
    });
    expect(
      screen.queryByRole("button", { name: "Clear brand" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Clear city" }),
    ).toBeInTheDocument();
  });
});
