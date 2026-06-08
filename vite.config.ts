import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function manualChunks(id: string) {
  const normalizedId = id.replace(/\\/g, "/");

  if (normalizedId.includes("/node_modules/react/") || normalizedId.includes("/node_modules/react-dom/")) {
    return "vendor-react";
  }

  if (normalizedId.includes("/node_modules/@xyflow/")) {
    return "vendor-reactflow";
  }

  if (normalizedId.includes("/node_modules/@tauri-apps/")) {
    return "vendor-tauri";
  }

  if (normalizedId.includes("/node_modules/lucide-react/")) {
    return "vendor-icons";
  }

  if (normalizedId.includes("/src/io/") || normalizedId.includes("/src/editor/") || normalizedId.includes("/src/domain/")) {
    return "app-editor-core";
  }

  if (
    normalizedId.includes("/src/components/Canvas") ||
    normalizedId.includes("/src/components/Inspectors") ||
    normalizedId.includes("/src/components/PropertySidebar")
  ) {
    return "app-editor-ui";
  }

  if (normalizedId.includes("/src/components/")) {
    return "app-shell-ui";
  }
}

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: false
  },
  envPrefix: ["VITE_", "TAURI_"],
  build: {
    target: process.env.TAURI_ENV_PLATFORM === "windows" ? "chrome105" : "safari13",
    minify: !process.env.TAURI_ENV_DEBUG,
    sourcemap: Boolean(process.env.TAURI_ENV_DEBUG),
    rollupOptions: {
      output: {
        manualChunks
      }
    }
  }
});
