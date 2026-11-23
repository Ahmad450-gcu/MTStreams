import { useEffect, useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import { Check, Clapperboard, Play, Plus } from "lucide-react";
import Img from "../shared/Img";
import { runtimeLabel, titleOf, useCertification, useMyList, useSeason, useTitle, yearOf } from "../shared/hooks";
import { useTitleNav } from "../shared/navigation";
import { HuluTile } from "./HuluHome";

function Episodes({ detail }) {
      const seasons = (detail.seasons || []).filter((season) => season.episode_count > 0 && season.season_number > 0);
      const [season, setSeason] = useState(seasons[0]?.season_number ?? 1);
      const { episodes, status, error, retry } = useSeason(detail.id, season);
      const { play } = useTitleNav();
      return (
            <>
                  <select className="hu-select" value={season} onChange={(event) => setSeason(Number(event.target.value))} aria-label="Season">
                        {seasons.map((entry) => <option key={entry.season_number} value={entry.season_number}>Season {entry.season_number}</option>)}
                  </select>
                  {status === "error" && <div className="hu-error"><span>{error}</span><button type="button" onClick={retry}>TRY AGAIN</button></div>}
                  <div className="hu-episodes">
                        {status === "loading" && Array.from({ length: 4 }).map((_, index) => <span key={index} className="hu-tile hu-tile--skel xp-skeleton" />)}
                        {episodes.map((episode) => (
                              <article key={episode.id} className="hu-ep">
                                    <button type="button" className="hu-ep__art" onClick={() => play(detail, season, episode.episode_number)} aria-label={`Play episode ${episode.episode_number}`}>
                                          <Img path={episode.still_path || detail.backdrop_path} size="w500" alt="" fallbackTitle={episode.name} />
                                          <span className="hu-ep__play"><Play size={20} fill="currentColor" /></span>
                                    </button>
                                    <p className="hu-ep__num">S{season} E{episode.episode_number}</p>
                                    <h4>{episode.name}</h4>
                                    <p className="hu-ep__overview">{episode.overview}</p>
                                    <p className="hu-ep__meta">{[episode.runtime && `${episode.runtime} min`, episode.air_date && new Date(episode.air_date).toLocaleDateString(undefined, { month: "numeric", day: "numeric", year: "2-digit" })].filter(Boolean).join(" • ")}</p>
                              </article>
                        ))}
                  </div>
            </>
      );
}

export default function HuluDetails({ mediaType }) {
      const { id } = useParams();
      const { status, data, error, retry } = useTitle("hulu", mediaType, id);
      const cert = useCertification(mediaType, id);
      const { play, trailer } = useTitleNav();
      const { has, toggle } = useMyList("hulu");
      const [tab, setTab] = useState(mediaType === "tv" ? "episodes" : "like");
      useEffect(() => setTab(mediaType === "tv" ? "episodes" : "like"), [mediaType, id]);
      useEffect(() => {
            if (data?.detail) document.title = `Watch ${titleOf(data.detail)} | hulo`;
      }, [data?.detail]);

      if (status === "loading") return <div className="hu-detail"><div className="hu-mast xp-skeleton" /></div>;
      if (status === "error") return <div className="hu-page hu-page--pad"><div className="hu-error"><span>{error}</span><button type="button" onClick={retry}>TRY AGAIN</button></div></div>;

      const { detail } = data;
      const title = titleOf(detail);
      const tabs = [mediaType === "tv" && ["episodes", "EPISODES"], ["like", "YOU MAY ALSO LIKE"], data.trailer && ["extras", "EXTRAS"], ["details", "DETAILS"]].filter(Boolean);
      return (
            <div className="hu-detail">
                  <section className="hu-mast hu-mast--detail">
                        <Img path={detail.backdrop_path} size="w1280" alt="" className="hu-mast__img" eager fallbackTitle="" />
                        <div className="hu-mast__shade" />
                        <div className="hu-mast__content">
                              {data.logo ? <Img path={data.logo} size="w500" alt={title} className="hu-mast__logo" eager /> : <h1 className="hu-mast__title">{title}</h1>}
                              <p className="hu-mast__meta">
                                    {cert && <span className="hu-cert">{cert}</span>}
                                    <span>{(detail.genres || []).slice(0, 2).map((genre) => genre.name).join(", ")}</span>
                                    <span>{mediaType === "tv" ? "TV Series" : "Movie"}</span>
                                    <span>{yearOf(detail)}</span>
                                    <span>{mediaType === "tv" ? `${detail.number_of_seasons} season${detail.number_of_seasons > 1 ? "s" : ""}` : runtimeLabel(detail.runtime)}</span>
                              </p>
                              <p className="hu-mast__synopsis">{detail.overview}</p>
                              <div className="hu-mast__actions">
                                    <button type="button" className="hu-btn hu-btn--play" onClick={() => play(detail)}><Play size={18} fill="currentColor" /> {mediaType === "tv" ? "START WATCHING S1 E1" : "PLAY"}</button>
                                    <button type="button" className="hu-circle" onClick={() => toggle(detail)} aria-label="My Stuff">{has(detail) ? <Check size={22} /> : <Plus size={22} />}</button>
                                    {data.trailer && <button type="button" className="hu-circle" onClick={() => trailer(detail)} aria-label="Trailer"><Clapperboard size={20} /></button>}
                              </div>
                        </div>
                  </section>
                  <nav className="hu-tabs" role="tablist">
                        {tabs.map(([key, label]) => <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? "is-active" : ""} onClick={() => setTab(key)}>{label}</button>)}
                  </nav>
                  <section className="hu-detail__panel">
                        {tab === "episodes" && <Episodes detail={detail} />}
                        {tab === "like" && (
                              <div className="hu-grid">
                                    {data.relatedStatus === "loading" && Array.from({ length: 8 }).map((_, index) => <span key={index} className="hu-tile hu-tile--skel xp-skeleton" />)}
                                    {data.related.map((item) => <HuluTile key={`${item.media_type}-${item.id}`} item={item} />)}
                                    {data.relatedStatus === "ready" && !data.related.length && <p className="hu-empty">No recommendations yet.</p>}
                              </div>
                        )}
                        {tab === "extras" && data.trailer && (
                              <div className="hu-grid">
                                    <button type="button" className="hu-tile" onClick={() => trailer(detail)}>
                                          <span className="hu-tile__art"><img src={`https://img.youtube.com/vi/${data.trailer.key}/hqdefault.jpg`} alt="" loading="lazy" /></span>
                                          <span className="hu-tile__title">{data.trailer.name}</span>
                                          <span className="hu-tile__sub">Trailer</span>
                                    </button>
                              </div>
                        )}
                        {tab === "details" && (
                              <div className="hu-info">
                                    <div>
                                          <h3>About This Show</h3>
                                          <p>{detail.overview}</p>
                                    </div>
                                    <dl>
                                          {data.cast.length > 0 && (<><dt>STARRING</dt><dd>{data.cast.slice(0, 6).map((person) => person.name).join(", ")}</dd></>)}
                                          {data.director.length > 0 && (<><dt>DIRECTOR</dt><dd>{data.director.map((person) => person.name).join(", ")}</dd></>)}
                                          {data.creators.length > 0 && (<><dt>CREATED BY</dt><dd>{data.creators.map((person) => person.name).join(", ")}</dd></>)}
                                          <dt>GENRE</dt><dd>{(detail.genres || []).map((genre) => genre.name).join(", ")}</dd>
                                          {cert && (<><dt>RATING</dt><dd>{cert}</dd></>)}
                                    </dl>
                              </div>
                        )}
                  </section>
                  <Outlet />
            </div>
      );
}
