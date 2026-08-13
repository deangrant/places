import { PlacesProvider } from "@/contexts/PlacesContext";
import { ServicesProvider } from "@/contexts/ServicesContext";
import { PlacesLayout } from "@/pages/Places/PlacesLayout";
import { services } from "@/services/create-services";

/** Places explorer route page. */
export function PlacesPage() {
  return (
    <ServicesProvider services={services}>
      <PlacesProvider>
        <PlacesLayout />
      </PlacesProvider>
    </ServicesProvider>
  );
}
