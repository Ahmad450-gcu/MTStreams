const TMDB_API_ORIGIN = "https://api.themoviedb.org";
const TMDB_API_VERSION = "/3";
const ALLOWED_QUERY_KEYS = new Set([
      "page",
      "language",
      "query",
      "include_adult",
      "include_video",
      "sort_by",
      // Discovery filters used by the OTT experience catalogue engine.
      "with_genres",
      "without_genres",
      "with_original_language",
      "with_watch_providers",
      "watch_region",
      "with_watch_monetization_types",
      "vote_count.gte",
      "vote_average.gte",
      "vote_count.lte",
      "with_runtime.gte",
      "with_runtime.lte",
      "with_cast",
      "with_crew",
      "primary_release_date.gte",
      "primary_release_date.lte",
      "first_air_date.gte",
      "first_air_date.lte",
      "air_date.gte",
      "air_date.lte",
      "with_companies",
      "with_networks",
      "include_image_language",
]);

// Strict formats for the discovery filters above. Anything else is rejected.
const ID_LIST = /^\d{1,7}(?:[|,]\d{1,7}){0,24}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const NUMBER = /^\d{1,6}(?:\.\d{1,2})?$/;
const QUERY_FORMATS = {
      with_genres: ID_LIST,
      without_genres: ID_LIST,
      with_watch_providers: ID_LIST,
      with_companies: ID_LIST,
      with_networks: ID_LIST,
      with_original_language: /^[a-z]{2}(?:\|[a-z]{2}){0,5}$/,
      watch_region: /^[A-Z]{2}$/,
      with_watch_monetization_types: /^(?:flatrate|free|ads|rent|buy)(?:\|(?:flatrate|free|ads|rent|buy)){0,4}$/,
      "vote_count.gte": NUMBER,
      "vote_average.gte": NUMBER,
      "vote_count.lte": NUMBER,
      "with_runtime.gte": NUMBER,
      "with_runtime.lte": NUMBER,
      with_cast: ID_LIST,
      with_crew: ID_LIST,
      "primary_release_date.gte": ISO_DATE,
      "primary_release_date.lte": ISO_DATE,
      "first_air_date.gte": ISO_DATE,
      "first_air_date.lte": ISO_DATE,
      "air_date.gte": ISO_DATE,
      "air_date.lte": ISO_DATE,
      include_image_language: /^(?:[a-z]{2}|null)(?:,(?:[a-z]{2}|null)){0,3}$/,
};

const TMDB_PATH_PATTERNS = [
      /^trending\/(?:movie|tv|all)\/day$/,
      /^movie\/(?:upcoming|top_rated|popular|now_playing)$/,
      /^tv\/(?:airing_today|on_the_air|popular|top_rated)$/,
      /^discover\/(?:tv|movie)$/,
      /^search\/(?:multi|movie|tv|person)$/,
      /^collection\/[1-9]\d*$/,
      /^movie\/[1-9]\d*(?:\/(?:credits|recommendations|similar|videos|reviews|images|release_dates|watch\/providers))?$/,
      /^tv\/[1-9]\d*(?:\/(?:credits|recommendations|similar|videos|reviews|images|content_ratings|watch\/providers)|\/season\/(?:0|[1-9]\d*))?$/,
      /^person\/[1-9]\d*(?:\/(?:credits|combined_credits))?$/,
];

export class TmdbProxyError extends Error {
      constructor(message, status = 400) {
            super(message);
            this.name = "TmdbProxyError";
            this.status = status;
      }
}

export function isAllowedTmdbPath(path) {
      return typeof path === "string" && TMDB_PATH_PATTERNS.some((pattern) => pattern.test(path));
}

