import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  // Owns the JSX transform for .tsx components, independent of tsconfig's
  // jsx:"preserve" (which Next needs but Vitest cannot consume directly).
  plugins: [react()],
  test: {
    environment: "node", // component tests opt into jsdom per-file via a pragma
    include: ["__tests__/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      // Enforce coverage on the deterministic core — the audited, safety-critical layer.
      include: ["lib/core/**/*.ts"],
      reporter: ["text", "text-summary"],
      thresholds: {
        statements: 85,
        branches: 80,
        functions: 85,
        lines: 85,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // `server-only` throws on import outside an RSC; route handlers are tested
      // directly here, so alias it to a no-op stub.
      "server-only": path.resolve(__dirname, "__tests__/stubs/server-only.ts"),
    },
  },
});
