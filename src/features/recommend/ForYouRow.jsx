import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import Card from "../../Components/ui/Card";
import useLibrary from "../library/useLibrary";
import { recommend } from "./engine";
import "./recommend.css";

/**
 * "For You" row on the MTStreams home page. Recomputes when the library
 * changes; only seeds whose recommendation list isn't cached cause requests.
 */
export default function ForYouRow() {
      const library = useLibrary();
      const [result, setResult] = useState({ status: "idle", picks: [], needsSeeds: false });
      const railRef = useRef(null);
      const items = useMemo(() => [...library.items.values()], [library.items]);
      // Only the fields that affect recommendations trigger a recompute.
      const signature = useMemo(() => items.map((item) => `${item.key}:${item.status}:${item.rating ?? ""}`).sort().join("|"), [items]);

      useEffect(() => {
            if (!library.ready) return undefined;
            let alive = true;
            const timer = setTimeout(() => {
                  setResult((current) => ({ ...current, status: current.picks.length ? "refreshing" : "loading" }));
                  recommend(items)
                        .then((next) => alive && setResult({ status: "ready", ...next }))
                        .catch(() => alive && setResult({ status: "error", picks: [], needsSeeds: false }));
            }, 250);
            return () => {
                  alive = false;
                  clearTimeout(timer);
            };
            // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [library.ready, signature]);

      if (!library.ready || result.status === "error") return null;

      if (result.needsSeeds) {
            return (
                  <section className="home-row fy-row" aria-label="For You">
                        <div className="fy-empty">
                              <Sparkles size={20} aria-hidden="true" />
                              <div>
                                    <strong>Get picks made for you</strong>
                                    <span>Save or rate a few titles with Add to My List and personal recommendations will appear here. They’re worked out on this device.</span>
                              </div>
                              <Link to="/discover">Find something</Link>
                        </div>
                  </section>
            );
      }

      const scroll = (direction) => railRef.current?.scrollBy({ left: direction * railRef.current.clientWidth * 0.85, behavior: "smooth" });

      return (
            <section className="home-row fy-row" aria-label="For You">
                  <div className="row-heading fy-heading">
                        <h2>For You</h2>
                        <span className="row-heading__accent" aria-hidden="true" />
                        <span className="fy-sub">Based on your list · worked out on this device</span>
                        <span className="fy-arrows">
                              <button type="button" onClick={() => scroll(-1)} aria-label="Scroll recommendations left"><ChevronLeft size={18} /></button>
                              <button type="button" onClick={() => scroll(1)} aria-label="Scroll recommendations right"><ChevronRight size={18} /></button>
                        </span>
                  </div>
                  <div ref={railRef} className="fy-rail" data-lenis-prevent-wheel>
                        {result.status === "loading"
                              ? Array.from({ length: 6 }).map((_, index) => <span key={index} className="fy-skeleton" />)
                              : result.picks.map((pick) => (
                                    <div key={pick.key} className="fy-item">
                                          <Card eachMovie={pick} type={pick.media_type} />
                                          <p className="fy-reason" title={pick.reason}>{pick.reason}</p>
                                    </div>
                              ))}
                  </div>
            </section>
      );
}
