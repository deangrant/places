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
} from "@/services/places/place-search-service";
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
      matchTags: () => undefined,
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
  it("clears categoryId when only a top category is selected", () => {
    const { getCriteria } = renderFilters();
    fireEvent.change(screen.getByLabelText("Any category"), {
      target: { value: "Food Services" },
    });
    expect(getCriteria().categoryId).toBeUndefined();
    expect(screen.getByLabelText("Any subcategory")).not.toBeDisabled();
  });

  it("keeps categoryId unset for top category, empty subcategory, and geography", () => {
    const { getCriteria } = renderFilters();
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
});
