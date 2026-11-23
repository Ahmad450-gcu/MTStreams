// Personal recommendations, computed entirely in the browser.
//
// Network use is bounded: at most MAX_SEEDS TMDB "recommendations" lists are
// needed (one per seed title), each cached on the device for a day (and at
// the CDN by the proxy). Everything else — the taste profile, scoring,
// exclusions, diversity and explanations — is local arithmetic over the
// user's library and the metadata already present in those lists.

import { tmdbGet } from "../../experiences/shared/engine/tmdb";
import { readCache, writeCache } from "../shared/localCache";
import { keyOf } from "../library/store";
import { GENRES } from "../discover/discoverConfig";

export const MAX_SEEDS = 5;
const LIST_TTL = 24 * 60 * 60 * 1000;
const MIN_VOTES = 20;

const genreName = (() => {
      const names = new Map([...GENRES.movie, ...GENRES.tv]);
      return (id) => names.get(id) || "";
})();

/** How strongly a saved title says "more like this". Negative = dislike. */
export function seedWeight(item) {
      if (item.status === "dismissed") return -1;
      if (item.rating != null) return (item.rating - 5) / 2.5; // 10 → 2, 8 → 1.2, 5 → 0, 1 → -1.6
      return { watched: 0.8, watching: 0.7, want: 0.5 }[item.status] ?? 0.4;
}

/** Pick the titles whose recommendation lists are worth fetching. */
export function pickSeeds(items) {
      return items
            .map((item) => ({ item, weight: seedWeight(item) }))
            .filter((entry) => entry.weight > 0.3)
            .sort((a, b) => b.weight - a.weight || (b.item.updatedAt || 0) - (a.item.updatedAt || 0))
            .slice(0, MAX_SEEDS);
}

/** Genre and language preferences from the whole library (likes and dislikes). */
export function tasteProfile(items) {
      const genres = new Map();
      const languages = new Map();
      items.forEach((item) => {
            const weight = seedWeight(item);
            (item.genre_ids || []).forEach((id) => genres.set(id, (genres.get(id) || 0) + weight));
            if (item.original_language && weight > 0) languages.set(item.original_language, (languages.get(item.original_language) || 0) + weight);
      });
      const maxGenre = Math.max(1, ...[...genres.values()].map(Math.abs));
      const maxLanguage = Math.max(1, ...languages.values());
      genres.forEach((value, id) => genres.set(id, value / maxGenre));
      languages.forEach((value, code) => languages.set(code, value / maxLanguage));
      const favourites = [...genres.entries()].filter(([, value]) => value > 0.35).sort((a, b) => b[1] - a[1]).map(([id]) => id);
      return { genres, languages, favourites };
}

async function recommendationsFor(item) {
      const cacheKey = `rec:${item.key}`;
      const cached = readCache(cacheKey, LIST_TTL);
      if (cached) return cached;
      const data = await tmdbGet(`${item.media_type}/${item.id}/recommendations`, {});
      // Keep only the fields the scorer and the cards need.
      const slim = (data?.results || []).slice(0, 20).map((entry) => ({
            id: entry.id,
            media_type: entry.media_type === "tv" || entry.media_type === "movie" ? entry.media_type : item.media_type,
            title: entry.title || entry.name,
            poster_path: entry.poster_path,
            backdrop_path: entry.backdrop_path,
            release_date: entry.release_date || entry.first_air_date || "",
            vote_average: entry.vote_average || 0,
            vote_count: entry.vote_count || 0,
            genre_ids: entry.genre_ids || [],
            original_language: entry.original_language || "",
            adult: Boolean(entry.adult),
      }));
      writeCache(cacheKey, slim);
      return slim;
}

/**
 * Build ranked recommendations.
 * @returns {Promise<{needsSeeds: boolean, picks: Array, failedSeeds: number}>}
 */
export async function recommend(items, { limit = 20 } = {}) {
      const seeds = pickSeeds(items);
      if (!seeds.length) return { needsSeeds: true, picks: [], failedSeeds: 0 };

      const profile = tasteProfile(items);
      const saved = new Set(items.map((item) => item.key));
      const lists = await Promise.allSettled(seeds.map(({ item }) => recommendationsFor(item)));

      const candidates = new Map();
      let failedSeeds = 0;
      lists.forEach((result, seedIndex) => {
            if (result.status !== "fulfilled") {
                  failedSeeds += 1;
                  return;
            }
            const seed = seeds[seedIndex];
            result.value.forEach((entry, rank) => {
                  const key = keyOf(entry.media_type, entry.id);
                  // Exclusions: anything already in the library (watched, saved or
                  // dismissed), adult titles, missing artwork, and near-unrated titles.
                  if (saved.has(key) || entry.adult || !entry.poster_path || entry.vote_count < MIN_VOTES) return;
                  const support = seed.weight / Math.sqrt(rank + 1);
                  const existing = candidates.get(key) || { ...entry, key, support: 0, sources: [] };
                  existing.support += support;
                  existing.sources.push({ item: seed.item, support });
                  candidates.set(key, existing);
            });
      });

      const scored = [...candidates.values()].map((candidate) => {
            const genreHits = candidate.genre_ids.map((id) => profile.genres.get(id) || 0);
            const genreAffinity = genreHits.length ? genreHits.reduce((sum, value) => sum + value, 0) / genreHits.length : 0;
            const language = profile.languages.get(candidate.original_language) || 0;
            const quality = (candidate.vote_average / 10) * Math.min(1, Math.log10(candidate.vote_count + 1) / 3);
            const score = candidate.support + 1.1 * genreAffinity + 0.35 * language + 0.45 * quality;
            const topSource = candidate.sources.sort((a, b) => b.support - a.support)[0];
            return { ...candidate, score, genreAffinity, topSource };
      });

      // Greedy selection with diversity: each pick slightly penalises remaining
      // candidates that share its main genre or come from the same seed.
      const picks = [];
      const pool = [...scored];
      while (picks.length < limit && pool.length) {
            pool.sort((a, b) => b.score - a.score);
            const next = pool.shift();
            picks.push({ ...next, reason: explain(next, profile) });
            pool.forEach((candidate) => {
                  if (candidate.genre_ids[0] && candidate.genre_ids[0] === next.genre_ids[0]) candidate.score *= 0.9;
                  if (candidate.topSource.item.key === next.topSource.item.key) candidate.score *= 0.88;
            });
      }
      return { needsSeeds: false, picks, failedSeeds };
}

/** Explanations only state facts present in the data. */
function explain(candidate, profile) {
      const seed = candidate.topSource.item;
      const shared = candidate.genre_ids.filter((id) => profile.favourites.includes(id)).map(genreName).filter(Boolean).slice(0, 2);
      if (candidate.sources.length > 1) return `Similar to ${candidate.sources.length} titles in your list`;
      if (seed.rating >= 8) return `Because you rated ${seed.title} ${seed.rating}/10`;
      if (seed.status === "watched") return `Because you watched ${seed.title}`;
      if (shared.length && candidate.genreAffinity > candidate.support) return `Matches your favourite genres: ${shared.join(" & ")}`;
      return `Because you saved ${seed.title}`;
}
