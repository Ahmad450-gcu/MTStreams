import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { getCatalogueCursor, getSearchCursor } from "./engine/catalogue";
import { tmdbGet, describeError } from "./engine/tmdb";
import { filterByService, getTitleServices, getCachedServices } from "./engine/providerMap";

export const tmdbImg = (path, size = "w500") => (path ? `https://image.tmdb.org/t/p/${size}${path}` : null);
export const titleOf = (item) => item?.title || item?.name || item?.original_title || item?.original_name || "Untitled";
export const yearOf = (item) => (item?.release_date || item?.first_air_date || "").slice(0, 4);
export const typeOf = (item) => item?.media_type || (item?.first_air_date !== undefined || item?.name ? "tv" : "movie");
export const detailPath = (item) => `/${typeOf(item)}/details/${item.id}`;
export const runtimeLabel = (minutes) => {
      if (!minutes) return "";
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return h ? `${h}h ${m}m` : `${m}m`;
};

// ---------------------------------------------------------------------------
// Catalogue + search
// ---------------------------------------------------------------------------

function useCursor(cursor, target, enabled, maxAutoRuns = 3) {
      const [snapshot, setSnapshot] = useState(() => cursor?.snapshot() || { items: [], status: "idle", hasMore: false });
      const runs = useRef(0);

      useEffect(() => {
            if (!cursor) return undefined;
            setSnapshot(cursor.snapshot());
            runs.current = 0;
            return cursor.subscribe(setSnapshot);
      }, [cursor]);

      useEffect(() => {
            if (!cursor || !enabled) return;
            cursor.ensure(target);
      }, [cursor, target, enabled]);

      // If one bounded scan run finished short of the target (sparse service),
      // continue a couple more runs automatically; the cursor's hard page cap
      // still prevents endless scanning.
      useEffect(() => {
            if (!cursor || !enabled) return;
            if (snapshot.status === "ready" && snapshot.items.length < target && snapshot.hasMore && runs.current < (typeof maxAutoRuns === "function" ? maxAutoRuns(snapshot) : maxAutoRuns)) {
                  runs.current += 1;
                  cursor.ensure(target);
            }
      }, [cursor, enabled, snapshot.status, snapshot.items.length, snapshot.hasMore, target, maxAutoRuns]);

      const loadMore = useCallback((count = 20) => {
            if (!cursor) return;
            runs.current = 0;
            cursor.ensure(cursor.items.length + count);
      }, [cursor]);

      const retry = useCallback(() => cursor?.retry(), [cursor]);

      return {
            items: snapshot.items,
            status: snapshot.status,
            error: snapshot.error,
            hasMore: snapshot.hasMore,
            loading: snapshot.status === "loading" || (enabled && snapshot.status === "idle"),
            loadMore,
            retry,
      };
}

/**
 * Service-filtered catalogue.
 * spec: { types: ["movie"|"tv"], sort, genres, language, companies, networks, minVotes, ... }
 */
export function useCatalogue(serviceKey, spec, { target = 20, enabled = true } = {}) {
      const specKey = JSON.stringify(spec);
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const cursor = useMemo(() => (serviceKey ? getCatalogueCursor(serviceKey, spec) : null), [serviceKey, specKey]);
      return useCursor(cursor, target, enabled);
}

/** Paged catalogue for grids: grows `target` each time loadMore is called. */
export function usePagedCatalogue(serviceKey, spec, { pageSize = 30, enabled = true } = {}) {
      const [target, setTarget] = useState(pageSize);
      const specKey = JSON.stringify(spec);
      useEffect(() => setTarget(pageSize), [specKey, pageSize]);
      const result = useCatalogue(serviceKey, spec, { target, enabled });
      const loadMore = useCallback(() => {
            setTarget((current) => Math.max(current, result.items.length) + pageSize);
      }, [pageSize, result.items.length]);
      return { ...result, loadMore };
}

const searchAutoRuns = (snapshot) => (snapshot.items.length ? 1 : 4);

export function useServiceSearch(serviceKey, query, { pageSize = 24 } = {}) {
      const trimmed = (query || "").trim();
      const [target, setTarget] = useState(pageSize);
      useEffect(() => setTarget(pageSize), [trimmed, pageSize]);
      const cursor = useMemo(() => (serviceKey && trimmed.length >= 2 ? getSearchCursor(serviceKey, trimmed) : null), [serviceKey, trimmed]);
      // Search runs are bounded: one automatic continuation, then the UI
      // offers "Load more" so sparse services never scan endlessly.
      // With no matches yet, keep looking a little longer before giving up.
      const result = useCursor(cursor, target, Boolean(cursor), searchAutoRuns);
      const loadMore = useCallback(() => {
            setTarget((current) => Math.max(current, result.items.length) + pageSize);
            result.loadMore(pageSize);
      }, [pageSize, result]);
      return { ...result, active: Boolean(cursor), loadMore };
}

