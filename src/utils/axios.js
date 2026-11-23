import axios from "axios";

const INTERNAL_ORIGIN = "https://mtstreams.internal";

const instance = axios.create({
      baseURL: "/api",
      headers: {
            accept: "application/json",
      },
});

instance.interceptors.request.use((config) => {
      const requestedUrl = new URL(config.url || "", INTERNAL_ORIGIN);

      if (requestedUrl.origin !== INTERNAL_ORIGIN) {
            throw new Error("MTStreams only accepts relative TMDB API paths.");
      }

      const tmdbPath = requestedUrl.pathname.replace(/^\/+/, "");
      if (!tmdbPath) {
            throw new Error("A TMDB endpoint is required.");
      }

      const params = new URLSearchParams(requestedUrl.search);
      if (config.params instanceof URLSearchParams) {
            for (const [key, value] of config.params.entries()) params.append(key, value);
      } else if (config.params && typeof config.params === "object") {
            for (const [key, value] of Object.entries(config.params)) {
                  if (value === undefined || value === null) continue;
                  if (Array.isArray(value)) {
                        value.forEach((item) => params.append(key, String(item)));
                  } else {
                        params.set(key, String(value));
                  }
            }
      }

      params.set("_path", tmdbPath);
      config.url = "tmdb";
      config.params = params;

      return config;
});

instance.interceptors.response.use(
      (response) => response,
      (error) => {
            if (!error.response && error.code !== "ERR_CANCELED" && typeof window !== "undefined") {
                  window.dispatchEvent(new Event("mtstreams:network-error"));
            }

            return Promise.reject(error);
      }
);

export default instance;
