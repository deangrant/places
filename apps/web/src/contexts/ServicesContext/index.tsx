import { createContext, useContext } from "react";
import type { AppServices } from "@/services/app-services.types";
import type { ServicesProviderProps } from "./index.types";

const ServicesContext = createContext<AppServices | null>(null);

/**
 * Provides injected application service ports to the React tree.
 */
export function ServicesProvider({
  services,
  children,
}: ServicesProviderProps) {
  return (
    <ServicesContext.Provider value={services}>
      {children}
    </ServicesContext.Provider>
  );
}

/**
 * Returns injected app services or throws when used outside ServicesProvider.
 */
export function useServices(): AppServices {
  const value = useContext(ServicesContext);
  if (!value) {
    throw new Error("useServices must be used within ServicesProvider.");
  }
  return value;
}
