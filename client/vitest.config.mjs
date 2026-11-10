import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => ({
  test: {
    environment: "node",
    include: ["tests/*.test.mjs"],
    exclude: ["tests/category-model.test.mjs", "tests/pwa-build.test.mjs"],
    ...(mode === "pwa" && {
      include: ["tests/pwa-build.test.mjs"],
      exclude: [],
    }),
  },
}));
