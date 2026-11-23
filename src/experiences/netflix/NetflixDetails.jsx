import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { useLenis } from "lenis/react";
import { motion } from "framer-motion";
import { Check, ChevronDown, Clapperboard, Play, Plus, ThumbsUp, X } from "lucide-react";
import Img from "../shared/Img";
import { progressOf, runtimeLabel, titleOf, useCertification, useMediaQuery, useMyList, useSeason, useTitle, useWatchHistory, yearOf } from "../shared/hooks";
import { useOpenTitle } from "./useOpenTitle";

function SeasonSelect({ seasons, value, onChange }) {
      if (!seasons.length) return null;
      return (
            <select className="nfx-seasonselect" value={value} onChange={(event) => onChange(Number(event.target.value))} aria-label="Season">
                  {seasons.map((season) => (
                        <option key={season.season_number} value={season.season_number}>
                              {season.season_number === 0 ? "Specials" : `Season ${season.season_number}`} ({season.episode_count} Episodes)
                        </option>
                  ))}
            </select>
      );
}

function Episodes({ detail, current }) {
      const seasons = (detail.seasons || []).filter((season) => season.episode_count > 0);
      const defaultSeason = current?.season || seasons.find((season) => season.season_number > 0)?.season_number || seasons[0]?.season_number;
      const [season, setSeason] = useState(defaultSeason);
      const { episodes, status, error, retry } = useSeason(detail.id, season);
      const openTitle = useOpenTitle();

      return (
            <section className="nfx-episodes">
                  <div className="nfx-episodes__head">
                        <h3>Episodes</h3>
                        {seasons.length > 1 ? <SeasonSelect seasons={seasons} value={season} onChange={setSeason} /> : <span className="nfx-episodes__single">{seasons[0]?.name}</span>}
                  </div>
                  {status === "loading" && Array.from({ length: 3 }).map((_, index) => <div key={index} className="nfx-episode nfx-episode--skeleton xp-skeleton" />)}
                  {status === "error" && (
                        <div className="nfx-row__error"><span>{error}</span><button type="button" onClick={retry}>Try Again</button></div>
                  )}
                  {episodes.map((episode) => {
                        const isCurrent = current?.season === season && current?.episode === episode.episode_number;
                        return (
                              <button
                                    type="button"
                                    key={episode.id}
                                    className={`nfx-episode ${isCurrent || (!current && episode.episode_number === 1) ? "is-current" : ""}`}
                                    onClick={() => openTitle({ ...detail, media_type: "tv" }, { play: true, season, episode: episode.episode_number })}
                              >
                                    <span className="nfx-episode__index">{episode.episode_number}</span>
                                    <span className="nfx-episode__still">
                                          <Img path={episode.still_path || detail.backdrop_path} size="w300" alt="" fallbackTitle={episode.name} />
                                          <span className="nfx-episode__play"><Play size={20} fill="currentColor" /></span>
                                          {isCurrent && <span className="nfx-progress"><span style={{ width: `${progressOf(current) * 100}%` }} /></span>}
                                    </span>
                                    <span className="nfx-episode__body">
                                          <span className="nfx-episode__title">
                                                <strong>{episode.name}</strong>
                                                {episode.runtime ? <span>{episode.runtime}m</span> : null}
                                          </span>
                                          <span className="nfx-episode__overview">{episode.overview || "Episode synopsis not available."}</span>
                                    </span>
                              </button>
                        );
                  })}
            </section>
      );
}

function MoreLikeThis({ items, status }) {
      const [expanded, setExpanded] = useState(false);
      const openTitle = useOpenTitle();
      const { has, toggle } = useMyList("netflix");
      const shown = expanded ? items : items.slice(0, 9);
      if (status === "ready" && !items.length) return null;
      return (
            <section className="nfx-morelike">
                  <h3>More Like This</h3>
                  <div className="nfx-morelike__grid">
                        {shown.map((item) => (
                              <article key={`${item.media_type}-${item.id}`} className="nfx-simcard">
                                    <button type="button" className="nfx-simcard__art" onClick={() => openTitle(item)} aria-label={titleOf(item)}>
                                          <Img path={item.backdrop_path || item.poster_path} size="w500" alt="" fallbackTitle={titleOf(item)} />
                                          <span className="nfx-card__boxtitle">{titleOf(item)}</span>
                                          <span className="nfx-simcard__play"><Play size={22} fill="currentColor" /></span>
                                    </button>
                                    <div className="nfx-simcard__body">
                                          <div className="nfx-simcard__meta">
                                                <span>
                                                      <span className="nfx-boxed">{item.media_type === "tv" ? "TV" : "Film"}</span>
                                                      <span className="nfx-simcard__year">{yearOf(item)}</span>
                                                </span>
                                                <button type="button" className="nfx-circle" aria-label="Add to My List" onClick={() => toggle(item)}>
                                                      {has(item) ? <Check size={18} /> : <Plus size={18} />}
                                                </button>
                                          </div>
                                          <p>{item.overview}</p>
                                    </div>
                              </article>
                        ))}
                        {status === "loading" && Array.from({ length: 6 }).map((_, index) => <div key={index} className="nfx-simcard nfx-simcard--skeleton xp-skeleton" />)}
                  </div>
                  {items.length > 9 && (
                        <div className="nfx-morelike__expand">
                              <button type="button" className="nfx-circle" onClick={() => setExpanded((value) => !value)} aria-label={expanded ? "Show less" : "Show more"}>
                                    <ChevronDown size={22} style={{ transform: expanded ? "rotate(180deg)" : undefined }} />
                              </button>
                        </div>
                  )}
            </section>
      );
}

