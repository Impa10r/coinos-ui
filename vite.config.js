import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";

import { defineConfig, loadEnv } from "vite";

import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [sveltekit(), tailwindcss()],
    build: {
      // One vendor chunk (crypto/bitcoin libs) sits around 1MB minified —
      // above the 500kB default. Splitting it is a real refactor with its
      // own risk; just raise the advisory threshold past it.
      chunkSizeWarningLimit: 1100,
    },
    resolve: {
      alias: {
        $comp: path.resolve("src/components"),
      },
    },
    server: {
      headers: {
        "Cache-Control": "no-store",
      },
      allowedHosts: [
        env.PUBLIC_DOMAIN,
        env.PUBLIC_DOMAIN_TOR,
        env.PUBLIC_DOMAIN_FIPS,
        env.PUBLIC_DOMAIN_EXTRA,
      ].filter(Boolean),
      hmr: true,
      proxy:
        process.env.NODE_ENV === "development"
          ? {
              "/api/": {
                target: "http://localhost:3119",
                rewrite: (path) => path.replace(/^\/api\//, ""),
              },
              "/ws": {
                target: "ws://localhost:3119",
                ws: true,
              },
            }
          : undefined,
    },
  };
});
