import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Same API contract as /web. Port 5174 is already in the API's CORS allow-list.
export default defineConfig(({ mode }) => {
  const { VITE_DEV_PROXY_TARGET: proxyTarget } = loadEnv(mode, ".");
  return {
    plugins: [react()],
    server: {
      port: 5174,
      strictPort: false,
      proxy: proxyTarget ? {
        "/api": { target: proxyTarget, changeOrigin: true },
        "/health": { target: proxyTarget, changeOrigin: true }
      } : undefined
    },
    preview: {
      port: 4174
    }
  };
});
