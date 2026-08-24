import { defineConfig } from "vitest/config";

// Mirrors tsconfig.json paths ("@/*": ["./*"]) so tests compile against the
// same files the app builds. Flat-root config per eslint.config.mjs precedent.
export default defineConfig({
  resolve: {
    alias: {
      "@": import.meta.dirname,
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      // Report-only per D-09 — limits arrive in Phase 7.
      provider: "v8",
    },
  },
});
