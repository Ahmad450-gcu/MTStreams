// Small persistent cache (localStorage) for public TMDB data that is reused
// across visits, e.g. per-title recommendation lists. Entries expire, the
// total is capped, and failures (private mode, full quota) are silent: the
// app then simply refetches through the normal request client.

const PREFIX = "mtstreams:cache:v1:";
const MAX_ENTRIES = 60;

export function readCache(key, maxAgeMs) {
      try {
            const raw = localStorage.getItem(PREFIX + key);
            if (!raw) return null;
            const entry = JSON.parse(raw);
            if (!entry || Date.now() - entry.at > maxAgeMs) {
                  localStorage.removeItem(PREFIX + key);
                  return null;
            }
            return entry.data;
      } catch {
            return null;
      }
}

export function writeCache(key, data) {
      try {
            localStorage.setItem(PREFIX + key, JSON.stringify({ at: Date.now(), data }));
            prune();
      } catch {
            // Quota exceeded or storage blocked: drop the oldest half and move on.
            prune(Math.floor(MAX_ENTRIES / 2));
      }
}

function prune(limit = MAX_ENTRIES) {
      try {
            const entries = [];
            for (let index = 0; index < localStorage.length; index += 1) {
                  const key = localStorage.key(index);
                  if (!key?.startsWith(PREFIX)) continue;
                  let at = 0;
                  try {
                        at = JSON.parse(localStorage.getItem(key))?.at || 0;
                  } catch {
                        at = 0;
                  }
                  entries.push([key, at]);
            }
            if (entries.length <= limit) return;
            entries.sort((a, b) => a[1] - b[1]).slice(0, entries.length - limit).forEach(([key]) => localStorage.removeItem(key));
      } catch {
            // Storage unavailable.
      }
}
