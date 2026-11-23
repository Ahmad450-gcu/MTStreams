import { useEffect, useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import { Check, ChevronDown, Clapperboard, Play, Plus } from "lucide-react";
import Img from "../shared/Img";
import { runtimeLabel, titleOf, useCertification, useMyList, useSeason, useTitle, yearOf } from "../shared/hooks";
import { useTitleNav } from "../shared/navigation";
import { MgmRow } from "./MgmHome";

function SeasonPanel({ detail, season, open, onToggle }) {
      const { episodes, status, error, retry } = useSeason(open ? detail.id : null, season.season_number);
      const { play } = useTitleNav();
      return (
            <div className={`mg-season ${open ? "is-open" : ""}`}>
                  <button type="button" className="mg-season__head" onClick={onToggle} aria-expanded={open}>
                        <span>Season {season.season_number}</span>
                        <small>{season.episode_count} episodes{season.air_date ? ` · ${season.air_date.slice(0, 4)}` : ""}</small>
                        <ChevronDown size={20} />
                  </button>
                  {open && (
                        <ol className="mg-season__list">
                              {status === "loading" && <li className="mg-season__loading">Loading episodes…</li>}
                              {status === "error" && <li className="mg-error"><span>{error}</span><button type="button" onClick={retry}>TRY AGAIN</button></li>}
                              {episodes.map((episode) => (
                                    <li key={episode.id}>
                                          <button type="button" onClick={() => play(detail, season.season_number, episode.episode_number)}>
                                                <span className="mg-ep__num">{String(episode.episode_number).padStart(2, "0")}</span>
                                                <span className="mg-ep__still"><Img path={episode.still_path || detail.backdrop_path} size="w300" alt="" fallbackTitle="" /><Play size={16} fill="currentColor" /></span>
                                                <span className="mg-ep__body">
                                                      <strong>{episode.name}</strong>
                                                      <small>{episode.overview}</small>
                                                </span>
                                                <span className="mg-ep__time">{episode.runtime ? `${episode.runtime} min` : ""}</span>
                                          </button>
                                    </li>
                              ))}
                        </ol>
                  )}
            </div>
      );
}

export default function MgmDetails({ mediaType }) {
      const { id } = useParams();
      const { status, data, error, retry } = useTitle("mgm", mediaType, id);
      const cert = useCertification(mediaType, id);
      const { play, trailer } = useTitleNav();
      const { has, toggle } = useMyList("mgm");
      const [openSeason, setOpenSeason] = useState(null);
      useEffect(() => {
            if (data?.detail) {
                  document.title = `${titleOf(data.detail)} | MGN+`;
                  const first = (data.detail.seasons || []).find((season) => season.season_number > 0);
                  setOpenSeason(first?.season_number ?? null);
            }
      }, [data?.detail]);

      if (status === "loading") return <div className="mg-detail"><div className="mg-detail__inner"><div className="mg-detail__poster xp-skeleton" /></div></div>;
      if (status === "error") return <div className="mg-page mg-page--pad"><div className="mg-error"><span>{error}</span><button type="button" onClick={retry}>TRY AGAIN</button></div></div>;

      const { detail } = data;
      const title = titleOf(detail);
      const seasons = (detail.seasons || []).filter((season) => season.episode_count > 0 && season.season_number > 0);
      return (
            <div className="mg-detail">
                  <div className="mg-detail__backdrop"><Img path={detail.backdrop_path} size="w1280" alt="" eager fallbackTitle="" /></div>
                  <div className="mg-detail__inner">
                        <div className="mg-detail__poster"><Img path={detail.poster_path} size="w500" alt={title} eager fallbackTitle={title} /></div>
                        <div className="mg-detail__info">
                              <span className="mg-kicker">{mediaType === "tv" ? "Series" : "Feature Film"}</span>
                              <h1 className="mg-detail__title">{title}</h1>
                              {detail.tagline && <p className="mg-detail__tagline">“{detail.tagline}”</p>}
                              <p className="mg-detail__meta">
                                    {[yearOf(detail), mediaType === "tv" ? `${detail.number_of_seasons} Season${detail.number_of_seasons > 1 ? "s" : ""}` : runtimeLabel(detail.runtime), (detail.genres || []).slice(0, 3).map((genre) => genre.name).join(", ")].filter(Boolean).join("  ·  ")}
                                    {cert && <span className="mg-cert">{cert}</span>}
                              </p>
                              {data.director.length > 0 && <p className="mg-detail__credit">Directed by <strong>{data.director.map((person) => person.name).join(" & ")}</strong></p>}
                              {data.creators.length > 0 && <p className="mg-detail__credit">Created by <strong>{data.creators.map((person) => person.name).join(" & ")}</strong></p>}
                              <p className="mg-detail__overview">{detail.overview}</p>
                              <div className="mg-hero__actions">
                                    <button type="button" className="mg-btn mg-btn--gold" onClick={() => play(detail)}><Play size={16} fill="currentColor" /> {mediaType === "tv" ? "WATCH S1 E1" : "WATCH NOW"}</button>
                                    {data.trailer && <button type="button" className="mg-btn mg-btn--line" onClick={() => trailer(detail)}><Clapperboard size={16} /> TRAILER</button>}
                                    <button type="button" className="mg-btn mg-btn--line" onClick={() => toggle(detail)}>{has(detail) ? <Check size={16} /> : <Plus size={16} />} MY LIST</button>
                              </div>
                              {data.cast.length > 0 && (
                                    <div className="mg-cast">
                                          <h3>Starring</h3>
                                          <ul>
                                                {data.cast.slice(0, 8).map((person) => (
                                                      <li key={person.credit_id || person.id}>
                                                            <span className="mg-cast__photo">{person.profile_path ? <img src={`https://image.tmdb.org/t/p/w185${person.profile_path}`} alt="" loading="lazy" /> : person.name[0]}</span>
                                                            <span><strong>{person.name}</strong><small>{person.character}</small></span>
                                                      </li>
                                                ))}
                                          </ul>
                                    </div>
                              )}
                        </div>
                  </div>

                  {mediaType === "tv" && seasons.length > 0 && (
                        <section className="mg-seasons">
                              <h2 className="mg-section-title">Episodes</h2>
                              {seasons.map((season) => (
                                    <SeasonPanel key={season.season_number} detail={detail} season={season} open={openSeason === season.season_number} onToggle={() => setOpenSeason(openSeason === season.season_number ? null : season.season_number)} />
                              ))}
                        </section>
                  )}

                  <div className="mg-detail__more">
                        <MgmRow title="You May Also Like" items={data.related} loading={data.relatedStatus === "loading"} />
                  </div>
                  <Outlet />
            </div>
      );
}
