import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    setupFiles: ["./src/test/node-dom-setup.ts"],
    exclude: ["e2e/**", "node_modules/**"],
    coverage: { reporter: ["text", "html"] },
  },
});
