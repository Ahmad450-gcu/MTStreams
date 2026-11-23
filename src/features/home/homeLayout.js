// Home page layout preferences (order, hidden rows, pinned genres, density),
// stored locally. Unknown or removed sections are dropped on load and any new
// built-in sections are appended, so old saved layouts keep working.
import { useSyncExternalStore } from "react";
import { GENRES } from "../discover/discoverConfig";

const KEY = "mtstreams:home-layout:v1";

export const BUILT_IN = {
      trending: { label: "Trending now", kind: "mixed" },
      foryou: { label: "For You", kind: "mixed" },
      upcoming: { label: "Coming Soon", kind: "movie" },
      popularTv: { label: "Popular Series", kind: "tv" },
      topRated: { label: "Top Rated Movies", kind: "movie" },
      animation: { label: "Animation Picks", kind: "mixed" },
};
export const DEFAULT_LAYOUT = { order: Object.keys(BUILT_IN), hidden: [], density: "spacious" };

const GENRE_NAME = { movie: new Map(GENRES.movie), tv: new Map(GENRES.tv) };
export const genreKey = (type, id) => `genre:${type}:${id}`;
export function describeSection(key) {
      if (BUILT_IN[key]) return BUILT_IN[key];
      const match = /^genre:(movie|tv):(\d+)$/.exec(key);
      if (!match) return null;
      const name = GENRE_NAME[match[1]].get(Number(match[2]));
      return name ? { label: `${name} ${match[1] === "tv" ? "series" : "movies"}`, kind: match[1], genre: Number(match[2]), type: match[1] } : null;
}

function sanitize(raw) {
      const order = (Array.isArray(raw?.order) ? raw.order : []).filter((key, index, list) => typeof key === "string" && describeSection(key) && list.indexOf(key) === index).slice(0, 20);
      Object.keys(BUILT_IN).forEach((key) => !order.includes(key) && order.push(key));
      return {
            order,
            hidden: (Array.isArray(raw?.hidden) ? raw.hidden : []).filter((key) => order.includes(key)),
            density: raw?.density === "compact" ? "compact" : "spacious",
      };
}

let cache = null;
const listeners = new Set();
function read() {
      if (cache) return cache;
      try {
            cache = sanitize(JSON.parse(localStorage.getItem(KEY) || "null") || DEFAULT_LAYOUT);
      } catch {
            cache = sanitize(DEFAULT_LAYOUT);
      }
      return cache;
}
export function saveLayout(next) {
      cache = sanitize(next);
      try {
            localStorage.setItem(KEY, JSON.stringify(cache));
      } catch {
            // Storage unavailable: the layout lasts for this session.
      }
      listeners.forEach((listener) => listener());
}
export function resetLayout() {
      try {
            localStorage.removeItem(KEY);
      } catch {
            // Ignore.
      }
      cache = sanitize(DEFAULT_LAYOUT);
      listeners.forEach((listener) => listener());
}
const subscribe = (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
};
export const useHomeLayout = () => useSyncExternalStore(subscribe, read, read);
