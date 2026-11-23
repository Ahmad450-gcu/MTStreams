import test from "node:test";
import assert from "node:assert/strict";
import { getTmdbDevRewritePath, isAllowedTmdbPath, resolveTmdbProxyRequest } from "../api/_tmdbShared.js";
import { handleTmdbRequest } from "../api/tmdb.js";

const makeRequest = (path, query = "") => new Request(`https://mtstreams.test/api/tmdb?_path=${encodeURIComponent(path)}${query}`);

test("allows every TMDB route used by MTStreams", () => {
      const paths = [
            "trending/movie/day",
            "trending/tv/day",
            "trending/all/day",
            "movie/upcoming",
            "movie/top_rated",
            "tv/airing_today",
            "tv/on_the_air",
            "tv/popular",
            "discover/tv",
            "search/multi",
            "movie/550",
            "movie/550/credits",
            "movie/550/recommendations",
            "movie/550/videos",
            "movie/550/reviews",
            "tv/1399",
            "tv/1399/credits",
            "tv/1399/season/1",
            "person/287/credits",
      ];

      for (const path of paths) assert.equal(isAllowedTmdbPath(path), true, path);
});

test("rejects unapproved paths and path traversal", () => {
      assert.equal(isAllowedTmdbPath("configuration"), false);
      assert.equal(isAllowedTmdbPath("movie/1/../../account"), false);
      assert.equal(isAllowedTmdbPath("https://evil.example/movie/1"), false);
      assert.throws(
            () => resolveTmdbProxyRequest("https://mtstreams.test/api/tmdb?_path=configuration"),
            /not available/
      );
});

test("builds a fixed TMDB URL and forwards approved query parameters", () => {
      const resolved = resolveTmdbProxyRequest(
            "https://mtstreams.test/api/tmdb?_path=search%2Fmulti&query=star%20wars&page=2&language=en-US"
      );

      assert.equal(resolved.targetUrl.origin, "https://api.themoviedb.org");
      assert.equal(resolved.targetUrl.pathname, "/3/search/multi");
      assert.equal(resolved.targetUrl.searchParams.get("query"), "star wars");
      assert.equal(resolved.targetUrl.searchParams.get("page"), "2");
      assert.equal(resolved.targetUrl.searchParams.get("language"), "en-US");
      assert.equal(resolved.cacheControl, "private, no-store");
});

test("rejects unsupported query parameters and invalid page values", () => {
      assert.throws(
            () => resolveTmdbProxyRequest("https://mtstreams.test/api/tmdb?_path=search%2Fmulti&token=bad"),
            /Unsupported TMDB query parameter/
      );
      assert.throws(
            () => resolveTmdbProxyRequest("https://mtstreams.test/api/tmdb?_path=movie%2Fupcoming&page=999"),
            /between 1 and 500/
      );
});

test("rewrites Vite development requests to the validated TMDB path", () => {
      assert.equal(
            getTmdbDevRewritePath("/api/tmdb?_path=trending%2Fmovie%2Fday&page=1"),
            "/3/trending/movie/day?page=1"
      );
});

test("server handler uses the private token and returns TMDB JSON", async () => {
      let requestedUrl;
      let authorization;
      const response = await handleTmdbRequest(makeRequest("trending/movie/day", "&page=1"), {
            token: "test-token-not-printed",
            fetchImpl: async (url, options) => {
                  requestedUrl = String(url);
                  authorization = options.headers.Authorization;
                  return new Response(JSON.stringify({ results: [{ id: 1 }] }), {
                        status: 200,
                        headers: { "Content-Type": "application/json" },
                  });
            },
      });

      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { results: [{ id: 1 }] });
      assert.match(requestedUrl, /^https:\/\/api\.themoviedb\.org\/3\/trending\/movie\/day\?page=1$/);
      assert.equal(authorization, "Bearer test-token-not-printed");
});

test("server handler rejects missing credentials and non-GET requests", async () => {
      const missingToken = await handleTmdbRequest(makeRequest("movie/550"), { token: "" });
      assert.equal(missingToken.status, 503);

      const postRequest = new Request("https://mtstreams.test/api/tmdb?_path=movie%2F550", { method: "POST" });
      const methodResponse = await handleTmdbRequest(postRequest, { token: "test" });
      assert.equal(methodResponse.status, 405);
});

test("server handler maps upstream timeouts to 504", async () => {
      const response = await handleTmdbRequest(makeRequest("movie/550"), {
            token: "test",
            timeoutMs: 5,
            fetchImpl: (_url, { signal }) => new Promise((_resolve, reject) => {
                  signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
            }),
      });

      assert.equal(response.status, 504);
});

