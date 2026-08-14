import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/sora/400.css";
import "@fontsource/sora/600.css";
import { App } from "@/app";
import "@/styles/global.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root was not found.");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
