import api from "../../../utils/axios";

// Thin TMDB client for the OTT experiences. Everything goes through the
// existing MTStreams `/api/tmdb` proxy (no credentials in the browser).
//
// - bounded concurrency (MAX_CONCURRENT requests in flight)
// - request de-duplication (identical in-flight GETs share one promise)
// - short-lived response memo for list endpoints
// - retries with backoff for 429 / 5xx / network failures

const MAX_CONCURRENT = 10;
const MEMO_TTL_MS = 5 * 60 * 1000;
const MEMO_LIMIT = 400;

let active = 0;
const queue = [];
const inflight = new Map();
const memo = new Map();

function pump() {
      while (active < MAX_CONCURRENT && queue.length) {
            const job = queue.shift();
            active += 1;
            job.run().finally(() => {
                  active -= 1;
                  pump();
            });
      }
}

function schedule(task, priority = false) {
      return new Promise((resolve, reject) => {
            const job = { run: () => task().then(resolve, reject) };
            if (priority) queue.unshift(job);
            else queue.push(job);
            pump();
      });
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryable = (error) => {
      const status = error?.response?.status;
      if (!status) return error?.code !== "ERR_CANCELED";
      return status === 429 || status >= 500;
};

function buildKey(path, params) {
      const search = new URLSearchParams();
      Object.keys(params || {})
            .sort()
            .forEach((key) => {
                  const value = params[key];
                  if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
            });
      return `${path.replace(/^\/+/, "")}?${search.toString()}`;
}

/**
 * GET a TMDB path through the proxy.
 * @param {string} path e.g. "discover/movie"
 * @param {object} params query parameters (validated server-side)
 * @param {{priority?: boolean, memo?: boolean}} options
 */
export function tmdbGet(path, params = {}, { priority = false, memo: useMemo = true } = {}) {
      const key = buildKey(path, params);

      if (useMemo) {
            const cached = memo.get(key);
            if (cached && Date.now() - cached.at < MEMO_TTL_MS) return Promise.resolve(cached.data);
      }
      if (inflight.has(key)) return inflight.get(key);

      const cleanParams = {};
      Object.entries(params).forEach(([name, value]) => {
            if (value !== undefined && value !== null && value !== "") cleanParams[name] = value;
      });

      const attempt = async () => {
            let lastError;
            for (let tryIndex = 0; tryIndex < 3; tryIndex += 1) {
                  try {
                        const { data } = await api.get(path.replace(/^\/+/, ""), { params: cleanParams, timeout: 12000 });
                        return data;
                  } catch (error) {
                        lastError = error;
                        if (!isRetryable(error) || tryIndex === 2) break;
                        await wait(400 * (tryIndex + 1) + Math.random() * 300);
                  }
            }
            throw lastError;
      };

      const promise = schedule(attempt, priority)
            .then((data) => {
                  if (useMemo) {
                        memo.set(key, { at: Date.now(), data });
                        if (memo.size > MEMO_LIMIT) memo.delete(memo.keys().next().value);
                  }
                  return data;
            })
            .finally(() => inflight.delete(key));

      inflight.set(key, promise);
      return promise;
}

export const describeError = (error) => {
      if (typeof navigator !== "undefined" && navigator.onLine === false) return "You're offline. Reconnect and try again.";
      const status = error?.response?.status;
      if (status === 429) return "The catalogue service is busy. Please try again in a moment.";
      if (status && error?.response?.data?.status_message) return error.response.data.status_message;
      return "We couldn't load this content. Please try again.";
};
