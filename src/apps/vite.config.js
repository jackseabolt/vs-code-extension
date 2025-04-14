import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
export default defineConfig({
  plugins: [react()],
  base: "", // this is important for VS Code to resolve paths correctly
  build: {
    outDir: "../../build", // this is where VS Code will serve files from
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
//# sourceMappingURL=vite.config.js.map
