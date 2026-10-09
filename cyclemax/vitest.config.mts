import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

process.env.TZ = "Europe/Berlin";

export default defineConfig({
  resolve: {
    alias: {
      "@shared": fileURLToPath(new URL("./shared", import.meta.url)),
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    include: ["src/**/*.test.ts", "server/**/*.test.ts", "shared/**/*.test.ts"],
    environment: "node",
  },
});
