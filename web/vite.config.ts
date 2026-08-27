import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  cacheDir: "node_modules/.vite-joviq-oauth",
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false
  },
  preview: {
    port: 4173
  }
});
