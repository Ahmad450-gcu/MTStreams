import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { typeOf } from "./hooks";

/**
 * Low-level navigation helpers shared by experiences. Watch/trailer routes are
 * the original MTStreams routes, so the existing player keeps working.
 */
export function useTitleNav() {
      const navigate = useNavigate();
      const open = useCallback((item) => navigate(`/${typeOf(item)}/details/${item.id}`), [navigate]);
      const play = useCallback((item, season = 1, episode = 1) => {
            if (typeOf(item) === "tv") navigate(`/tv/details/${item.id}/watch/${season || 1}/${episode || 1}`);
            else navigate(`/movie/details/${item.id}/watch`);
      }, [navigate]);
      const trailer = useCallback((item) => navigate(`/${typeOf(item)}/details/${item.id}/trailer`), [navigate]);
      return { open, play, trailer, navigate };
}

/** True once the window has scrolled past `offset` pixels. */
export function useScrolled(offset = 10) {
      const [scrolled, setScrolled] = useState(false);
      useEffect(() => {
            const onScroll = () => setScrolled(window.scrollY > offset);
            onScroll();
            window.addEventListener("scroll", onScroll, { passive: true });
            return () => window.removeEventListener("scroll", onScroll);
      }, [offset]);
      return scrolled;
}

/** Auto-advancing index for hero carousels (pauses when `paused`). */
export function useCarousel(length, interval = 8000, paused = false) {
      const [index, setIndex] = useState(0);
      useEffect(() => {
            if (index >= length && length) setIndex(0);
      }, [index, length]);
      useEffect(() => {
            if (paused || length < 2) return undefined;
            const timer = setTimeout(() => setIndex((current) => (current + 1) % length), interval);
            return () => clearTimeout(timer);
      }, [index, length, interval, paused]);
      const go = useCallback((next) => setIndex(((next % length) + length) % length), [length]);
      return [Math.min(index, Math.max(0, length - 1)), go];
}

/** Scroll a horizontal rail by one viewport width; returns edge state. */
export function useRail() {
      const [node, setNode] = useState(null);
      const [edges, setEdges] = useState({ start: true, end: false });
      useEffect(() => {
            if (!node) return undefined;
            const update = () => {
                  const start = node.scrollLeft <= 4;
                  const end = node.scrollLeft + node.clientWidth >= node.scrollWidth - 4;
                  // Only re-render the row when an edge actually changes.
                  setEdges((current) => (current.start === start && current.end === end ? current : { start, end }));
            };
            update();
            node.addEventListener("scroll", update, { passive: true });
            const observer = new ResizeObserver(update);
            observer.observe(node);

            // Some rails are click-through (pointer-events: none) so hover panels
            // can overlap the next row. A sideways swipe that starts in a gap
            // between cards then lands on the parent instead of the rail, so
            // pass it on to the rail here.
            const host = window.getComputedStyle(node).pointerEvents === "none" ? node.parentElement : null;
            const onWheel = (event) => {
                  if (event.ctrlKey || node.contains(event.target) || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
                  const max = node.scrollWidth - node.clientWidth;
                  if (max <= 0 || (event.deltaX < 0 && node.scrollLeft <= 0) || (event.deltaX > 0 && node.scrollLeft >= max - 1)) return;
                  node.scrollLeft += event.deltaX;
                  event.preventDefault();
                  event.lenisStopPropagation = true;
            };
            host?.addEventListener("wheel", onWheel, { passive: false });
            return () => {
                  node.removeEventListener("scroll", update);
                  observer.disconnect();
                  host?.removeEventListener("wheel", onWheel);
            };
      }, [node]);
      const scroll = useCallback((direction) => {
            if (!node) return;
            node.scrollBy({ left: direction * node.clientWidth * 0.9, behavior: "smooth" });
      }, [node]);
      return { ref: setNode, scroll, ...edges, node };
}

export function useLockScroll(active) {
      useEffect(() => {
            if (!active) return undefined;
            const previous = document.documentElement.style.overflow;
            document.documentElement.style.overflow = "hidden";
            return () => {
                  document.documentElement.style.overflow = previous;
            };
      }, [active]);
}

export const isImmersivePath = (pathname) => /\/(watch|trailer)(\/|$)/.test(pathname);