test("allows the OTT experience catalogue routes", () => {
      const paths = [
            "discover/movie",
            "search/movie",
            "search/tv",
            "movie/550/watch/providers",
            "tv/1399/watch/providers",
            "movie/550/images",
            "tv/1399/similar",
            "movie/550/release_dates",
            "tv/1399/content_ratings",
      ];
      for (const path of paths) assert.equal(isAllowedTmdbPath(path), true, path);
      assert.equal(isAllowedTmdbPath("movie/550/watch/providers/extra"), false);
      assert.equal(isAllowedTmdbPath("watch/providers/movie"), false);
});

test("validates OTT discovery filters strictly", () => {
      const ok = resolveTmdbProxyRequest(
            "https://mtstreams.test/api/tmdb?_path=discover%2Fmovie&with_genres=28%7C12&with_watch_providers=8%7C1796&watch_region=GB&with_watch_monetization_types=flatrate&vote_count.gte=50&first_air_date.gte=2026-10-01"
      );
      assert.equal(ok.targetUrl.searchParams.get("with_watch_providers"), "8|1796");
      assert.equal(ok.cacheControl, "public, s-maxage=1800, stale-while-revalidate=86400");
      assert.equal(
            resolveTmdbProxyRequest("https://mtstreams.test/api/tmdb?_path=movie%2F550%2Fwatch%2Fproviders").cacheControl,
            "public, s-maxage=86400, stale-while-revalidate=604800"
      );
      assert.throws(() => resolveTmdbProxyRequest("https://mtstreams.test/api/tmdb?_path=discover%2Fmovie&watch_region=gb"), /invalid/);
      assert.throws(() => resolveTmdbProxyRequest("https://mtstreams.test/api/tmdb?_path=discover%2Fmovie&with_genres=28;drop"), /invalid/);
      assert.throws(() => resolveTmdbProxyRequest("https://mtstreams.test/api/tmdb?_path=discover%2Fmovie&air_date.gte=tomorrow"), /invalid/);
});

test("uses longer shared-cache lifetimes for slow-changing TMDB data", () => {
      const cache = (path) => resolveTmdbProxyRequest(`https://mtstreams.test/api/tmdb?_path=${encodeURIComponent(path)}`).cacheControl;
      assert.equal(cache("movie/550"), "public, s-maxage=21600, stale-while-revalidate=604800");
      assert.equal(cache("tv/1399/season/1"), "public, s-maxage=21600, stale-while-revalidate=604800");
      assert.equal(cache("trending/all/day"), "public, s-maxage=1800, stale-while-revalidate=86400");
      assert.equal(cache("collection/10"), "public, s-maxage=86400, stale-while-revalidate=604800");
      assert.equal(cache("search/person"), "private, no-store");
});

test("accepts the discovery-hub filters and rejects malformed values", () => {
      const ok = resolveTmdbProxyRequest(
            "https://mtstreams.test/api/tmdb?_path=discover%2Fmovie&vote_count.lte=900&with_runtime.gte=60&with_runtime.lte=120&with_cast=287&with_crew=525"
      );
      assert.equal(ok.targetUrl.searchParams.get("with_runtime.lte"), "120");
      assert.equal(ok.targetUrl.searchParams.get("with_cast"), "287");
      assert.throws(() => resolveTmdbProxyRequest("https://mtstreams.test/api/tmdb?_path=discover%2Fmovie&with_cast=brad"), /invalid/);
      assert.throws(() => resolveTmdbProxyRequest("https://mtstreams.test/api/tmdb?_path=discover%2Fmovie&with_runtime.lte=-5"), /invalid/);
});

test("never shares error responses through the CDN", async () => {
      const response = await handleTmdbRequest(new Request("https://mtstreams.test/api/tmdb?_path=movie%2F550"), {
            token: "test-token",
            fetchImpl: async () => new Response(JSON.stringify({ status_message: "Too many requests" }), { status: 429 }),
      });
      assert.equal(response.status, 429);
      assert.equal(response.headers.get("Cache-Control"), "no-store");
      const success = await handleTmdbRequest(new Request("https://mtstreams.test/api/tmdb?_path=movie%2F550"), {
            token: "test-token",
            fetchImpl: async () => new Response(JSON.stringify({ id: 550 }), { status: 200 }),
      });
      assert.equal(success.headers.get("Cache-Control"), "public, s-maxage=21600, stale-while-revalidate=604800");
});
