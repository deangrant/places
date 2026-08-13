import type { ReactNode } from "react";
import type { AppServices } from "@/services/app-services.types";

/**
 * Props for the application services context provider.
 */
export interface ServicesProviderProps {
  /** Tree that may call `useServices`. */
  children: ReactNode;
  /** Injected service ports from the composition root. */
  services: AppServices;
}