export function useDebounced(value, delay = 350) {
      const [debounced, setDebounced] = useState(value);
      useEffect(() => {
            const timer = setTimeout(() => setDebounced(value), delay);
            return () => clearTimeout(timer);
      }, [value, delay]);
      return debounced;
}

// ---------------------------------------------------------------------------
// Visibility / infinite scroll
// ---------------------------------------------------------------------------

export function useInView(options = {}) {
      const { rootMargin = "400px 0px", once = true } = options;
      const ref = useRef(null);
      const [inView, setInView] = useState(false);
      useEffect(() => {
            const node = ref.current;
            if (!node) return undefined;
            if (typeof IntersectionObserver === "undefined") {
                  setInView(true);
                  return undefined;
            }
            const observer = new IntersectionObserver(([entry]) => {
                  if (entry.isIntersecting) {
                        setInView(true);
                        if (once) observer.disconnect();
                  } else if (!once) {
                        setInView(false);
                  }
            }, { rootMargin });
            observer.observe(node);
            return () => observer.disconnect();
      }, [rootMargin, once]);
      return [ref, inView];
}

/** Calls `onHit` whenever the sentinel scrolls into view (and is enabled). */
export function useInfiniteSentinel(onHit, enabled) {
      const ref = useRef(null);
      const callback = useRef(onHit);
      callback.current = onHit;
      useEffect(() => {
            const node = ref.current;
            if (!node || !enabled || typeof IntersectionObserver === "undefined") return undefined;
            const observer = new IntersectionObserver(([entry]) => {
                  if (entry.isIntersecting) callback.current();
            }, { rootMargin: "900px 0px" });
            observer.observe(node);
            return () => observer.disconnect();
      }, [enabled]);
      return ref;
}

// ---------------------------------------------------------------------------
// Title details
// ---------------------------------------------------------------------------

const pickLogo = (logos = []) => {
      const english = logos.filter((logo) => logo.iso_639_1 === "en");
      const neutral = logos.filter((logo) => !logo.iso_639_1);
      const pool = english.length ? english : neutral.length ? neutral : logos;
      return [...pool].sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))[0]?.file_path || null;
};

const logoCache = new Map();

export function useLogo(mediaType, id, enabled = true) {
      const key = `${mediaType}:${id}`;
      const [logo, setLogo] = useState(() => logoCache.get(key));
      useEffect(() => {
            if (!enabled || !id || !mediaType) return undefined;
            if (logoCache.has(key)) {
                  setLogo(logoCache.get(key));
                  return undefined;
            }
            let alive = true;
            tmdbGet(`${mediaType}/${id}/images`, { include_image_language: "en,null" })
                  .then((data) => {
                        const path = pickLogo(data?.logos);
                        logoCache.set(key, path);
                        if (alive) setLogo(path);
                  })
                  .catch(() => {
                        logoCache.set(key, null);
                        if (alive) setLogo(null);
                  });
            return () => {
                  alive = false;
            };
      }, [key, mediaType, id, enabled]);
      return logo;
}

/**
 * Loads everything a details page needs. Recommendations are filtered to
 * the active service; if too few match, the list is topped up with
 * service-filtered titles sharing the first genre.
 */
