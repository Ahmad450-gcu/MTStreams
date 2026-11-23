import { tmdbGet, describeError } from "./tmdb";
import { filterByService } from "./providerMap";
import { getService, monetizationOf } from "../services";

// Catalogue cursor
// ----------------
// A cursor walks several TMDB candidate sources page by page, verifies each
// candidate's GLOBAL watch providers, and keeps only titles associated with
// the selected service. It keeps scanning further candidate pages until the
// requested number of matches is collected (or the sources are exhausted /
// the scan limit is reached), so a page is never left with 2-3 titles just
// because the first candidate page happened to contain few matches.
//
// Candidate sources (round-robin):
//   * "seed" Discover pages filtered by the service's provider IDs in one of
//     several regions. These only *propose* candidates; membership is still
//     decided by the global per-title provider lookup.
//   * "general" pages (trending / discover with the same filters) with no
//     provider filter at all, so titles only available in other countries
//     can still surface.

const MAX_PAGES_PER_RUN = 16; // per ensure() call before yielding back to the UI
const MAX_PAGES_TOTAL = 120; // hard stop for one cursor
const PARALLEL_SOURCES = 2;

const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (days) => new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
const daysAhead = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

function sortParams(type, sort, spec) {
      const dateKey = type === "movie" ? "primary_release_date" : "first_air_date";
      switch (sort) {
            case "top":
                  return { sort_by: "vote_average.desc", "vote_count.gte": spec.minVotes ?? (type === "movie" ? 400 : 150) };
            case "new":
                  return {
                        sort_by: `${dateKey}.desc`,
                        [`${dateKey}.lte`]: today(),
                        [`${dateKey}.gte`]: daysAgo(spec.windowDays ?? 400),
                        "vote_count.gte": spec.minVotes ?? 3,
                  };
            case "upcoming":
                  return { sort_by: "popularity.desc", [`${dateKey}.gte`]: today(), [`${dateKey}.lte`]: daysAhead(120) };
            case "airing":
                  return { sort_by: "popularity.desc", "air_date.gte": daysAgo(spec.windowDays ?? 14), "air_date.lte": daysAhead(7) };
            case "season":
                  // `airDates` = anything airing in the window (simulcasts),
                  // otherwise titles that premiered in the window.
                  if (spec.airDates && type === "tv") {
                        return { sort_by: "popularity.desc", "air_date.gte": spec.from, "air_date.lte": spec.to };
                  }
                  return {
                        sort_by: "popularity.desc",
                        [`${dateKey}.gte`]: spec.from,
                        [`${dateKey}.lte`]: spec.to,
                  };
            case "alpha":
                  return { sort_by: type === "movie" ? "title.asc" : "name.asc", "vote_count.gte": spec.minVotes ?? 50 };
            case "trending":
            case "popular":
            default:
                  return { sort_by: "popularity.desc", "vote_count.gte": spec.minVotes ?? (type === "movie" ? 60 : 25) };
      }
}

function filterParams(spec, service, { general }) {
      const params = {};
      if (spec.genres) params.with_genres = String(spec.genres);
      if (spec.withoutGenres) params.without_genres = String(spec.withoutGenres);
      if (spec.language) params.with_original_language = spec.language;
      if (spec.companies) params.with_companies = String(spec.companies);
      if (spec.networks) params.with_networks = String(spec.networks);
      if (general && service.candidateFilter && !spec.ignoreCandidateFilter) {
            Object.entries(service.candidateFilter).forEach(([key, value]) => {
                  if (!params[key]) params[key] = value;
            });
      }
      return params;
}

