import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import doableSourceAnnotations from "./.doable/vite-plugin-source-annotations.js";


// HMR is configured by the platform — do not set server.hmr here.
// The platform spawns Vite with --config vite.config.platform.mjs, which
// forces the correct HMR transport. Any server.hmr set here is overridden.
export default defineConfig({
  plugins: [
    doableSourceAnnotations(),react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    allowedHosts: true,
  },
});