export default function NetflixDetails({ mediaType, asModal }) {
      const { id } = useParams();
      const navigate = useNavigate();
      const location = useLocation();
      const lenis = useLenis();
      const isMobile = useMediaQuery("(max-width: 740px)");
      const { status, data, error, retry } = useTitle("netflix", mediaType, id);
      const cert = useCertification(mediaType, id);
      const openTitle = useOpenTitle();
      const { has, toggle } = useMyList("netflix");
      const history = useWatchHistory();
      const [liked, setLiked] = useState(false);
      const immersive = /\/(watch|trailer)/.test(location.pathname);
      const current = useMemo(() => history.find((entry) => entry.media_type === mediaType && String(entry.id) === String(id)), [history, mediaType, id]);

      const close = () => {
            const background = location.state?.backgroundLocation;
            if (background && window.history.state?.idx > 0) navigate(-1);
            else if (background) navigate(background.pathname + (background.search || ""), { replace: true });
            else navigate("/");
      };

      useEffect(() => {
            if (immersive) return undefined;
            lenis?.stop();
            const previous = document.documentElement.style.overflow;
            document.documentElement.style.overflow = "hidden";
            const onKey = (event) => event.key === "Escape" && close();
            window.addEventListener("keydown", onKey);
            return () => {
                  lenis?.start();
                  document.documentElement.style.overflow = previous;
                  window.removeEventListener("keydown", onKey);
            };
            // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [lenis, immersive]);

      useEffect(() => {
            if (data?.detail) document.title = `${titleOf(data.detail)} - Notflix`;
      }, [data?.detail]);

      const detail = data?.detail;
      const title = titleOf(detail);
      const directors = data?.director?.map((person) => person.name) || [];
      const writers = (data?.crew || []).filter((person) => ["Screenplay", "Writer", "Novel"].includes(person.job)).slice(0, 3).map((person) => person.name);
      const length = mediaType === "tv"
            ? detail?.number_of_seasons ? `${detail.number_of_seasons} Season${detail.number_of_seasons > 1 ? "s" : ""}` : ""
            : runtimeLabel(detail?.runtime);

      return (
            <>
                  <div className={`nfx-modal-layer ${asModal ? "" : "is-standalone"}`} data-lenis-prevent onClick={(event) => event.target === event.currentTarget && close()}>
                        <motion.div
                              className="nfx-modal"
                              role="dialog"
                              aria-modal="true"
                              aria-label={title}
                              initial={isMobile ? { y: 40, opacity: 0 } : { scale: 0.92, opacity: 0 }}
                              animate={{ scale: 1, y: 0, opacity: 1 }}
                              transition={{ duration: 0.32, ease: [0.2, 0.7, 0.3, 1] }}
                        >
                              <button type="button" className="nfx-modal__close" aria-label="Close" onClick={close}><X size={24} /></button>

                              {status === "loading" && (
                                    <div className="nfx-modal__hero xp-skeleton" />
                              )}
                              {status === "error" && (
                                    <div className="nfx-modal__error">
                                          <h2>Something went wrong</h2>
                                          <p>{error}</p>
                                          <button type="button" className="nfx-btn nfx-btn--play" onClick={retry}>Try Again</button>
                                    </div>
                              )}

                              {detail && (
                                    <>
                                          <div className="nfx-modal__hero">
                                                <Img path={detail.backdrop_path || detail.poster_path} size="w1280" alt="" eager fallbackTitle="" />
                                                <div className="nfx-modal__heroshade" />
                                                <div className="nfx-modal__herocontent">
                                                      {data.logo ? <Img path={data.logo} size="w500" alt={title} className="nfx-modal__logo" eager /> : <h2 className="nfx-modal__title">{title}</h2>}
                                                      <div className="nfx-modal__actions">
                                                            <button
                                                                  type="button"
                                                                  className="nfx-btn nfx-btn--play"
                                                                  onClick={() => openTitle(detail, { play: true, season: current?.season, episode: current?.episode })}
                                                            >
                                                                  <Play size={24} fill="currentColor" /> {current && mediaType === "tv" ? "Resume" : "Play"}
                                                            </button>
                                                            <button type="button" className="nfx-circle nfx-circle--lg" aria-label={has(detail) ? "Remove from My List" : "Add to My List"} onClick={() => toggle(detail)}>
                                                                  {has(detail) ? <Check size={22} /> : <Plus size={22} />}
                                                            </button>
                                                            <button type="button" className={`nfx-circle nfx-circle--lg ${liked ? "is-on" : ""}`} aria-label="I like this" onClick={() => setLiked((value) => !value)}>
                                                                  <ThumbsUp size={20} fill={liked ? "currentColor" : "none"} />
                                                            </button>
                                                            {data.trailer && (
                                                                  <button
                                                                        type="button"
                                                                        className="nfx-circle nfx-circle--lg nfx-modal__trailer"
                                                                        aria-label="Watch trailer"
                                                                        onClick={() => navigate(`/${mediaType}/details/${id}/trailer`, { state: location.state })}
                                                                  >
                                                                        <Clapperboard size={20} />
                                                                  </button>
                                                            )}
                                                      </div>
                                                </div>
                                          </div>

                                          <div className="nfx-modal__body">
                                                <div className="nfx-modal__columns">
                                                      <div className="nfx-modal__left">
                                                            <div className="nfx-modal__meta">
                                                                  {current ? <span className="nfx-new">Continue watching</span> : detail.vote_average >= 7.5 && <span className="nfx-new">Top Rated</span>}
                                                                  <span>{yearOf(detail)}</span>
                                                                  {length && <span>{length}</span>}
                                                                  <span className="nfx-boxed nfx-boxed--hd">HD</span>
                                                            </div>
                                                            <div className="nfx-modal__meta2">
                                                                  {cert && <span className="nfx-boxed">{cert}</span>}
                                                                  {(detail.genres || []).slice(0, 2).map((genre) => genre.name.toLowerCase()).join(", ")}
                                                            </div>
                                                            {current && mediaType === "tv" && current.season && (
                                                                  <p className="nfx-modal__resume">S{current.season}:E{current.episode}</p>
                                                            )}
                                                            {detail.tagline && <p className="nfx-modal__tagline">{detail.tagline}</p>}
                                                            <p className="nfx-modal__overview">{detail.overview}</p>
                                                      </div>
                                                      <div className="nfx-modal__right">
                                                            {data.cast.length > 0 && (
                                                                  <p><span>Cast:</span> {data.cast.slice(0, 3).map((person) => person.name).join(", ")}, <a href="#nfx-about">more</a></p>
                                                            )}
                                                            {detail.genres?.length > 0 && <p><span>Genres:</span> {detail.genres.map((genre) => genre.name).join(", ")}</p>}
                                                            {detail.production_companies?.length > 0 && <p><span>Studio:</span> {detail.production_companies.slice(0, 2).map((company) => company.name).join(", ")}</p>}
                                                      </div>
                                                </div>

                                                {mediaType === "tv" && <Episodes detail={detail} current={current} />}

                                                <MoreLikeThis items={data.related} status={data.relatedStatus} />

                                                <section className="nfx-about" id="nfx-about">
                                                      <h3>About <strong>{title}</strong></h3>
                                                      {directors.length > 0 && <p><span>Director:</span> {directors.join(", ")}</p>}
                                                      {data.creators.length > 0 && <p><span>Creators:</span> {data.creators.map((person) => person.name).join(", ")}</p>}
                                                      {data.cast.length > 0 && <p><span>Cast:</span> {data.cast.slice(0, 12).map((person) => person.name).join(", ")}</p>}
                                                      {writers.length > 0 && <p><span>Writer:</span> {writers.join(", ")}</p>}
                                                      {detail.genres?.length > 0 && <p><span>Genres:</span> {detail.genres.map((genre) => genre.name).join(", ")}</p>}
                                                      {detail.spoken_languages?.length > 0 && <p><span>Audio:</span> {detail.spoken_languages.map((language) => language.english_name).join(", ")}</p>}
                                                      {cert && <p><span>Maturity rating:</span> <span className="nfx-boxed">{cert}</span></p>}
                                                </section>
                                          </div>
                                    </>
                              )}
                        </motion.div>
                  </div>
                  <Outlet />
            </>
      );
}