function validateQueryParameters(searchParams) {
      const forwarded = new URLSearchParams();

      for (const [key, value] of searchParams.entries()) {
            if (key === "_path") continue;

            if (!ALLOWED_QUERY_KEYS.has(key)) {
                  throw new TmdbProxyError(`Unsupported TMDB query parameter: ${key}`);
            }

            if (value.length > 200) {
                  throw new TmdbProxyError(`TMDB query parameter is too long: ${key}`);
            }

            if (key === "page" && (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 500)) {
                  throw new TmdbProxyError("TMDB page must be a number between 1 and 500.");
            }

            if ((key === "include_adult" || key === "include_video") && !/^(true|false)$/.test(value)) {
                  throw new TmdbProxyError(`${key} must be true or false.`);
            }

            if (key === "language" && !/^[a-z]{2}(?:-[A-Z]{2})?$/.test(value)) {
                  throw new TmdbProxyError("TMDB language value is invalid.");
            }

            if (key === "sort_by" && !/^[a-z_]+\.(?:asc|desc)$/.test(value)) {
                  throw new TmdbProxyError("TMDB sort_by value is invalid.");
            }

            if (QUERY_FORMATS[key] && !QUERY_FORMATS[key].test(value)) {
                  throw new TmdbProxyError(`TMDB ${key} value is invalid.`);
            }

            forwarded.append(key, value);
      }

      return forwarded;
}

export function resolveTmdbProxyRequest(requestUrl) {
      let url;
      try {
            url = requestUrl instanceof URL ? new URL(requestUrl.href) : new URL(requestUrl);
      } catch {
            throw new TmdbProxyError("Invalid TMDB proxy request URL.");
      }

      if (url.pathname !== "/api/tmdb" && url.pathname !== "/api/tmdb/") {
            throw new TmdbProxyError("Unknown TMDB proxy endpoint.", 404);
      }

      const requestedPaths = url.searchParams.getAll("_path");
      if (requestedPaths.length !== 1) {
            throw new TmdbProxyError("A single TMDB path is required.");
      }

      const path = requestedPaths[0].replace(/^\/+/, "");
      if (path.length > 180 || path.includes("\\") || !isAllowedTmdbPath(path)) {
            throw new TmdbProxyError("This TMDB endpoint is not available through MTStreams.", 404);
      }

      const query = validateQueryParameters(url.searchParams);
      const targetUrl = new URL(`${TMDB_API_VERSION}/${path}`, TMDB_API_ORIGIN);
      targetUrl.search = query.toString();

      return {
            path,
            targetUrl,
            cacheControl: cacheControlFor(path),
      };
}

// Shared (CDN) cache lifetimes, chosen by how often each kind of TMDB data
// changes. Every edge-cache hit is a request that never reaches the Vercel
// function, so longer lifetimes for slow-changing data directly cut function
// invocations and TMDB traffic. Only successful responses use these values
// (see api/tmdb.js); errors are never shared-cached.
const DAY = 86400;
export function cacheControlFor(path) {
      // Search stays private: it reflects what an individual typed.
      if (path.startsWith("search/")) return "private, no-store";
      // Provider lists, artwork, certifications and franchise collections.
      if (/\/(?:watch\/providers|images|release_dates|content_ratings)$/.test(path) || path.startsWith("collection/")) {
            return `public, s-maxage=${DAY}, stale-while-revalidate=${DAY * 7}`;
      }
      // Ranked or date-driven lists (trending, popular, upcoming, discover).
      if (/^(?:trending|discover)\//.test(path) || /^(?:movie|tv)\/(?:upcoming|top_rated|popular|now_playing|airing_today|on_the_air)$/.test(path)) {
            return `public, s-maxage=1800, stale-while-revalidate=${DAY}`;
      }
      // Title, season and person details, credits, recommendations, reviews.
      return `public, s-maxage=21600, stale-while-revalidate=${DAY * 7}`;
}

export function getTmdbDevRewritePath(requestPath) {
      const requestUrl = new URL(requestPath, "http://localhost");
      const { targetUrl } = resolveTmdbProxyRequest(requestUrl);
      return `${targetUrl.pathname}${targetUrl.search}`;
}
