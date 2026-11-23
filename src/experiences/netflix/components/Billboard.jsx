import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Check, Info, Play, Plus, RotateCcw, Volume2, VolumeX } from "lucide-react";
import Img from "../../shared/Img";
import { titleOf, useCertification, useLogo, useMediaQuery, useMyList, useTmdb } from "../../shared/hooks";
import { useOpenTitle } from "../useOpenTitle";
import { genreNames } from "../../shared/services";

/**
 * Netflix-style billboard: 16:9 cinematic backdrop, left vignette, title
 * treatment (TMDB logo artwork when available), synopsis, Play / More Info,
 * maturity tag on the right edge and a muted trailer preview on desktop.
 */
export default function Billboard({ items, loading }) {
      const isMobile = useMediaQuery("(max-width: 740px)");
      const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
      const featured = useMemo(() => (items || []).find((item) => item.backdrop_path && item.overview) || items?.[0], [items]);
      const openTitle = useOpenTitle();
      const { has, toggle } = useMyList("netflix");
      const logo = useLogo(featured?.media_type, featured?.id, Boolean(featured));
      const cert = useCertification(featured?.media_type, featured?.id, Boolean(featured));
      const videos = useTmdb(featured ? `${featured.media_type}/${featured.id}/videos` : null, {}, Boolean(featured) && !isMobile && !reduceMotion);
      const trailer = (videos.data?.results || []).find((video) => video.site === "YouTube" && video.type === "Trailer");
      const [playing, setPlaying] = useState(false);
      const [ended, setEnded] = useState(false);
      const [muted, setMuted] = useState(true);
      const [replayKey, setReplayKey] = useState(0);
      const frame = useRef(null);
      const [condensed, setCondensed] = useState(false);
      // Pause the preview while a title modal, trailer or the player is open.
      const suspended = /\/details\//.test(useLocation().pathname);

      useEffect(() => {
            setPlaying(false);
            setEnded(false);
            if (!trailer) return undefined;
            const start = setTimeout(() => setPlaying(true), 2600);
            // After ~10s the synopsis fades away, exactly like the billboard does.
            const condense = setTimeout(() => setCondensed(true), 11000);
            const stop = setTimeout(() => {
                  setPlaying(false);
                  setEnded(true);
                  setCondensed(false);
            }, 75000);
            return () => {
                  clearTimeout(start);
                  clearTimeout(condense);
                  clearTimeout(stop);
            };
      }, [trailer, replayKey]);

      // Pause the preview when the billboard scrolls away.
      useEffect(() => {
            const onScroll = () => {
                  if (window.scrollY > window.innerHeight * 0.7 && playing) {
                        setPlaying(false);
                        setEnded(true);
                        setCondensed(false);
                  }
            };
            window.addEventListener("scroll", onScroll, { passive: true });
            return () => window.removeEventListener("scroll", onScroll);
      }, [playing]);

      const toggleMute = () => {
            const next = !muted;
            setMuted(next);
            frame.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: next ? "mute" : "unMute", args: [] }), "*");
      };

      if (!featured) {
            return (
                  <section className={`nfx-billboard ${loading ? "is-loading" : ""}`} aria-label="Featured">
                        <div className="nfx-billboard__media xp-skeleton" />
                  </section>
            );
      }

      const title = titleOf(featured);
      const inList = has(featured);

      if (isMobile) {
            return (
                  <section className="nfx-mhero" aria-label={`Featured: ${title}`}>
                        <div className="nfx-mhero__glow" style={{ backgroundImage: `url(https://image.tmdb.org/t/p/w300${featured.poster_path})` }} />
                        <div className="nfx-mhero__card" onClick={() => openTitle(featured)} role="button" tabIndex={0} aria-label={`More info on ${title}`}>
                              <Img path={featured.poster_path || featured.backdrop_path} size="w780" alt={title} eager fallbackTitle={title} />
                              <div className="nfx-mhero__shade" />
                              <div className="nfx-mhero__info">
                                    {/* Posters already carry the title artwork, like the reference app. */}
                                    {!featured.poster_path && (logo ? <Img path={logo} size="w500" alt={title} className="nfx-mhero__logo" eager /> : <h2>{title}</h2>)}
                                    <p className="nfx-mhero__tags">{genreNames(featured, 3).join(" • ")}</p>
                                    <div className="nfx-mhero__actions">
                                          <button type="button" className="nfx-btn nfx-btn--play" onClick={(event) => { event.stopPropagation(); openTitle(featured, { play: true }); }}>
                                                <Play size={22} fill="currentColor" /> Play
                                          </button>
                                          <button type="button" className="nfx-btn nfx-btn--list" onClick={(event) => { event.stopPropagation(); toggle(featured); }}>
                                                {inList ? <Check size={22} /> : <Plus size={22} />} My List
                                          </button>
                                    </div>
                              </div>
                        </div>
                  </section>
            );
      }

      return (
            <section className="nfx-billboard" aria-label={`Featured: ${title}`}>
                  <div className="nfx-billboard__media">
                        <Img path={featured.backdrop_path} size="w1280" alt="" eager className={`nfx-billboard__image ${playing && !suspended ? "is-hidden" : ""}`} fallbackTitle="" />
                        {trailer && playing && !suspended && (
                              <div className="nfx-billboard__video" key={replayKey}>
                                    <iframe
                                          ref={frame}
                                          title={`${title} preview`}
                                          src={`https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1&mute=1&controls=0&disablekb=1&modestbranding=1&playsinline=1&rel=0&iv_load_policy=3&enablejsapi=1&cc_load_policy=0&start=4`}
                                          allow="autoplay; encrypted-media"
                                          tabIndex={-1}
                                    />
                              </div>
                        )}
                        <div className="nfx-billboard__vignette" />
                        <div className="nfx-billboard__fade" />
                  </div>

                  <div className={`nfx-billboard__info ${condensed ? "is-condensed" : ""}`}>
                        <div className="nfx-billboard__title">
                              {logo ? <Img path={logo} size="w500" alt={title} eager className="nfx-billboard__logo" /> : <h1>{title}</h1>}
                        </div>
                        <p className="nfx-billboard__synopsis">{featured.overview}</p>
                        <div className="nfx-billboard__actions">
                              <button type="button" className="nfx-btn nfx-btn--play" onClick={() => openTitle(featured, { play: true })}>
                                    <Play size={26} fill="currentColor" /> Play
                              </button>
                              <button type="button" className="nfx-btn nfx-btn--info" onClick={() => openTitle(featured)}>
                                    <Info size={26} /> More Info
                              </button>
                        </div>
                  </div>

                  <div className="nfx-billboard__side">
                        {trailer && (playing || ended) && (
                              <button
                                    type="button"
                                    className="nfx-round-btn"
                                    aria-label={ended ? "Replay preview" : muted ? "Turn sound on" : "Mute"}
                                    onClick={() => {
                                          if (ended) {
                                                setEnded(false);
                                                setReplayKey((key) => key + 1);
                                                setPlaying(true);
                                          } else toggleMute();
                                    }}
                              >
                                    {ended ? <RotateCcw size={18} /> : muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                              </button>
                        )}
                        {cert && <span className="nfx-maturity">{cert}</span>}
                  </div>
            </section>
      );
}
