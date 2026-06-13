import { defineConfig } from "vite";

// Minimal Vite config. The app is a single-page Leaflet map with no framework.
export default defineConfig({
  // Relative asset paths so the built app works when served from ANY path —
  // a domain root, a `file://` open, OR a GitHub Pages project subpath
  // (https://<user>.github.io/<repo>/). With the default "/" base, assets would
  // 404 under a subpath; "./" makes index.html reference ./assets/... relatively.
  base: "./",
  server: { port: 5173, open: false },
  build: { outDir: "dist", emptyOutDir: true },
});
