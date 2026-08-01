/// <reference types="node" />
import { fileURLToPath } from "node:url";
import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const host = process.env.TAURI_DEV_HOST;

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const curseforgeKey =
    env.VITE_CURSEFORGE_API_KEY?.trim() || env.CURSEFORGE_API_KEY?.trim() || "";

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { "@shared": path.resolve(__dirname, "shared") },
    },
    define: {
      "import.meta.env.VITE_CURSEFORGE_API_KEY": JSON.stringify(curseforgeKey),
    },
    clearScreen: false,
    server: {
      port: 1420,
      strictPort: true,
      host: host || false,
      hmr: host
        ? {
            protocol: "ws",
            host,
            port: 1421,
          }
        : undefined,
      watch: {
        ignored: ["**/src-tauri/**"],
      },
    },
  };
});
