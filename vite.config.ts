import { defineConfig, lazyPlugins } from "vite-plus";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const config = defineConfig({
  fmt: {
    ignorePatterns: ["*.gen.ts"],
  },
  lint: {
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
  resolve: { tsconfigPaths: true },
  plugins: lazyPlugins(() => [
    devtools(),
    tailwindcss(),
    tanstackStart({
      prerender: { enabled: true },
      pages: [{ path: "/" }],
      // GitHub Pages serves 404.html for unknown paths, so it doubles as the SPA fallback.
      spa: { enabled: true, maskPath: "/?shell", prerender: { outputPath: "/404" } },
    }),
    viteReact(),
  ]),
});

export default config;