function buildSources(service, spec) {
      const types = spec.types || ["movie"];
      const sources = [];
      const regions = spec.seeds === false ? [] : service.seedRegions;

      // Seeds first, interleaved per region; one general source per type is
      // placed after every few seed sources so it receives a fair share.
      const general = types.map((type) => {
            const useTrending = spec.sort === "trending" && !spec.genres && !spec.language && !spec.companies && !spec.networks && !service.candidateFilter;
            return {
                  id: `general:${type}`,
                  type,
                  path: useTrending ? `trending/${type}/day` : `discover/${type}`,
                  params: useTrending ? {} : { ...sortParams(type, spec.sort, spec), ...filterParams(spec, service, { general: true }), include_adult: "false" },
                  page: 0,
                  totalPages: Infinity,
                  exhausted: false,
            };
      });

      const seedSources = [];
      regions.forEach((region) => {
            types.forEach((type) => {
                  seedSources.push({
                        id: `seed:${region}:${type}`,
                        type,
                        path: `discover/${type}`,
                        params: {
                              ...sortParams(type, spec.sort, spec),
                              ...filterParams(spec, service, { general: false }),
                              with_watch_providers: service.providerIds.join("|"),
                              watch_region: region,
                              with_watch_monetization_types: monetizationOf(service).join("|"),
                              include_adult: "false",
                        },
                        page: 0,
                        totalPages: Infinity,
                        exhausted: false,
                  });
            });
      });

      let generalIndex = 0;
      seedSources.forEach((source, index) => {
            sources.push(source);
            if ((index + 1) % 3 === 0 && general.length) {
                  sources.push(general[generalIndex % general.length]);
                  generalIndex += 1;
            }
      });
      general.forEach((source) => {
            if (!sources.includes(source)) sources.push(source);
      });
      return sources;
}

const hasArtwork = (item) => Boolean(item.poster_path || item.backdrop_path);

export class CatalogueCursor {
      constructor(serviceKey, spec) {
            this.service = getService(serviceKey);
            this.serviceKey = serviceKey;
            this.spec = spec;
            this.sources = buildSources(this.service, spec);
            this.rr = 0;
            this.items = [];
            this.seen = new Set();
            this.pagesScanned = 0;
            this.status = "idle"; // idle | loading | ready | done | error
            this.error = null;
            this.listeners = new Set();
            this.loading = null;
      }

      get exhausted() {
            return this.pagesScanned >= (this.maxPagesTotal || MAX_PAGES_TOTAL) || this.sources.every((source) => source.exhausted);
      }

      get hasMore() {
            return !this.exhausted;
      }

      subscribe(listener) {
            this.listeners.add(listener);
            return () => this.listeners.delete(listener);
      }

      emit() {
            const snapshot = this.snapshot();
            this.listeners.forEach((listener) => listener(snapshot));
      }

      snapshot() {
            return {
                  items: this.items,
                  status: this.status,
                  error: this.error,
                  hasMore: this.hasMore,
                  pagesScanned: this.pagesScanned,
            };
      }

      nextSources(count) {
            const picked = [];
            const available = this.sources.filter((source) => !source.exhausted);
            if (!available.length) return picked;
            let guard = 0;
            while (picked.length < Math.min(count, available.length) && guard < this.sources.length * 2) {
                  const source = this.sources[this.rr % this.sources.length];
                  this.rr += 1;
                  guard += 1;
                  if (!source.exhausted && !picked.includes(source)) picked.push(source);
            }
            return picked;
      }

      async scanSource(source) {
            const page = source.page + 1;
            const data = await tmdbGet(source.path, { ...source.params, page });
            source.page = page;
            source.totalPages = Math.min(data?.total_pages || 0, 500);
            if (page >= source.totalPages || !data?.results?.length) source.exhausted = true;
            this.pagesScanned += 1;

            const candidates = [];
            (data?.results || []).forEach((raw) => {
                  const mediaType = raw.media_type || source.type;
                  if (mediaType !== "movie" && mediaType !== "tv") return;
                  if (raw.adult) return;
                  const key = `${mediaType}:${raw.id}`;
                  if (this.seen.has(key) || !hasArtwork(raw)) return;
                  // Skip obscure search hits (no votes); they almost never map to a service.
                  if (this.candidateMinVotes && (raw.vote_count || 0) < this.candidateMinVotes) return;
                  this.seen.add(key);
                  candidates.push({ ...raw, media_type: mediaType });
            });

            if (!candidates.length) return [];
            const { matches } = await filterByService(this.serviceKey, candidates);
            return matches;
      }

