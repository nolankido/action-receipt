import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "standalone",
  base: "./",
  publicDir: "../public",
  envDir: false,
  plugins: [react()],
  build: { modulePreload: false, outDir: "../dist", emptyOutDir: true, cssCodeSplit: false, assetsInlineLimit: 1_000_000 },
  server: { host: "127.0.0.1" },
});
