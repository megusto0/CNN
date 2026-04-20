import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    target: "es2023",
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (
            id.includes("d3-selection") ||
            id.includes("d3-scale") ||
            id.includes("d3-shape") ||
            id.includes("d3-axis") ||
            id.includes("d3-array")
          ) {
            return "d3-viz";
          }
          if (id.includes("onnxruntime-web")) {
            return "onnx";
          }
        },
      },
    },
  },
});
