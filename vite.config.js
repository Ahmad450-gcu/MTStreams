import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { getTmdbDevRewritePath } from "./api/_tmdbShared.js";

export default defineConfig(({ mode }) => {
      const env = loadEnv(mode, process.cwd(), "");
      const tmdbToken = env.TMDB_READ_ACCESS_TOKEN;

      if (!tmdbToken) {
            console.warn("[MTStreams] TMDB_READ_ACCESS_TOKEN is not set. TMDB requests will fail until it is configured.");
      }

      const tmdbProxy = {
            target: "https://api.themoviedb.org",
            changeOrigin: true,
            secure: true,
            rewrite: (requestPath) => {
                  try {
                        return getTmdbDevRewritePath(requestPath);
                  } catch {
                        return "/3/invalid-mtstreams-tmdb-route";
                  }
            },
            configure: (proxy) => {
                  proxy.on("proxyReq", (proxyRequest) => {
                        if (tmdbToken) {
                              proxyRequest.setHeader("Authorization", `Bearer ${tmdbToken}`);
                        }
                  });
            },
      };

      return {
            plugins: [react()],
            server: {
                  proxy: {
                        "/api/tmdb": tmdbProxy,
                  },
            },
            preview: {
                  proxy: {
                        "/api/tmdb": tmdbProxy,
                  },
            },
      };
});
