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
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