      /** Load until at least `target` matches exist, the run limit or the end. */
      ensure(target) {
            if (this.items.length >= target || this.exhausted) {
                  if (this.exhausted && this.status !== "error") {
                        this.status = "done";
                        this.emit();
                  }
                  return Promise.resolve(this.snapshot());
            }
            if (this.loading) {
                  this.pendingTarget = Math.max(this.pendingTarget || 0, target);
                  return this.loading;
            }

            this.status = "loading";
            this.error = null;
            this.emit();

            this.loading = (async () => {
                  let pagesThisRun = 0;
                  try {
                        while (
                              this.items.length < Math.max(target, this.pendingTarget || 0) &&
                              !this.exhausted &&
                              pagesThisRun < (this.pagesPerRun || MAX_PAGES_PER_RUN)
                        ) {
                              const batch = this.nextSources(this.parallel || PARALLEL_SOURCES);
                              if (!batch.length) break;
                              const results = await Promise.allSettled(batch.map((source) => this.scanSource(source)));
                              pagesThisRun += batch.length;

                              let added = false;
                              let failures = 0;
                              results.forEach((result, index) => {
                                    if (result.status === "fulfilled") {
                                          if (result.value.length) {
                                                this.items = [...this.items, ...result.value];
                                                added = true;
                                          }
                                    } else {
                                          failures += 1;
                                          // A failing source is retried once on a later pass, then skipped.
                                          const source = batch[index];
                                          source.failures = (source.failures || 0) + 1;
                                          if (source.failures > 1) source.exhausted = true;
                                          this.lastError = result.reason;
                                    }
                              });

                              if (failures === batch.length && !this.items.length) {
                                    throw this.lastError || new Error("Catalogue request failed");
                              }
                              if (added) this.emit();
                        }
                        this.status = this.exhausted ? "done" : "ready";
                  } catch (error) {
                        this.status = "error";
                        this.error = describeError(error);
                  } finally {
                        this.loading = null;
                        this.pendingTarget = 0;
                        this.emit();
                  }
                  return this.snapshot();
            })();

            return this.loading;
      }

      retry() {
            this.sources.forEach((source) => {
                  if (source.failures > 1 && source.page < source.totalPages) source.exhausted = false;
                  source.failures = 0;
            });
            this.status = "idle";
            this.error = null;
            return this.ensure(this.items.length + 20);
      }
}

const cursors = new Map();

export function getCatalogueCursor(serviceKey, spec) {
      const key = `${serviceKey}|${JSON.stringify(spec)}`;
      if (!cursors.has(key)) {
            cursors.set(key, new CatalogueCursor(serviceKey, spec));
            if (cursors.size > 120) cursors.delete(cursors.keys().next().value);
      }
      return cursors.get(key);
}

// Search: candidates are TMDB multi-search pages for the query, verified with
// the same global provider lookup, scanning further pages until enough
// matches exist. Results are cached per (service, query).
const searchCursors = new Map();

export function getSearchCursor(serviceKey, query) {
      const normalized = query.trim().toLowerCase();
      const key = `${serviceKey}|${normalized}`;
      if (!searchCursors.has(key)) {
            const cursor = new CatalogueCursor(serviceKey, { types: ["movie", "tv"], sort: "popular", search: normalized });
            const params = { query: query.trim(), include_adult: "false" };
            // Three sources scanned in parallel: multi-search keeps TMDB's
            // relevance order, the typed searches widen coverage. Duplicates
            // are removed by the cursor.
            cursor.sources = [
                  { id: "search:multi", type: "multi", path: "search/multi", params, page: 0, totalPages: Infinity, exhausted: false },
                  { id: "search:movie", type: "movie", path: "search/movie", params, page: 0, totalPages: Infinity, exhausted: false },
                  { id: "search:tv", type: "tv", path: "search/tv", params, page: 0, totalPages: Infinity, exhausted: false },
            ];
            cursor.parallel = 3;
            cursor.pagesPerRun = 9; // three pages per source per run, then "Load more"
            cursor.maxPagesTotal = 45;
            cursor.candidateMinVotes = 3;
            searchCursors.set(key, cursor);
            if (searchCursors.size > 40) searchCursors.delete(searchCursors.keys().next().value);
      }
      return searchCursors.get(key);
}
