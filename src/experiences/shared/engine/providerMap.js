import { tmdbGet } from "./tmdb";
import { REGISTRY_SIGNATURE, servicesFromProviderResults } from "../services";

// Global OTT classification cache.
//
// For each title we fetch `/{type}/{id}/watch/providers` once, merge the
// providers of every country TMDB returns, and remember which of our
// services the title belongs to. The result is kept in memory and in
// localStorage (7 day TTL) so repeat visits do not re-request mappings.
// The stored map carries the registry signature; when services or their
// matching rules change, the old classifications are discarded.

const STORAGE_KEY = "mtstreams:ott-provider-map:v1";
const TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_ENTRIES = 8000;
const SIGNATURE_KEY = "__registry";

const memory = new Map(); // "movie:550" -> { at, services: string[] }
const pending = new Map();
let persistTimer = null;

(function hydrate() {
      try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (parsed[SIGNATURE_KEY] !== REGISTRY_SIGNATURE) return;
            const now = Date.now();
            Object.entries(parsed).forEach(([key, value]) => {
                  if (key === SIGNATURE_KEY) return;
                  const [at, joined] = value;
                  if (now - at < TTL_MS) memory.set(key, { at, services: joined ? joined.split(",") : [] });
            });
      } catch {
            // Storage can be unavailable (private mode). The in-memory cache still works.
      }
})();

function persistSoon() {
      if (persistTimer) return;
      persistTimer = setTimeout(() => {
            persistTimer = null;
            try {
                  const entries = [...memory.entries()].sort((a, b) => b[1].at - a[1].at).slice(0, MAX_ENTRIES);
                  const payload = { [SIGNATURE_KEY]: REGISTRY_SIGNATURE };
                  entries.forEach(([key, value]) => {
                        payload[key] = [value.at, value.services.join(",")];
                  });
                  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
            } catch {
                  // Quota exceeded or storage disabled: keep working from memory.
            }
      }, 1200);
}

const keyFor = (mediaType, id) => `${mediaType}:${id}`;

export function getCachedServices(mediaType, id) {
      return memory.get(keyFor(mediaType, id))?.services || null;
}

/** Resolves to the list of service keys a title is globally associated with. */
export function getTitleServices(mediaType, id) {
      const key = keyFor(mediaType, id);
      const cached = memory.get(key);
      if (cached) return Promise.resolve(cached.services);
      if (pending.has(key)) return pending.get(key);

      const request = tmdbGet(`${mediaType}/${id}/watch/providers`, {}, { memo: false })
            .then((data) => {
                  const services = servicesFromProviderResults(data?.results);
                  memory.set(key, { at: Date.now(), services });
                  persistSoon();
                  return services;
            })
            .finally(() => pending.delete(key));

      pending.set(key, request);
      return request;
}

/** True when the title is associated with `serviceKey` in any country. */
export async function belongsTo(serviceKey, mediaType, id) {
      const services = await getTitleServices(mediaType, id);
      return services.includes(serviceKey);
}

/**
 * Filters a list of TMDB items (with media_type) down to the ones associated
 * with `serviceKey`. Verification failures are treated as "not matched"
 * rather than failing the whole batch.
 */
export async function filterByService(serviceKey, items) {
      const checks = await Promise.all(
            items.map((item) =>
                  belongsTo(serviceKey, item.media_type, item.id).then(
                        (ok) => ({ item, ok }),
                        () => ({ item, ok: false, failed: true })
                  )
            )
      );
      return {
            matches: checks.filter((check) => check.ok).map((check) => check.item),
            failures: checks.filter((check) => check.failed).length,
      };
}
