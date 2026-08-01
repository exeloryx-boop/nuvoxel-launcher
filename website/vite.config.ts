/// <reference types="node" />
import { fileURLToPath } from "node:url";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  root: path.resolve(__dirname),
  publicDir: path.resolve(__dirname, "public"),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "../shared"),
      "@i18n": path.resolve(__dirname, "../src/i18n"),
    },
  },
  server: {
    port: 3000,
    strictPort: true,
  },
  build: {
    outDir: path.resolve(__dirname, "../api/public"),
    emptyOutDir: true,
  },
});
