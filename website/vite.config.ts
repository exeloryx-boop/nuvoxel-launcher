import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const websiteDir = path.resolve(process.cwd(), "website");

export default defineConfig({
  root: websiteDir,
  publicDir: path.resolve(websiteDir, "public"),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@shared": path.resolve(process.cwd(), "shared"),
      "@i18n": path.resolve(process.cwd(), "src/i18n"),
    },
  },
  server: {
    port: 3000,
    strictPort: true,
  },
  build: {
    outDir: path.resolve(process.cwd(), "api/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom", "zustand"],
          icons: ["lucide-react"],
        },
      },
    },
  },
});
