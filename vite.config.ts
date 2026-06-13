import { defineConfig } from "vite";

// Minimal Vite config. The app is a single-page Leaflet map with no framework.
export default defineConfig({
  server: { port: 5173, open: false },
  build: { outDir: "dist", emptyOutDir: true },
});
