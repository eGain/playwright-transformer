import { defineConfig } from "vite";
import { resolve } from "path";
import * as path from "path";
import dts from "vite-plugin-dts";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  plugins: [
    dts({
      include: ["src/**/*"],
      exclude: ["src/**/*.test.ts", "src/**/*.spec.ts"],
      outDir: "dist",
    }),
    viteStaticCopy({
      targets: [
        {
          src: "src/config/internal/*",
          dest: "config/internal",
        },
      ],
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        cli: resolve(__dirname, "src/cli.ts"),
      },
      formats: ["es", "cjs"],
      fileName: (format, entryName) => {
        const ext = format === "es" ? "mjs" : "cjs";
        return `${entryName}.${ext}`;
      },
    },
    rollupOptions: {
      external: (id) => {
        // Externalize all node_modules and built-in Node.js modules
        return !id.startsWith(".") && !id.startsWith("/") && !path.isAbsolute(id);
      },
      output: {
        preserveModules: false,
        exports: "named",
      },
    },
    target: "node18",
    sourcemap: true,
    minify: false, // Keep readable for debugging
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});

