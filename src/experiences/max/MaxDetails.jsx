import { useEffect, useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import { Check, Clapperboard, Play, Plus } from "lucide-react";
import Img from "../shared/Img";
import { runtimeLabel, titleOf, useCertification, useMyList, useSeason, useTitle, yearOf } from "../shared/hooks";
import { useRail, useTitleNav } from "../shared/navigation";
import { MaxTile } from "./MaxHome";

function Episodes({ detail }) {
      const seasons = (detail.seasons || []).filter((season) => season.episode_count > 0 && season.season_number > 0);
      const [season, setSeason] = useState(seasons[0]?.season_number ?? 1);
      const { episodes, status, error, retry } = useSeason(detail.id, season);
      const { play } = useTitleNav();
      const rail = useRail();
      return (
            <div className="mx-episodes">
                  <div className="mx-seasons xp-scroll-x" role="tablist" aria-label="Seasons">
                        {seasons.map((entry) => (
                              <button key={entry.season_number} type="button" role="tab" aria-selected={entry.season_number === season} className={entry.season_number === season ? "is-active" : ""} onClick={() => setSeason(entry.season_number)}>
                                    Season {entry.season_number}
                              </button>
                        ))}
                  </div>
                  {status === "error" && <div className="mx-error"><span>{error}</span><button type="button" onClick={retry}>Try again</button></div>}
                  <div className="mx-episodes__rail xp-scroll-x" ref={rail.ref}>
                        {status === "loading" && Array.from({ length: 4 }).map((_, index) => <span key={index} className="mx-skel mx-skel--tile xp-skeleton" />)}
                        {episodes.map((episode) => (
                              <article key={episode.id} className="mx-ep">
                                    <button type="button" className="mx-ep__art" onClick={() => play(detail, season, episode.episode_number)} aria-label={`Play episode ${episode.episode_number}`}>
                                          <Img path={episode.still_path || detail.backdrop_path} size="w500" alt="" fallbackTitle={episode.name} />
                                          <span className="mx-ep__play"><Play size={22} fill="currentColor" /></span>
                                          {episode.runtime ? <span className="mx-ep__time">{episode.runtime}m</span> : null}
                                    </button>
                                    <h4><span>{episode.episode_number}.</span> {episode.name}</h4>
                                    <p>{episode.overview || "Episode details coming soon."}</p>
                              </article>
                        ))}
                  </div>
            </div>
      );
}

export default function MaxDetails({ mediaType }) {
      const { id } = useParams();
      const { status, data, error, retry } = useTitle("max", mediaType, id);
      const cert = useCertification(mediaType, id);
      const { play, trailer } = useTitleNav();
      const { has, toggle } = useMyList("max");
      const [tab, setTab] = useState(mediaType === "tv" ? "episodes" : "more");

      useEffect(() => setTab(mediaType === "tv" ? "episodes" : "more"), [mediaType, id]);
      useEffect(() => {
            if (data?.detail) document.title = `${titleOf(data.detail)} | HBX max`;
      }, [data?.detail]);

      if (status === "loading") return <div className="mx-detail"><div className="mx-detail__hero xp-skeleton" /></div>;
      if (status === "error") return <div className="mx-page mx-page--pad"><div className="mx-error"><span>{error}</span><button type="button" onClick={retry}>Try again</button></div></div>;

      const { detail } = data;
      const title = titleOf(detail);
      const tabs = [
            mediaType === "tv" && ["episodes", "Episodes"],
            ["more", "More Like This"],
            data.trailer && ["extras", "Extras"],
            ["details", "Details"],
      ].filter(Boolean);

      return (
            <div className="mx-detail">
                  <section className="mx-detail__hero">
                        <Img path={detail.backdrop_path} size="w1280" alt="" className="mx-hero__img" eager fallbackTitle="" />
                        <div className="mx-hero__shade" />
                        <div className="mx-hero__content mx-detail__content">
                              <span className="mx-eyebrow">{mediaType === "tv" ? "Series" : "Movie"}</span>
                              {data.logo ? <Img path={data.logo} size="w500" alt={title} className="mx-hero__logo" eager /> : <h1 className="mx-hero__title">{title}</h1>}
                              <p className="mx-hero__meta">
                                    {cert && <span className="mx-cert">{cert}</span>}
                                    <span>{yearOf(detail)}</span>
                                    <span>{mediaType === "tv" ? `${detail.number_of_seasons} Season${detail.number_of_seasons > 1 ? "s" : ""}` : runtimeLabel(detail.runtime)}</span>
                                    {(detail.genres || []).slice(0, 3).map((genre) => <span key={genre.id}>{genre.name}</span>)}
                              </p>
                              <p className="mx-hero__synopsis mx-detail__synopsis">{detail.overview}</p>
                              <div className="mx-hero__actions">
                                    <button type="button" className="mx-btn mx-btn--play" onClick={() => play(detail)}><Play size={20} fill="currentColor" /> {mediaType === "tv" ? "Play S1 E1" : "Play"}</button>
                                    {data.trailer && <button type="button" className="mx-btn mx-btn--ghost" onClick={() => trailer(detail)}><Clapperboard size={18} /> Trailer</button>}
                                    <button type="button" className="mx-iconbtn" onClick={() => toggle(detail)} aria-label="My Stuff">{has(detail) ? <Check size={22} /> : <Plus size={22} />}</button>
                              </div>
                              {data.cast.length > 0 && <p className="mx-detail__starring"><span>Starring</span> {data.cast.slice(0, 4).map((person) => person.name).join(", ")}</p>}
                        </div>
                  </section>

                  <nav className="mx-tabs" role="tablist">
                        {tabs.map(([key, label]) => (
                              <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? "is-active" : ""} onClick={() => setTab(key)}>{label}</button>
                        ))}
                  </nav>

                  <div className="mx-detail__panel">
                        {tab === "episodes" && <Episodes detail={detail} />}
                        {tab === "more" && (
                              <div className="mx-grid mx-grid--tile">
                                    {data.relatedStatus === "loading" && Array.from({ length: 8 }).map((_, index) => <span key={index} className="mx-skel mx-skel--tile xp-skeleton" />)}
                                    {data.related.map((item) => <MaxTile key={`${item.media_type}-${item.id}`} item={item} />)}
                                    {data.relatedStatus === "ready" && !data.related.length && <p className="mx-empty">No similar titles on HBX max.</p>}
                              </div>
                        )}
                        {tab === "extras" && data.trailer && (
                              <div className="mx-grid mx-grid--tile">
                                    <button type="button" className="mx-tile" onClick={() => trailer(detail)}>
                                          <span className="mx-tile__art">
                                                <img src={`https://img.youtube.com/vi/${data.trailer.key}/hqdefault.jpg`} alt="" loading="lazy" />
                                                <span className="mx-ep__play"><Play size={22} fill="currentColor" /></span>
                                          </span>
                                          <span className="mx-tile__title">Official Trailer</span>
                                          <span className="mx-tile__sub">{data.trailer.name}</span>
                                    </button>
                              </div>
                        )}
                        {tab === "details" && (
                              <div className="mx-info">
                                    <div>
                                          <h3>{title}</h3>
                                          <p>{detail.overview}</p>
                                    </div>
                                    <dl>
                                          {data.director.length > 0 && (<><dt>Director</dt><dd>{data.director.map((person) => person.name).join(", ")}</dd></>)}
                                          {data.creators.length > 0 && (<><dt>Created by</dt><dd>{data.creators.map((person) => person.name).join(", ")}</dd></>)}
                                          <dt>Cast</dt><dd>{data.cast.slice(0, 10).map((person) => person.name).join(", ") || "—"}</dd>
                                          <dt>Genres</dt><dd>{(detail.genres || []).map((genre) => genre.name).join(", ")}</dd>
                                          {cert && (<><dt>Rating</dt><dd>{cert}</dd></>)}
                                          <dt>Studio</dt><dd>{(detail.production_companies || []).slice(0, 3).map((company) => company.name).join(", ") || "—"}</dd>
                                    </dl>
                              </div>
                        )}
                  </div>
                  <Outlet />
            </div>
      );
}
