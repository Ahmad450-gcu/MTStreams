// Release Radar data. No background jobs: checks happen only when the user
// opens Release Radar, presses Refresh, or (if they turned notifications on)
// when the app starts/returns to the foreground at most once every 12 hours.
//
// Movies cost nothing (release dates are already stored in the library).
// Series cost one request each (tv/{id}: next/last episode), cached for 12
// hours on the device and 6 hours at the CDN, capped at MAX_SHOWS.

import { tmdbGet } from "../../experiences/shared/engine/tmdb";
import { readCache, writeCache } from "../shared/localCache";
import { getSnapshot, loadLibrary } from "../library/store";

export const MAX_SHOWS = 40;
export const CHECK_INTERVAL = 12 * 60 * 60 * 1000;
const LAST_CHECK = "mtstreams:radar:last-check";
const NOTIFY_KEY = "mtstreams:radar:notify";
const NOTIFIED = "mtstreams:radar:notified";

const day = (offset = 0) => {
      const date = new Date();
      date.setDate(date.getDate() + offset);
      return date.toISOString().slice(0, 10);
};

export function trackedTitles(items) {
      const shows = items
            .filter((item) => item.media_type === "tv" && item.status !== "dismissed")
            .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
            .slice(0, MAX_SHOWS);
      const movies = items.filter((item) => item.media_type === "movie" && item.status !== "dismissed" && item.release_date && item.release_date >= day(-30));
      return { shows, movies, skippedShows: Math.max(0, items.filter((item) => item.media_type === "tv" && item.status !== "dismissed").length - MAX_SHOWS) };
}

async function showStatus(item, force) {
      const key = `radar:${item.key}`;
      if (!force) {
            const cached = readCache(key, CHECK_INTERVAL);
            if (cached) return cached;
      }
      const data = await tmdbGet(`tv/${item.id}`, {}, { memo: !force });
      const episode = (entry) => (entry ? { season: entry.season_number, episode: entry.episode_number, name: entry.name, date: entry.air_date } : null);
      const slim = {
            key: item.key,
            id: item.id,
            title: data.name || item.title,
            poster_path: data.poster_path || item.poster_path,
            status: data.status || "",
            next: episode(data.next_episode_to_air),
            last: episode(data.last_episode_to_air),
      };
      writeCache(key, slim);
      return slim;
}

/** Build the radar. `force` bypasses the 12-hour cache (manual refresh). */
export async function buildRadar(items, { force = false } = {}) {
      const { shows, movies, skippedShows } = trackedTitles(items);
      const results = await Promise.allSettled(shows.map((item) => showStatus(item, force)));
      const statuses = results.filter((result) => result.status === "fulfilled").map((result) => result.value);
      const failed = results.length - statuses.length;
      try {
            localStorage.setItem(LAST_CHECK, String(Date.now()));
      } catch {
            // Ignore storage failures.
      }

      const today = day(0);
      const events = [];
      statuses.forEach((show) => {
            if (show.next?.date) events.push({ kind: "episode", date: show.next.date, show, episode: show.next });
            if (show.last?.date && show.last.date >= day(-14)) events.push({ kind: "episode", date: show.last.date, show, episode: show.last });
      });
      movies.forEach((movie) => events.push({ kind: "movie", date: movie.release_date, movie }));
      const unique = new Map(events.map((event) => [`${event.kind}:${event.show?.key || event.movie.key}:${event.date}:${event.episode?.episode ?? ""}`, event]));
      const all = [...unique.values()].sort((a, b) => a.date.localeCompare(b.date));
      return {
            upcoming: all.filter((event) => event.date >= today),
            recent: all.filter((event) => event.date < today).reverse(),
            shows: statuses.sort((a, b) => (a.next?.date || "9999").localeCompare(b.next?.date || "9999")),
            failed,
            skippedShows,
            checkedAt: Date.now(),
      };
}

export const lastCheck = () => {
      try {
            return Number(localStorage.getItem(LAST_CHECK)) || 0;
      } catch {
            return 0;
      }
};

export const notificationsEnabled = () => {
      try {
            return localStorage.getItem(NOTIFY_KEY) === "1" && typeof Notification !== "undefined" && Notification.permission === "granted";
      } catch {
            return false;
      }
};

export async function setNotifications(on) {
      const store = (value) => {
            try {
                  localStorage.setItem(NOTIFY_KEY, value);
            } catch {
                  // Storage unavailable: the setting lasts for this page only.
            }
      };
      if (!on) {
            store("0");
            return false;
      }
      if (typeof Notification === "undefined") return false;
      const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
      const enabled = permission === "granted";
      store(enabled ? "1" : "0");
      return enabled;
}

/** Show a notification for releases dated today that haven't been announced yet. */
export function notifyToday(radar) {
      if (!notificationsEnabled()) return;
      let seen = [];
      try {
            seen = JSON.parse(localStorage.getItem(NOTIFIED) || "[]");
      } catch {
            seen = [];
      }
      const today = day(0);
      const fresh = radar.upcoming.filter((event) => event.date === today).map((event) => ({
            id: `${event.kind}:${event.show?.key || event.movie.key}:${event.date}`,
            text: event.kind === "movie" ? `${event.movie.title} is out today` : `${event.show.title} S${event.episode.season}E${event.episode.episode} airs today`,
      })).filter((entry) => !seen.includes(entry.id));
      fresh.forEach((entry) => {
            try {
                  new Notification("MTStreams Release Radar", { body: entry.text, icon: "/logo-192.png", tag: entry.id });
            } catch {
                  // Some browsers only allow notifications from a service worker.
            }
      });
      try {
            if (fresh.length) localStorage.setItem(NOTIFIED, JSON.stringify([...fresh.map((entry) => entry.id), ...seen].slice(0, 200)));
      } catch {
            // Ignore storage failures.
      }
}

/** Called on app start / return to foreground. Does nothing unless notifications are on and the last check is stale. */
export async function backgroundCheck() {
      if (!notificationsEnabled() || Date.now() - lastCheck() < CHECK_INTERVAL) return;
      await loadLibrary();
      const radar = await buildRadar([...getSnapshot().items.values()]);
      notifyToday(radar);
}
