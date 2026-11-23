import { useEffect, useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import { Check, Clapperboard, Play, Plus } from "lucide-react";
import Img from "../shared/Img";
import { runtimeLabel, titleOf, useCertification, useMyList, useSeason, useTitle, yearOf } from "../shared/hooks";
import { useTitleNav } from "../shared/navigation";
import { PeacockGrid } from "./PeacockHome";

function Episodes({ detail }) {
      const seasons = (detail.seasons || []).filter((season) => season.episode_count > 0 && season.season_number > 0);
      const [season, setSeason] = useState(seasons[0]?.season_number ?? 1);
      const { episodes, status, error, retry } = useSeason(detail.id, season);
      const { play } = useTitleNav();
      return (
            <div className="pk-episodes">
                  <div className="pk-seasonchips xp-scroll-x">
                        {seasons.map((entry) => <button key={entry.season_number} type="button" className={entry.season_number === season ? "is-active" : ""} onClick={() => setSeason(entry.season_number)}>Season {entry.season_number}</button>)}
                  </div>
                  {status === "error" && <div className="pk-error"><span>{error}</span><button type="button" onClick={retry}>Try Again</button></div>}
                  {status === "loading" && Array.from({ length: 3 }).map((_, index) => <div key={index} className="pk-ep pk-ep--skel xp-skeleton" />)}
                  {episodes.map((episode) => (
                        <button key={episode.id} type="button" className="pk-ep" onClick={() => play(detail, season, episode.episode_number)}>
                              <span className="pk-ep__art">
                                    <Img path={episode.still_path || detail.backdrop_path} size="w300" alt="" fallbackTitle={episode.name} />
                                    <span className="pk-ep__play"><Play size={18} fill="currentColor" /></span>
                              </span>
                              <span className="pk-ep__body">
                                    <small>S{season} E{episode.episode_number}{episode.runtime ? ` · ${episode.runtime}m` : ""}{episode.air_date ? ` · ${episode.air_date}` : ""}</small>
                                    <strong>{episode.name}</strong>
                                    <span>{episode.overview}</span>
                              </span>
                        </button>
                  ))}
            </div>
      );
}

export default function PeacockDetails({ mediaType }) {
      const { id } = useParams();
      const { status, data, error, retry } = useTitle("peacock", mediaType, id);
      const cert = useCertification(mediaType, id);
      const { play, trailer } = useTitleNav();
      const { has, toggle } = useMyList("peacock");
      const [tab, setTab] = useState(mediaType === "tv" ? "episodes" : "more");
      useEffect(() => setTab(mediaType === "tv" ? "episodes" : "more"), [mediaType, id]);
      useEffect(() => {
            if (data?.detail) document.title = `Watch ${titleOf(data.detail)} | peacoq`;
      }, [data?.detail]);

      if (status === "loading") return <div className="pk-detail"><div className="pk-detail__hero xp-skeleton" /></div>;
      if (status === "error") return <div className="pk-page pk-page--pad"><div className="pk-error"><span>{error}</span><button type="button" onClick={retry}>Try Again</button></div></div>;

      const { detail } = data;
      const title = titleOf(detail);
      return (
            <div className="pk-detail">
                  <section className="pk-detail__hero">
                        <Img path={detail.backdrop_path} size="w1280" alt="" className="pk-detail__img" eager fallbackTitle="" />
                        <div className="pk-detail__shade" />
                        <div className="pk-detail__content">
                              {data.logo ? <Img path={data.logo} size="w500" alt={title} className="pk-detail__logo" eager /> : <h1 className="pk-detail__title">{title}</h1>}
                              <p className="pk-detail__meta">
                                    {cert && <span className="pk-cert">{cert}</span>}
                                    {[yearOf(detail), mediaType === "tv" ? `${detail.number_of_seasons} Season${detail.number_of_seasons > 1 ? "s" : ""}` : runtimeLabel(detail.runtime), (detail.genres || []).slice(0, 2).map((genre) => genre.name).join(", ")].filter(Boolean).join(" · ")}
                              </p>
                              <p className="pk-detail__overview">{detail.overview}</p>
                              <div className="pk-jumbo__actions">
                                    <button type="button" className="pk-btn pk-btn--watch" onClick={() => play(detail)}><Play size={16} fill="currentColor" /> {mediaType === "tv" ? "Watch S1 E1" : "Watch Now"}</button>
                                    {data.trailer && <button type="button" className="pk-btn pk-btn--ghost" onClick={() => trailer(detail)}><Clapperboard size={16} /> Trailer</button>}
                                    <button type="button" className="pk-iconbtn" onClick={() => toggle(detail)} aria-label="My Stuff">{has(detail) ? <Check size={18} /> : <Plus size={20} />}</button>
                              </div>
                        </div>
                  </section>
                  <nav className="pk-tabs" role="tablist">
                        {[mediaType === "tv" && ["episodes", "Episodes"], ["more", "More Like This"], ["details", "Details"]].filter(Boolean).map(([key, label]) => (
                              <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? "is-active" : ""} onClick={() => setTab(key)}>{label}</button>
                        ))}
                  </nav>
                  <section className="pk-detail__panel">
                        {tab === "episodes" && <Episodes detail={detail} />}
                        {tab === "more" && (data.relatedStatus === "loading"
                              ? <div className="pk-grid">{Array.from({ length: 8 }).map((_, index) => <span key={index} className="pk-skel pk-skel--tile xp-skeleton" />)}</div>
                              : <PeacockGrid items={data.related} empty="No similar titles on peacoq." />)}
                        {tab === "details" && (
                              <dl className="pk-details">
                                    <dt>Starring</dt><dd>{data.cast.slice(0, 8).map((person) => person.name).join(", ") || "—"}</dd>
                                    {data.director.length > 0 && (<><dt>Director</dt><dd>{data.director.map((person) => person.name).join(", ")}</dd></>)}
                                    {data.creators.length > 0 && (<><dt>Creators</dt><dd>{data.creators.map((person) => person.name).join(", ")}</dd></>)}
                                    <dt>Genres</dt><dd>{(detail.genres || []).map((genre) => genre.name).join(", ")}</dd>
                                    {cert && (<><dt>Rating</dt><dd>{cert}</dd></>)}
                                    <dt>Released</dt><dd>{detail.release_date || detail.first_air_date || "—"}</dd>
                              </dl>
                        )}
                  </section>
                  <Outlet />
            </div>
      );
}
