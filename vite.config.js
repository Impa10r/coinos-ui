import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";

import { defineConfig } from "vite";

import path from "path";

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  resolve: {
    alias: {
      $comp: path.resolve("src/components"),
    },
  },
  server: {
    allowedHosts: process.env.PUBLIC_DOMAIN ? [process.env.PUBLIC_DOMAIN] : [],
    proxy:
      process.env.NODE_ENV === "development"
        ? {
            "/api/": {
              target: "http://localhost:3119",
              rewrite: (path) => path.replace(/^\/api\//, ""),
            },
          }
        : undefined,
  },
});
