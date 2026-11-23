import { resolveTmdbProxyRequest, TmdbProxyError } from "./_tmdbShared.js";

const REQUEST_TIMEOUT_MS = 12000;

function jsonResponse(data, status, cacheControl = "no-store") {
      return new Response(JSON.stringify(data), {
            status,
            headers: {
                  "Content-Type": "application/json; charset=utf-8",
                  "Cache-Control": cacheControl,
                  "X-Content-Type-Options": "nosniff",
            },
      });
}

export async function handleTmdbRequest(
      request,
      {
            token = process.env.TMDB_READ_ACCESS_TOKEN,
            fetchImpl = globalThis.fetch,
            timeoutMs = REQUEST_TIMEOUT_MS,
      } = {}
) {
      if (request.method !== "GET") {
            return jsonResponse({ status_message: "Method not allowed." }, 405);
      }

      let resolved;
      try {
            resolved = resolveTmdbProxyRequest(request.url);
      } catch (error) {
            const status = error instanceof TmdbProxyError ? error.status : 400;
            return jsonResponse({ status_message: error.message || "Invalid TMDB request." }, status);
      }

      if (!token) {
            return jsonResponse({ status_message: "TMDB service is not configured." }, 503);
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
            const upstream = await fetchImpl(resolved.targetUrl, {
                  method: "GET",
                  headers: {
                        accept: "application/json",
                        Authorization: `Bearer ${token}`,
                  },
                  signal: controller.signal,
            });

            const body = await upstream.text();
            let data;
            try {
                  data = body ? JSON.parse(body) : {};
            } catch {
                  return jsonResponse(
                        { status_message: "TMDB returned an unreadable response." },
                        502
                  );
            }

            // Only successful responses may be shared-cached. A rate-limit or
            // upstream error must never be served to other users from the CDN.
            return jsonResponse(data, upstream.status, upstream.ok ? resolved.cacheControl : "no-store");
      } catch {
            if (controller.signal.aborted) {
                  return jsonResponse(
                        { status_message: "TMDB request timed out. Please try again." },
                        504
                  );
            }

            return jsonResponse(
                  { status_message: "Unable to reach TMDB. Please try again." },
                  502
            );
      } finally {
            clearTimeout(timeout);
      }
}

export default {
      fetch(request) {
            return handleTmdbRequest(request);
      },
};
