import ReactPlayer from "react-player";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { NotFound } from "../ui/index";
import useFullScreen from "../../hooks/useFullScreen";
import { MdClose } from "react-icons/md";
import { getContentProperties, getRouteContext } from "../../analytics/events.js";
import { captureEvent } from "../../analytics/posthog.js";
import { tmdbGet } from "../../experiences/shared/engine/tmdb.js";

const pickTrailer = (results = []) =>
      results.find((video) => video.site === "YouTube" && video.type === "Trailer")
      || results.find((video) => video.site === "YouTube");

const Trailer = () => {
      useFullScreen();
      const navigate = useNavigate();
      const { pathname } = useLocation();
      const isMovie = pathname.includes("movie") ? "movie" : "tv";
      const { id } = useParams();
      const info = useSelector((state) => state[isMovie].info);
      // The store is only filled by the original MTStreams detail pages. OTT
      // experience detail pages (or a stale store from another title) need the
      // trailer for the title in the URL, fetched directly.
      const storeMatches = String(info?.detail?.id) === String(id);
      const [fetched, setFetched] = useState({ id: null, video: null, done: false });
      useEffect(() => {
            if (storeMatches || !id) return undefined;
            let alive = true;
            setFetched({ id, video: null, done: false });
            tmdbGet(`${isMovie}/${id}/videos`, {}, { priority: true })
                  .then((data) => alive && setFetched({ id, video: pickTrailer(data?.results) || null, done: true }))
                  .catch(() => alive && setFetched({ id, video: null, done: true }));
            return () => { alive = false; };
      }, [storeMatches, id, isMovie]);
      const video = storeMatches ? info?.videoLink : fetched.id === id ? fetched.video : null;
      const loading = !storeMatches && !(fetched.id === id && fetched.done);
      const playback = useRef({ key: null, events: new Set() });

      const trackPlayback = (event, extra = {}) => {
            const properties = getContentProperties(getRouteContext(pathname), info);
            if (!video || !properties) return;
            const key = `${pathname}:${video.key}`;
            if (playback.current.key !== key) playback.current = { key, events: new Set() };
            const eventKey = `${event}:${extra.progress_percent || ""}`;
            if (playback.current.events.has(eventKey)) return;
            playback.current.events.add(eventKey);
            captureEvent(event, { ...properties, trailer_id: video.key, player_provider: "youtube", ...extra });
      };
      return (
            <section
                  style={{
                        backgroundImage: "radial-gradient(transparent 1px, #14120b 1px)",
                        backgroundSize: "3px 3px",
                        backdropFilter: "brightness(1) blur(10px)",
                        willChange: "filter, opacity, transform",
                  }}
                  className="w-full fixed no-scroll inset-0 z-50  h-[92dvh] md:h-screen  flex justify-center items-center"
            >
                  <span onClick={() => navigate(-1)} className="fixed cursor-pointer z-10 bg-white/30 backdrop-blur md:scale-110 rounded-full p-2 top-3 right-3">
                        <div>
                              <MdClose size="1.5rem" color="black" />
                        </div>
                  </span>
                  {video ? (
                        <div className="w-[95%] h-[95%]  overflow-hidden rounded-xl">
                              <ReactPlayer
                                    controls={true}
                                    url={`https://www.youtube.com/watch?v=${video.key}`}
                                    height="100%"
                                    width="100%"
                                    onStart={() => trackPlayback("trailer_started")}
                                    onProgress={({ played }) => {
                                          [25, 50, 75].forEach((percent) => {
                                                if (played * 100 >= percent) trackPlayback("trailer_progress", { progress_percent: percent });
                                          });
                                    }}
                                    onEnded={() => trackPlayback("trailer_completed")}
                                    onError={() => trackPlayback("trailer_error")}
                              />
                        </div>
                  ) : loading ? (
                        <span className="w-10 h-10 rounded-full border-[3px] border-white/20 border-t-white animate-spin" aria-label="Loading trailer" />
                  ) : (
                        <NotFound />
                  )}
            </section>
      );
};

export default Trailer;
