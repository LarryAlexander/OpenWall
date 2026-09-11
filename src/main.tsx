import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import { applyAppearanceToDOM, loadAppearancePreferences } from "./appearance";
import { rememberOfflineReadiness } from "./install";
import "./styles.css";

// Apply persisted appearance settings immediately before mount to prevent flash of unstyled theme
applyAppearanceToDOM(loadAppearancePreferences());

const updateServiceWorker = registerSW({
  immediate: true,
  onNeedRefresh() {
    window.dispatchEvent(new CustomEvent("openwall:update-ready", { detail: updateServiceWorker }));
  },
  onOfflineReady() {
    // Persist before dispatching so a very early service-worker event is not lost
    // before the React listener mounts.
    rememberOfflineReadiness();
    window.dispatchEvent(new CustomEvent("openwall:offline-ready"));
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
