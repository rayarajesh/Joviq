import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const { VITE_DEV_PROXY_TARGET: proxyTarget } = loadEnv(mode, ".");
  return {
    cacheDir: "node_modules/.vite-joviq-oauth",
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: false,
      proxy: proxyTarget ? {
        "/api": { target: proxyTarget, changeOrigin: true },
        "/health": { target: proxyTarget, changeOrigin: true }
      } : undefined
    },
    preview: {
      port: 4173
    }
  };
});
