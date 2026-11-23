import { useEffect, useRef, useState } from "react";
import { MdClose } from "react-icons/md";
import { CalendarDays, Clock3, Play, Star } from "lucide-react";
import MediaActions from "../../ui/MediaActions";
import api from "../../../utils/axios";

const TVSeasonModal = ({ season, seasons = [], onSeasonChange, onClick, mediaId, title }) => {
      const [currentEpisode, setCurrentEpisode] = useState(1);
      const [episodes, setEpisodes] = useState([]);
      const [episodesLoading, setEpisodesLoading] = useState(true);
      const [episodesUnavailable, setEpisodesUnavailable] = useState(false);
      const dialogRef = useRef(null);
      const totalEpisodes = episodes.length || season?.episode_count || 0;
      const selectedEpisode = episodes.find((episode) => episode.episode_number === currentEpisode);

      useEffect(() => {
            let isActive = true;
            setCurrentEpisode(1);
            setEpisodes([]);
            setEpisodesUnavailable(false);
            setEpisodesLoading(true);

            if (!mediaId || season?.season_number === undefined) {
                  setEpisodesLoading(false);
                  setEpisodesUnavailable(true);
                  return () => { isActive = false; };
            }

            api.get(`/tv/${mediaId}/season/${season.season_number}`)
                  .then(({ data }) => {
                        if (isActive) setEpisodes(Array.isArray(data?.episodes) ? data.episodes : []);
                  })
                  .catch(() => {
                        if (isActive) setEpisodesUnavailable(true);
                  })
                  .finally(() => {
                        if (isActive) setEpisodesLoading(false);
                  });

            return () => { isActive = false; };
      }, [mediaId, season?.season_number]);

      useEffect(() => {
            const dialog = dialogRef.current;
            const previouslyFocused = document.activeElement;
            dialog?.focus({ preventScroll: true });

            const handleKeyDown = (event) => {
                  if (event.defaultPrevented || !dialog?.contains(event.target)) return;
                  if (event.key === "Escape") {
                        event.preventDefault();
                        onClick?.();
                        return;
                  }
                  if (event.key !== "Tab" || !dialog) return;
                  const controls = Array.from(dialog.querySelectorAll("button:not(:disabled), a[href], select:not(:disabled), input:not(:disabled)"));
                  if (!controls.length) return;
                  const first = controls[0];
                  const last = controls[controls.length - 1];
                  if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
                        event.preventDefault();
                        last.focus();
                  } else if (!event.shiftKey && document.activeElement === last) {
                        event.preventDefault();
                        first.focus();
                  }
            };

            document.addEventListener("keydown", handleKeyDown);
            return () => {
                  document.removeEventListener("keydown", handleKeyDown);
                  if (previouslyFocused?.isConnected) previouslyFocused.focus({ preventScroll: true });
            };
      }, [onClick]);

      const poster = season?.poster_path
            ? `https://image.tmdb.org/t/p/w500${season.poster_path}`
            : "/noImage.jpg";

      return (
            <div
                  className="mt-season-overlay"
                  onMouseDown={(event) => {
                        if (event.target === event.currentTarget) onClick?.();
                  }}
            >
                  <section
                        ref={dialogRef}
                        tabIndex={-1}
                        role="dialog"
                        aria-modal="true"
                        aria-label={`${season?.name || "Season"} episode guide`}
                        className="mt-season-dialog"
                        data-lenis-prevent
                  >
                        <button type="button" aria-label="Close season guide" onClick={onClick} className="mt-season-dialog__close">
                              <MdClose size="1.45rem" />
                        </button>

                        <div className="mt-season-dialog__header">
                              <img
                                    src={poster}
                                    alt=""
                                    onError={(event) => { event.currentTarget.src = "/noImage.jpg"; }}
                              />
                              <div className="mt-season-dialog__intro">
                                    <span className="mt-season-dialog__eyebrow">MTSTREAMS EPISODE GUIDE</span>
                                    <h2>{season?.name || `Season ${season?.season_number}`}</h2>
                                    <div className="mt-season-dialog__facts">
                                          <span><Play size={14} /> {season?.episode_count || 0} episodes</span>
                                          {season?.air_date && <span><CalendarDays size={14} /> {season.air_date.split("-")[0]}</span>}
                                          {Number(season?.vote_average) > 0 && <span><Star size={14} fill="currentColor" /> {Number(season.vote_average).toFixed(1)}</span>}
                                    </div>
                                    {season?.overview && <p>{season.overview}</p>}
                                    {seasons.length > 1 && (
                                          <label className="season-modal__switcher">
                                                <span>Explore another season</span>
                                                <select
                                                      value={season?.season_number ?? ""}
                                                      onChange={(event) => onSeasonChange?.(event.target.value)}
                                                      aria-label="Switch TV season"
                                                >
                                                      {seasons.map((availableSeason) => (
                                                            <option key={availableSeason.id || availableSeason.season_number} value={availableSeason.season_number}>
                                                                  {availableSeason.season_number === 0 ? "Specials" : `Season ${availableSeason.season_number}`}
                                                            </option>
                                                      ))}
                                                </select>
                                          </label>
                                    )}
                              </div>
                        </div>

                        <div className="mt-season-dialog__episodes">
                              <div className="mt-season-dialog__section-heading">
                                    <div>
                                          <span className="mt-season-dialog__eyebrow">IN THIS SEASON</span>
                                          <h3>Episodes</h3>
                                    </div>
                                    <span className="mt-season-dialog__count">{totalEpisodes} total</span>
                              </div>

                              {episodesLoading ? (
                                    <div className="mt-episode-list" aria-label="Loading episode details">
                                          {[1, 2, 3].map((item) => <div className="mt-episode-skeleton" key={item} />)}
                                    </div>
                              ) : episodes.length > 0 ? (
                                    <div className="mt-episode-list">
                                          {episodes.map((episode) => {
                                                const isSelected = episode.episode_number === currentEpisode;
                                                return (
                                                      <button
                                                            type="button"
                                                            key={episode.id || episode.episode_number}
                                                            className={`mt-episode-card ${isSelected ? "is-selected" : ""}`}
                                                            onClick={() => setCurrentEpisode(episode.episode_number)}
                                                            aria-pressed={isSelected}
                                                      >
                                                            <span className="mt-episode-card__artwork">
                                                                  <img
                                                                        src={episode.still_path ? `https://image.tmdb.org/t/p/w300${episode.still_path}` : "/noImage.jpg"}
                                                                        alt=""
                                                                        loading="lazy"
                                                                        onError={(event) => { event.currentTarget.src = "/noImage.jpg"; }}
                                                                  />
                                                                  <span className="mt-episode-card__play"><Play size={17} fill="currentColor" /></span>
                                                            </span>
                                                            <span className="mt-episode-card__copy">
                                                                  <span className="mt-episode-card__topline">
                                                                        <span>EPISODE {String(episode.episode_number).padStart(2, "0")}</span>
                                                                        {episode.runtime > 0 && <span><Clock3 size={12} /> {episode.runtime} min</span>}
                                                                  </span>
                                                                  <strong>{episode.name || `Episode ${episode.episode_number}`}</strong>
                                                                  <span className="mt-episode-card__overview">{episode.overview || "Episode description unavailable."}</span>
                                                            </span>
                                                            <span className="mt-episode-card__selection">{isSelected ? "Selected" : "Select"}</span>
                                                      </button>
                                                );
                                          })}
                                    </div>
                              ) : (
                                    <div className="mt-episode-fallback">
                                          <p>{episodesUnavailable ? "Episode details could not be loaded. You can still choose an episode number." : "Choose an episode to continue."}</p>
                                          <div className="mt-episode-number-grid">
                                                {Array.from({ length: totalEpisodes }, (_, index) => index + 1).map((episodeNumber) => (
                                                      <button
                                                            type="button"
                                                            key={episodeNumber}
                                                            onClick={() => setCurrentEpisode(episodeNumber)}
                                                            className={currentEpisode === episodeNumber ? "is-selected" : ""}
                                                            aria-pressed={currentEpisode === episodeNumber}
                                                      >
                                                            {episodeNumber}
                                                      </button>
                                                ))}
                                          </div>
                                    </div>
                              )}
                        </div>

                        <footer className="mt-season-dialog__footer">
                              <div className="mt-season-dialog__selection-copy">
                                    <span>READY TO WATCH</span>
                                    <strong>{selectedEpisode?.name || `Episode ${currentEpisode}`}</strong>
                              </div>
                              <MediaActions
                                    mediaId={mediaId}
                                    mediaType="tv"
                                    title={title}
                                    watchTo={`watch/${season.season_number}/${currentEpisode}`}
                                    onWatch={onClick}
                                    showTrailer={false}
                                    season={season.season_number}
                                    episode={currentEpisode}
                              />
                        </footer>
                  </section>
            </div>
      );
};

export default TVSeasonModal;
