import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";

import { defineConfig, loadEnv } from "vite";

import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [tailwindcss(), sveltekit()],
    resolve: {
      alias: {
        $comp: path.resolve("src/components"),
      },
    },
    server: {
      allowedHosts: [
        env.PUBLIC_DOMAIN,
        env.PUBLIC_DOMAIN_TOR,
        env.PUBLIC_DOMAIN_EXTRA,
      ].filter(Boolean),
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
  };
});
