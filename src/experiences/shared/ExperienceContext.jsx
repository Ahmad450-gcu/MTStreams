import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { getService } from "./services";
import { tmdbGet } from "./engine/tmdb";
import { getTitleServices } from "./engine/providerMap";
import { recordWatch } from "./hooks";

const STORAGE_KEY = "mtstreams:experience";
const ExperienceContext = createContext({ experience: null, service: null, setExperience: () => {} });

const readStored = () => {
      try {
            const value = window.localStorage.getItem(STORAGE_KEY);
            return getService(value) ? value : null;
      } catch {
            return null;
      }
};

const loadedFonts = new Set();
function loadFonts(service) {
      if (!service?.fonts?.length) return;
      const families = service.fonts.filter((family) => !loadedFonts.has(family));
      if (!families.length) return;
      families.forEach((family) => loadedFonts.add(family));
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?${families.map((family) => `family=${family}`).join("&")}&display=swap`;
      document.head.appendChild(link);
}

/** Records real time spent on watch routes so "Continue Watching" rows use real data. */
function useWatchTracking() {
      const { pathname } = useLocation();
      const session = useRef(null);

      useEffect(() => {
            const match = pathname.match(/^\/(movie|tv)\/details\/(\d+)\/watch(?:\/(\d+)\/(\d+))?/);
            const finish = () => {
                  const current = session.current;
                  if (!current) return;
                  session.current = null;
                  const seconds = Math.round((Date.now() - current.started) / 1000);
                  if (current.item) recordWatch(current.item, { seconds, season: current.season, episode: current.episode });
            };

            if (!match) {
                  finish();
                  return undefined;
            }

            const [, mediaType, id, season, episode] = match;
            const key = `${mediaType}:${id}:${season || ""}:${episode || ""}`;
            if (session.current?.key === key) return undefined;
            finish();

            const entry = { key, started: Date.now(), item: null, season: season ? Number(season) : undefined, episode: episode ? Number(episode) : undefined };
            session.current = entry;
            tmdbGet(`${mediaType}/${id}`)
                  .then((detail) => {
                        entry.item = { ...detail, media_type: mediaType };
                        recordWatch(entry.item, { seconds: 0, season: entry.season, episode: entry.episode });
                  })
                  .catch(() => {});
            getTitleServices(mediaType, id).catch(() => {});

            const onHide = () => finish();
            window.addEventListener("pagehide", onHide);
            return () => window.removeEventListener("pagehide", onHide);
      }, [pathname]);
}

export function ExperienceProvider({ children }) {
      const [experience, setExperienceState] = useState(readStored);
      const service = getService(experience);

      useWatchTracking();

      const setExperience = useCallback((key) => {
            const next = getService(key) ? key : null;
            setExperienceState(next);
            try {
                  if (next) window.localStorage.setItem(STORAGE_KEY, next);
                  else window.localStorage.removeItem(STORAGE_KEY);
            } catch {
                  // Selection still applies for this session.
            }
      }, []);

      // Keep the selection in sync across tabs.
      useEffect(() => {
            const onStorage = (event) => {
                  if (event.key === STORAGE_KEY) setExperienceState(getService(event.newValue) ? event.newValue : null);
            };
            window.addEventListener("storage", onStorage);
            return () => window.removeEventListener("storage", onStorage);
      }, []);

      // Page background / theme colour follow the active experience so the
      // overscroll area never flashes the MTStreams colour.
      useEffect(() => {
            const root = document.documentElement;
            const meta = document.querySelector('meta[name="theme-color"]');
            if (service) {
                  loadFonts(service);
                  root.dataset.experience = service.key;
                  root.style.setProperty("--experience-bg", service.background);
                  meta?.setAttribute("content", service.background);
            } else {
                  delete root.dataset.experience;
                  root.style.removeProperty("--experience-bg");
                  meta?.setAttribute("content", "#090e13");
            }
      }, [service]);

      const value = useMemo(() => ({ experience, service, setExperience }), [experience, service, setExperience]);
      return <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>;
}

export const useExperience = () => useContext(ExperienceContext);
