import { useEffect, useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import { Check, Clapperboard, Play, Plus, Share2, ThumbsDown, ThumbsUp } from "lucide-react";
import Img from "../shared/Img";
import { runtimeLabel, titleOf, useCertification, useMyList, useSeason, useTitle, yearOf } from "../shared/hooks";
import { useTitleNav } from "../shared/navigation";
import { IncludedBadge, PrimeGrid, Rating } from "./PrimeHome";

function Episodes({ detail }) {
      const seasons = (detail.seasons || []).filter((season) => season.episode_count > 0);
      const [season, setSeason] = useState(seasons.find((entry) => entry.season_number > 0)?.season_number ?? seasons[0]?.season_number);
      const { episodes, status, error, retry } = useSeason(detail.id, season);
      const { play } = useTitleNav();
      return (
            <div className="pv-episodes">
                  {seasons.length > 1 && (
                        <select className="pv-select" value={season} onChange={(event) => setSeason(Number(event.target.value))} aria-label="Season">
                              {seasons.map((entry) => <option key={entry.season_number} value={entry.season_number}>{entry.season_number === 0 ? "Specials" : `Season ${entry.season_number}`}</option>)}
                        </select>
                  )}
                  {status === "loading" && Array.from({ length: 3 }).map((_, index) => <div key={index} className="pv-ep pv-ep--skel xp-skeleton" />)}
                  {status === "error" && <div className="pv-error"><span>{error}</span><button type="button" onClick={retry}>Retry</button></div>}
                  {episodes.map((episode) => (
                        <article key={episode.id} className="pv-ep">
                              <button type="button" className="pv-ep__still" onClick={() => play(detail, season, episode.episode_number)} aria-label={`Play episode ${episode.episode_number}`}>
                                    <Img path={episode.still_path || detail.backdrop_path} size="w300" alt="" fallbackTitle={episode.name} />
                                    <span className="pv-ep__play"><Play size={20} fill="currentColor" /></span>
                              </button>
                              <div className="pv-ep__body">
                                    <h4>S{season} E{episode.episode_number} - {episode.name}</h4>
                                    <p className="pv-ep__meta">
                                          {episode.air_date && new Date(episode.air_date).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                                          {episode.runtime ? <span>{episode.runtime}min</span> : null}
                                    </p>
                                    <p className="pv-ep__overview">{episode.overview || "No synopsis available."}</p>
                                    <IncludedBadge />
                              </div>
                        </article>
                  ))}
            </div>
      );
}

export default function PrimeDetails({ mediaType }) {
      const { id } = useParams();
      const { status, data, error, retry } = useTitle("prime", mediaType, id);
      const cert = useCertification(mediaType, id);
      const { play, trailer } = useTitleNav();
      const { has, toggle } = useMyList("prime");
      const [tab, setTab] = useState(mediaType === "tv" ? "episodes" : "related");
      const [vote, setVote] = useState(0);

      useEffect(() => {
            setTab(mediaType === "tv" ? "episodes" : "related");
      }, [mediaType, id]);
      useEffect(() => {
            if (data?.detail) document.title = `Watch ${titleOf(data.detail)} | prima video`;
      }, [data?.detail]);

      if (status === "loading") return <div className="pv-detail"><div className="pv-detail__hero xp-skeleton" /></div>;
      if (status === "error") {
            return (
                  <div className="pv-page pv-page--padded">
                        <div className="pv-error pv-error--page"><span>{error}</span><button type="button" onClick={retry}>Retry</button></div>
                  </div>
            );
      }

      const { detail } = data;
      const title = titleOf(detail);
      const length = mediaType === "tv" ? `${detail.number_of_seasons} season${detail.number_of_seasons > 1 ? "s" : ""}` : runtimeLabel(detail.runtime);
      return (
            <div className="pv-detail">
                  <section className="pv-detail__hero">
                        <div className="pv-detail__art"><Img path={detail.backdrop_path} size="w1280" alt="" eager fallbackTitle="" /></div>
                        <div className="pv-detail__content">
                              {data.logo ? <Img path={data.logo} size="w500" alt={title} className="pv-detail__logo" eager /> : <h1 className="pv-detail__title">{title}</h1>}
                              <div className="pv-hero__meta">
                                    <Rating value={detail.vote_average} />
                                    <span>{length}</span>
                                    <span>{yearOf(detail)}</span>
                                    <span className="pv-tagbox">HD</span>
                                    {cert && <span className="pv-cert">{cert}</span>}
                              </div>
                              <p className="pv-detail__synopsis">{detail.overview}</p>
                              <IncludedBadge />
                              <div className="pv-hero__actions">
                                    <button type="button" className="pv-play pv-play--big" onClick={() => play(detail)}>
                                          <span className="pv-play__icon"><Play size={24} fill="currentColor" /></span>
                                          <span>{mediaType === "tv" ? "Play S1 E1" : "Play"}<small>Watch now</small></span>
                                    </button>
                                    {data.trailer && <button type="button" className="pv-roundbtn" onClick={() => trailer(detail)} aria-label="Trailer"><Clapperboard size={22} /></button>}
                                    <button type="button" className="pv-roundbtn" onClick={() => toggle(detail)} aria-label="Watchlist">{has(detail) ? <Check size={22} /> : <Plus size={24} />}</button>
                                    <button type="button" className={`pv-roundbtn ${vote === 1 ? "is-on" : ""}`} onClick={() => setVote(vote === 1 ? 0 : 1)} aria-label="Like"><ThumbsUp size={20} /></button>
                                    <button type="button" className={`pv-roundbtn ${vote === -1 ? "is-on" : ""}`} onClick={() => setVote(vote === -1 ? 0 : -1)} aria-label="Not for me"><ThumbsDown size={20} /></button>
                                    <button type="button" className="pv-roundbtn" onClick={() => navigator.clipboard?.writeText(window.location.href)} aria-label="Copy link"><Share2 size={20} /></button>
                              </div>
                              <p className="pv-detail__genres">{(detail.genres || []).map((genre) => genre.name).join(" • ")}</p>
                        </div>
                  </section>

                  <div className="pv-tabs pv-tabs--detail" role="tablist">
                        {mediaType === "tv" && <button type="button" role="tab" aria-selected={tab === "episodes"} className={tab === "episodes" ? "is-active" : ""} onClick={() => setTab("episodes")}>Episodes</button>}
                        <button type="button" role="tab" aria-selected={tab === "related"} className={tab === "related" ? "is-active" : ""} onClick={() => setTab("related")}>Related</button>
                        <button type="button" role="tab" aria-selected={tab === "details"} className={tab === "details" ? "is-active" : ""} onClick={() => setTab("details")}>More details</button>
                  </div>

                  <div className="pv-detail__panel">
                        {tab === "episodes" && mediaType === "tv" && <Episodes detail={detail} />}
                        {tab === "related" && (
                              <>
                                    <h3 className="pv-subtitle">Customers also watched</h3>
                                    {data.relatedStatus === "loading" ? <div className="pv-grid">{Array.from({ length: 8 }).map((_, index) => <span key={index} className="pv-skel pv-skel--card xp-skeleton" />)}</div> : <PrimeGrid items={data.related} emptyText="No related titles on prima video." />}
                              </>
                        )}
                        {tab === "details" && (
                              <dl className="pv-moredetails">
                                    {data.director.length > 0 && (<><dt>Directors</dt><dd>{data.director.map((person) => person.name).join(", ")}</dd></>)}
                                    {data.creators.length > 0 && (<><dt>Creators</dt><dd>{data.creators.map((person) => person.name).join(", ")}</dd></>)}
                                    <dt>Starring</dt><dd>{data.cast.slice(0, 8).map((person) => person.name).join(", ") || "—"}</dd>
                                    <dt>Genres</dt><dd>{(detail.genres || []).map((genre) => genre.name).join(", ")}</dd>
                                    <dt>Studio</dt><dd>{(detail.production_companies || []).map((company) => company.name).slice(0, 3).join(", ") || "—"}</dd>
                                    <dt>Audio languages</dt><dd>{(detail.spoken_languages || []).map((language) => language.english_name).join(", ") || "—"}</dd>
                                    {cert && (<><dt>Content advisory</dt><dd>{cert}</dd></>)}
                              </dl>
                        )}
                  </div>
                  <Outlet />
            </div>
      );
}