export function useTitle(serviceKey, mediaType, id) {
      const [state, setState] = useState({ status: "loading", data: null, error: null });
      const [attempt, setAttempt] = useState(0);

      useEffect(() => {
            let alive = true;
            setState({ status: "loading", data: null, error: null });
            (async () => {
                  try {
                        const detail = await tmdbGet(`${mediaType}/${id}`, {}, { priority: true });
                        const [credits, videos, images, recs, similar] = await Promise.all([
                              tmdbGet(`${mediaType}/${id}/credits`, {}, { priority: true }).catch(() => ({ cast: [], crew: [] })),
                              tmdbGet(`${mediaType}/${id}/videos`, {}, { priority: true }).catch(() => ({ results: [] })),
                              tmdbGet(`${mediaType}/${id}/images`, { include_image_language: "en,null" }, { priority: true }).catch(() => ({ logos: [] })),
                              tmdbGet(`${mediaType}/${id}/recommendations`, {}, { priority: true }).catch(() => ({ results: [] })),
                              tmdbGet(`${mediaType}/${id}/similar`, {}, { priority: true }).catch(() => ({ results: [] })),
                        ]);
                        if (!alive) return;
                        const logo = pickLogo(images?.logos);
                        logoCache.set(`${mediaType}:${id}`, logo);
                        const trailer = (videos?.results || []).find((video) => video.site === "YouTube" && video.type === "Trailer")
                              || (videos?.results || []).find((video) => video.site === "YouTube");
                        const base = {
                              detail: { ...detail, media_type: mediaType },
                              cast: (credits?.cast || []).slice(0, 18),
                              crew: credits?.crew || [],
                              director: (credits?.crew || []).filter((person) => person.job === "Director").slice(0, 2),
                              creators: detail?.created_by || [],
                              trailer,
                              logo,
                              related: [],
                              relatedStatus: "loading",
                        };
                        setState({ status: "ready", data: base, error: null });

                        const seen = new Set([`${mediaType}:${id}`]);
                        const candidates = [...(recs?.results || []), ...(similar?.results || [])]
                              .map((item) => ({ ...item, media_type: item.media_type || mediaType }))
                              .filter((item) => {
                                    const key = `${item.media_type}:${item.id}`;
                                    if (seen.has(key) || (!item.poster_path && !item.backdrop_path)) return false;
                                    seen.add(key);
                                    return item.media_type === "movie" || item.media_type === "tv";
                              })
                              .slice(0, 40);
                        let related = candidates;
                        if (serviceKey) {
                              const { matches } = await filterByService(serviceKey, candidates);
                              related = matches;
                              if (related.length < 8 && detail?.genres?.[0]) {
                                    const cursor = getCatalogueCursor(serviceKey, {
                                          types: [mediaType],
                                          sort: "popular",
                                          genres: String(detail.genres[0].id),
                                    });
                                    await cursor.ensure(16);
                                    cursor.items.forEach((item) => {
                                          const key = `${item.media_type}:${item.id}`;
                                          if (!seen.has(key) && related.length < 18) {
                                                seen.add(key);
                                                related = [...related, item];
                                          }
                                    });
                              }
                        }
                        if (alive) setState((current) => ({ ...current, data: { ...current.data, related: related.slice(0, 18), relatedStatus: "ready" } }));
                  } catch (error) {
                        if (alive) setState({ status: "error", data: null, error: describeError(error) });
                  }
            })();
            return () => {
                  alive = false;
            };
      }, [serviceKey, mediaType, id, attempt]);

      return { ...state, retry: () => setAttempt((count) => count + 1) };
}

export function useSeason(tvId, seasonNumber) {
      const [state, setState] = useState({ status: "idle", episodes: [], error: null });
      const [attempt, setAttempt] = useState(0);
      useEffect(() => {
            if (!tvId || seasonNumber === undefined || seasonNumber === null) return undefined;
            let alive = true;
            setState({ status: "loading", episodes: [], error: null });
            tmdbGet(`tv/${tvId}/season/${seasonNumber}`, {}, { priority: true })
                  .then((data) => alive && setState({ status: "ready", episodes: data?.episodes || [], season: data, error: null }))
                  .catch((error) => alive && setState({ status: "error", episodes: [], error: describeError(error) }));
            return () => {
                  alive = false;
            };
      }, [tvId, seasonNumber, attempt]);
      return { ...state, retry: () => setAttempt((count) => count + 1) };
}

/** Global service membership of one title (for "available on" labels). */
export function useTitleServices(mediaType, id) {
      const [services, setServices] = useState(() => getCachedServices(mediaType, id));
      useEffect(() => {
            if (!mediaType || !id) return undefined;
            let alive = true;
            getTitleServices(mediaType, id).then((list) => alive && setServices(list)).catch(() => alive && setServices([]));
            return () => {
                  alive = false;
            };
      }, [mediaType, id]);
      return services;
}

/** Fetch a plain TMDB list (e.g. a tv/{id} for last episode) with state. */
export function useTmdb(path, params, enabled = true) {
      const paramsKey = JSON.stringify(params || {});
      const [state, setState] = useState({ status: "idle", data: null });
      useEffect(() => {
            if (!enabled || !path) return undefined;
            let alive = true;
            setState({ status: "loading", data: null });
            tmdbGet(path, JSON.parse(paramsKey))
                  .then((data) => alive && setState({ status: "ready", data }))
                  .catch((error) => alive && setState({ status: "error", data: null, error: describeError(error) }));
            return () => {
                  alive = false;
            };
      }, [path, paramsKey, enabled]);
      return state;
}

// ---------------------------------------------------------------------------
// Per-service "My List" and shared watch history (localStorage)
// ---------------------------------------------------------------------------

const storeListeners = new Set();
const readJSON = (key, fallback) => {
      try {
            const raw = window.localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
      } catch {
            return fallback;
      }
};
const writeJSON = (key, value) => {
      try {
            window.localStorage.setItem(key, JSON.stringify(value));
      } catch {
            // ignore storage failures
      }
      snapshots.delete(key);
      storeListeners.forEach((listener) => listener());
};
const snapshots = new Map();
const getSnapshot = (key) => {
      if (!snapshots.has(key)) snapshots.set(key, readJSON(key, []));
      return snapshots.get(key);
};
const subscribeStore = (listener) => {
      storeListeners.add(listener);
      return () => storeListeners.delete(listener);
};

