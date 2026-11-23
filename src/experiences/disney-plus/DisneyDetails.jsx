import { useEffect, useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import { Check, Play, Plus } from "lucide-react";
import Img from "../shared/Img";
import { runtimeLabel, titleOf, useCertification, useMyList, useSeason, useTitle, yearOf } from "../shared/hooks";
import { useTitleNav } from "../shared/navigation";
import { DisneyTile } from "./DisneyHome";

function Episodes({ detail }) {
      const seasons = (detail.seasons || []).filter((season) => season.episode_count > 0 && season.season_number > 0);
      const [season, setSeason] = useState(seasons[0]?.season_number ?? 1);
      const { episodes, status, error, retry } = useSeason(detail.id, season);
      const { play } = useTitleNav();
      return (
            <>
                  {seasons.length > 1 && (
                        <div className="dp-seasons">
                              {seasons.map((entry) => (
                                    <button key={entry.season_number} type="button" className={entry.season_number === season ? "is-active" : ""} onClick={() => setSeason(entry.season_number)}>Season {entry.season_number}</button>
                              ))}
                        </div>
                  )}
                  {status === "error" && <div className="dp-error"><span>{error}</span><button type="button" onClick={retry}>RETRY</button></div>}
                  <div className="dp-episodes">
                        {status === "loading" && Array.from({ length: 4 }).map((_, index) => <span key={index} className="dp-tile dp-tile--skel xp-skeleton" />)}
                        {episodes.map((episode) => (
                              <article key={episode.id} className="dp-ep">
                                    <button type="button" className="dp-tile dp-ep__art" onClick={() => play(detail, season, episode.episode_number)} aria-label={`Play episode ${episode.episode_number}`}>
                                          <Img path={episode.still_path || detail.backdrop_path} size="w500" alt="" fallbackTitle={episode.name} />
                                          <span className="dp-ep__play"><Play size={20} fill="currentColor" /></span>
                                    </button>
                                    <h4>{episode.episode_number}. {episode.name}</h4>
                                    <p className="dp-ep__meta">{episode.runtime ? `${episode.runtime}m` : ""}</p>
                                    <p className="dp-ep__overview">{episode.overview}</p>
                              </article>
                        ))}
                  </div>
            </>
      );
}

export default function DisneyDetails({ mediaType }) {
      const { id } = useParams();
      const { status, data, error, retry } = useTitle("disney", mediaType, id);
      const cert = useCertification(mediaType, id);
      const { play, trailer } = useTitleNav();
      const { has, toggle } = useMyList("disney");
      const [tab, setTab] = useState(mediaType === "tv" ? "episodes" : "suggested");
      useEffect(() => setTab(mediaType === "tv" ? "episodes" : "suggested"), [mediaType, id]);
      useEffect(() => {
            if (data?.detail) document.title = `Watch ${titleOf(data.detail)} | Dizney+`;
      }, [data?.detail]);

      if (status === "loading") return <div className="dp-detail"><div className="dp-detail__bg xp-skeleton" /></div>;
      if (status === "error") return <div className="dp-page dp-page--pad"><div className="dp-error"><span>{error}</span><button type="button" onClick={retry}>RETRY</button></div></div>;

      const { detail } = data;
      const title = titleOf(detail);
      const tabs = [mediaType === "tv" && ["episodes", "EPISODES"], ["suggested", "SUGGESTED"], data.trailer && ["extras", "EXTRAS"], ["details", "DETAILS"]].filter(Boolean);
      return (
            <div className="dp-detail">
                  <div className="dp-detail__bg"><Img path={detail.backdrop_path} size="w1280" alt="" eager fallbackTitle="" /></div>
                  <section className="dp-detail__head">
                        {data.logo ? <Img path={data.logo} size="w500" alt={title} className="dp-detail__logo" eager /> : <h1 className="dp-detail__title">{title}</h1>}
                        <p className="dp-detail__meta">
                              {cert && <span className="dp-cert">{cert}</span>}
                              <span>{yearOf(detail)}</span>
                              <span>•</span>
                              <span>{mediaType === "tv" ? `${detail.number_of_seasons} Season${detail.number_of_seasons > 1 ? "s" : ""}` : runtimeLabel(detail.runtime)}</span>
                        </p>
                        <p className="dp-detail__genres">{(detail.genres || []).map((genre) => genre.name).join(", ")}</p>
                        <div className="dp-detail__actions">
                              <button type="button" className="dp-btn dp-btn--play" onClick={() => play(detail)}><Play size={22} fill="currentColor" /> PLAY</button>
                              {data.trailer && <button type="button" className="dp-btn dp-btn--trailer" onClick={() => trailer(detail)}><Play size={20} /> TRAILER</button>}
                              <button type="button" className="dp-circle" onClick={() => toggle(detail)} aria-label="Watchlist">{has(detail) ? <Check size={24} /> : <Plus size={26} />}</button>
                        </div>
                        <p className="dp-detail__overview">{detail.overview}</p>
                  </section>

                  <nav className="dp-tabs" role="tablist">
                        {tabs.map(([key, label]) => (
                              <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? "is-active" : ""} onClick={() => setTab(key)}>{label}</button>
                        ))}
                  </nav>

                  <section className="dp-detail__panel">
                        {tab === "episodes" && <Episodes detail={detail} />}
                        {tab === "suggested" && (
                              <div className="dp-grid">
                                    {data.relatedStatus === "loading" && Array.from({ length: 10 }).map((_, index) => <span key={index} className="dp-tile dp-tile--skel xp-skeleton" />)}
                                    {data.related.map((item) => <DisneyTile key={`${item.media_type}-${item.id}`} item={item} />)}
                                    {data.relatedStatus === "ready" && !data.related.length && <p className="dp-empty">No suggestions available.</p>}
                              </div>
                        )}
                        {tab === "extras" && data.trailer && (
                              <div className="dp-grid">
                                    <button type="button" className="dp-tile" onClick={() => trailer(detail)} aria-label="Play trailer">
                                          <img src={`https://img.youtube.com/vi/${data.trailer.key}/hqdefault.jpg`} alt="" loading="lazy" />
                                          <span className="dp-tile__title">{data.trailer.name}</span>
                                    </button>
                              </div>
                        )}
                        {tab === "details" && (
                              <div className="dp-info">
                                    <div>
                                          <h3>{title}</h3>
                                          <p>{detail.overview}</p>
                                    </div>
                                    <dl>
                                          <dt>Duration:</dt><dd>{mediaType === "tv" ? `${detail.number_of_episodes} episodes` : runtimeLabel(detail.runtime)}</dd>
                                          <dt>Release date:</dt><dd>{detail.release_date || detail.first_air_date}</dd>
                                          <dt>Genre:</dt><dd>{(detail.genres || []).map((genre) => genre.name).join(", ")}</dd>
                                          {cert && (<><dt>Rating:</dt><dd>{cert}</dd></>)}
                                    </dl>
                                    <dl>
                                          {data.director.length > 0 && (<><dt>Director:</dt><dd>{data.director.map((person) => person.name).join(", ")}</dd></>)}
                                          {data.creators.length > 0 && (<><dt>Created by:</dt><dd>{data.creators.map((person) => person.name).join(", ")}</dd></>)}
                                          <dt>Starring:</dt><dd>{data.cast.slice(0, 8).map((person) => person.name).join(", ") || "—"}</dd>
                                    </dl>
                              </div>
                        )}
                  </section>
                  <Outlet />
            </div>
      );
}
