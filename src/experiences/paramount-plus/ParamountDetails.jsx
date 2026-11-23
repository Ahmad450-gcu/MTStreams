import { useEffect, useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import { Check, Clapperboard, Play, Plus } from "lucide-react";
import Img from "../shared/Img";
import { runtimeLabel, titleOf, useCertification, useMyList, useSeason, useTitle, yearOf } from "../shared/hooks";
import { useTitleNav } from "../shared/navigation";
import { ParamountGrid } from "./ParamountHome";

function Episodes({ detail }) {
      const seasons = (detail.seasons || []).filter((season) => season.episode_count > 0 && season.season_number > 0);
      const [season, setSeason] = useState(seasons[0]?.season_number ?? 1);
      const { episodes, status, error, retry } = useSeason(detail.id, season);
      const { play } = useTitleNav();
      return (
            <>
                  <div className="pp-seasonbar">
                        <select value={season} onChange={(event) => setSeason(Number(event.target.value))} aria-label="Season">
                              {seasons.map((entry) => <option key={entry.season_number} value={entry.season_number}>Season {entry.season_number}</option>)}
                        </select>
                        <span>{episodes.length ? `${episodes.length} Episodes` : ""}</span>
                  </div>
                  {status === "error" && <div className="pp-error"><span>{error}</span><button type="button" onClick={retry}>TRY AGAIN</button></div>}
                  <div className="pp-episodes">
                        {status === "loading" && Array.from({ length: 4 }).map((_, index) => <span key={index} className="pp-skel-wide xp-skeleton" />)}
                        {episodes.map((episode) => (
                              <article key={episode.id} className="pp-wide pp-ep">
                                    <button type="button" className="pp-wide__art" onClick={() => play(detail, season, episode.episode_number)} aria-label={`Play episode ${episode.episode_number}`}>
                                          <Img path={episode.still_path || detail.backdrop_path} size="w500" alt="" fallbackTitle={episode.name} />
                                          <span className="pp-wide__play"><Play size={20} fill="currentColor" /></span>
                                          {episode.runtime ? <span className="pp-ep__time">{episode.runtime}m</span> : null}
                                    </button>
                                    <p className="pp-ep__num">S{season} E{episode.episode_number}</p>
                                    <h3>{episode.name}</h3>
                                    <p className="pp-ep__overview">{episode.overview}</p>
                              </article>
                        ))}
                  </div>
            </>
      );
}

export default function ParamountDetails({ mediaType }) {
      const { id } = useParams();
      const { status, data, error, retry } = useTitle("paramount", mediaType, id);
      const cert = useCertification(mediaType, id);
      const { play, trailer } = useTitleNav();
      const { has, toggle } = useMyList("paramount");
      const [tab, setTab] = useState(mediaType === "tv" ? "episodes" : "more");
      useEffect(() => setTab(mediaType === "tv" ? "episodes" : "more"), [mediaType, id]);
      useEffect(() => {
            if (data?.detail) document.title = `${titleOf(data.detail)} - Watch on Paramont+`;
      }, [data?.detail]);

      if (status === "loading") return <div className="pp-detail"><div className="pp-marquee xp-skeleton" /></div>;
      if (status === "error") return <div className="pp-page pp-page--pad"><div className="pp-error"><span>{error}</span><button type="button" onClick={retry}>TRY AGAIN</button></div></div>;

      const { detail } = data;
      const title = titleOf(detail);
      return (
            <div className="pp-detail">
                  <section className="pp-marquee pp-marquee--detail">
                        <Img path={detail.backdrop_path} size="w1280" alt="" className="pp-marquee__img" eager fallbackTitle="" />
                        <div className="pp-marquee__shade" />
                        <div className="pp-marquee__content">
                              {data.logo ? <Img path={data.logo} size="w500" alt={title} className="pp-marquee__logo" eager /> : <h1 className="pp-marquee__title">{title}</h1>}
                              <p className="pp-marquee__meta">{[cert, yearOf(detail), mediaType === "tv" ? `${detail.number_of_seasons} Season${detail.number_of_seasons > 1 ? "s" : ""}` : runtimeLabel(detail.runtime), (detail.genres || []).slice(0, 2).map((genre) => genre.name).join(", ")].filter(Boolean).join(" | ")}</p>
                              <p className="pp-marquee__synopsis pp-detail__synopsis">{detail.overview}</p>
                              <div className="pp-marquee__actions">
                                    <button type="button" className="pp-btn pp-btn--primary" onClick={() => play(detail)}><Play size={18} fill="currentColor" /> {mediaType === "tv" ? "WATCH S1 E1" : "WATCH NOW"}</button>
                                    {data.trailer && <button type="button" className="pp-btn pp-btn--secondary" onClick={() => trailer(detail)}><Clapperboard size={18} /> TRAILER</button>}
                                    <button type="button" className="pp-btn pp-btn--secondary" onClick={() => toggle(detail)}>{has(detail) ? <Check size={18} /> : <Plus size={18} />} MY LIST</button>
                              </div>
                              {data.cast.length > 0 && <p className="pp-detail__cast"><strong>Starring:</strong> {data.cast.slice(0, 5).map((person) => person.name).join(", ")}</p>}
                        </div>
                  </section>
                  <nav className="pp-tabs" role="tablist">
                        {mediaType === "tv" && <button type="button" role="tab" aria-selected={tab === "episodes"} className={tab === "episodes" ? "is-active" : ""} onClick={() => setTab("episodes")}>Episodes</button>}
                        <button type="button" role="tab" aria-selected={tab === "more"} className={tab === "more" ? "is-active" : ""} onClick={() => setTab("more")}>More Like This</button>
                        <button type="button" role="tab" aria-selected={tab === "about"} className={tab === "about" ? "is-active" : ""} onClick={() => setTab("about")}>About</button>
                  </nav>
                  <section className="pp-detail__panel">
                        {tab === "episodes" && <Episodes detail={detail} />}
                        {tab === "more" && (data.relatedStatus === "loading"
                              ? <div className="pp-grid">{Array.from({ length: 14 }).map((_, index) => <span key={index} className="pp-poster xp-skeleton" />)}</div>
                              : <ParamountGrid items={data.related} empty="No similar titles on Paramont+." />)}
                        {tab === "about" && (
                              <div className="pp-about">
                                    <p>{detail.overview}</p>
                                    <dl>
                                          {data.creators.length > 0 && (<><dt>Created by</dt><dd>{data.creators.map((person) => person.name).join(", ")}</dd></>)}
                                          {data.director.length > 0 && (<><dt>Director</dt><dd>{data.director.map((person) => person.name).join(", ")}</dd></>)}
                                          <dt>Cast</dt><dd>{data.cast.slice(0, 10).map((person) => person.name).join(", ") || "—"}</dd>
                                          <dt>Genre</dt><dd>{(detail.genres || []).map((genre) => genre.name).join(", ")}</dd>
                                          {cert && (<><dt>Rating</dt><dd>{cert}</dd></>)}
                                          <dt>Network / Studio</dt><dd>{[...(detail.networks || []), ...(detail.production_companies || [])].slice(0, 3).map((entry) => entry.name).join(", ") || "—"}</dd>
                                    </dl>
                              </div>
                        )}
                  </section>
                  <Outlet />
            </div>
      );
}