const compact = (item) => ({
      id: item.id,
      media_type: typeOf(item),
      title: item.title,
      name: item.name,
      poster_path: item.poster_path,
      backdrop_path: item.backdrop_path,
      vote_average: item.vote_average,
      release_date: item.release_date,
      first_air_date: item.first_air_date,
      genre_ids: item.genre_ids || (item.genres || []).map((genre) => genre.id),
      overview: item.overview,
});

export function useMyList(serviceKey) {
      const key = `mtstreams:mylist:${serviceKey}`;
      const list = useSyncExternalStore(subscribeStore, () => getSnapshot(key), () => []);
      const has = useCallback((item) => list.some((entry) => entry.id === item?.id && entry.media_type === typeOf(item)), [list]);
      const toggle = useCallback((item) => {
            const current = getSnapshot(key);
            const exists = current.some((entry) => entry.id === item.id && entry.media_type === typeOf(item));
            writeJSON(key, exists
                  ? current.filter((entry) => !(entry.id === item.id && entry.media_type === typeOf(item)))
                  : [compact(item), ...current].slice(0, 200));
      }, [key]);
      return { list, has, toggle };
}

const HISTORY_KEY = "mtstreams:watch-history";

export function recordWatch(item, extra = {}) {
      const current = getSnapshot(HISTORY_KEY);
      const previous = current.find((entry) => entry.id === item.id && entry.media_type === typeOf(item));
      const entry = {
            ...compact(item),
            runtime: item.runtime || item.episode_run_time?.[0] || previous?.runtime || null,
            secondsWatched: (previous?.secondsWatched || 0) + (extra.seconds || 0),
            season: extra.season ?? previous?.season,
            episode: extra.episode ?? previous?.episode,
            at: Date.now(),
      };
      writeJSON(HISTORY_KEY, [entry, ...current.filter((other) => other !== previous)].slice(0, 50));
}

/** Titles the viewer actually opened in the player, newest first. */
export function useWatchHistory(serviceKey) {
      const history = useSyncExternalStore(subscribeStore, () => getSnapshot(HISTORY_KEY), () => []);
      return useMemo(() => {
            if (!serviceKey) return history;
            return history.filter((entry) => (getCachedServices(entry.media_type, entry.id) || []).includes(serviceKey));
      }, [history, serviceKey]);
}

/** Fraction watched, from real time spent in the player vs. runtime. */
export const progressOf = (entry) => {
      if (!entry?.runtime || !entry.secondsWatched) return 0.05;
      return Math.max(0.05, Math.min(0.95, entry.secondsWatched / (entry.runtime * 60)));
};

// ---------------------------------------------------------------------------
// Responsive helpers and maturity ratings
// ---------------------------------------------------------------------------

export function useMediaQuery(query) {
      const get = () => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia(query).matches : false);
      const [matches, setMatches] = useState(get);
      useEffect(() => {
            if (!window.matchMedia) return undefined;
            const list = window.matchMedia(query);
            const onChange = () => setMatches(list.matches);
            onChange();
            list.addEventListener("change", onChange);
            return () => list.removeEventListener("change", onChange);
      }, [query]);
      return matches;
}

const certCache = new Map();
const CERT_REGIONS = ["US", "GB", "CA", "AU"];

/** Real maturity rating (e.g. "PG-13", "TV-MA") from TMDB release data. */
export function useCertification(mediaType, id, enabled = true) {
      const key = `${mediaType}:${id}`;
      const [cert, setCert] = useState(() => certCache.get(key) || null);
      useEffect(() => {
            if (!enabled || !mediaType || !id) return undefined;
            if (certCache.has(key)) {
                  setCert(certCache.get(key));
                  return undefined;
            }
            let alive = true;
            const path = mediaType === "tv" ? `tv/${id}/content_ratings` : `movie/${id}/release_dates`;
            tmdbGet(path)
                  .then((data) => {
                        let value = null;
                        for (const region of CERT_REGIONS) {
                              const entry = (data?.results || []).find((result) => result.iso_3166_1 === region);
                              if (!entry) continue;
                              value = mediaType === "tv"
                                    ? entry.rating
                                    : (entry.release_dates || []).map((release) => release.certification).find(Boolean);
                              if (value) break;
                        }
                        certCache.set(key, value || null);
                        if (alive) setCert(value || null);
                  })
                  .catch(() => certCache.set(key, null));
            return () => {
                  alive = false;
            };
      }, [key, mediaType, id, enabled]);
      return cert;
}

export const isRecent = (item, days = 45) => {
      const date = item?.release_date || item?.first_air_date;
      if (!date) return false;
      const age = Date.now() - new Date(date).getTime();
      return age >= 0 && age < days * 86400000;
};
