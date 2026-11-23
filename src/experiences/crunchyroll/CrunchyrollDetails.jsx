import { useEffect, useMemo, useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import { Bookmark, BookmarkCheck, Clapperboard, Play, Share2, Star } from "lucide-react";
import Img from "../shared/Img";
import { runtimeLabel, titleOf, useCertification, useMyList, useSeason, useTitle, yearOf } from "../shared/hooks";
import { useTitleNav } from "../shared/navigation";
import { CrunchyRow } from "./CrunchyrollHome";

function StarRating({ value, count }) {
      const [mine, setMine] = useState(0);
      const average = value ? value / 2 : 0;
      return (
            <div className="cr-stars">
                  <div className="cr-stars__row" role="radiogroup" aria-label="Rate this title">
                        {[1, 2, 3, 4, 5].map((star) => (
                              <button key={star} type="button" role="radio" aria-checked={mine === star} aria-label={`${star} stars`} onClick={() => setMine(star)} className={star <= (mine || Math.round(average)) ? "is-on" : ""}>
                                    <Star size={20} fill="currentColor" />
                              </button>
                        ))}
                  </div>
                  <span>Average Rating: <strong>{average.toFixed(1)}</strong> ({count >= 1000 ? `${(count / 1000).toFixed(1)}K` : count || 0})</span>
            </div>
      );
}

function Episodes({ detail }) {
      const seasons = (detail.seasons || []).filter((season) => season.episode_count > 0 && season.season_number > 0);
      const [season, setSeason] = useState(seasons[0]?.season_number ?? 1);
      const [order, setOrder] = useState("oldest");
      const { episodes, status, error, retry } = useSeason(detail.id, season);
      const { play } = useTitleNav();
      const sorted = useMemo(() => (order === "oldest" ? episodes : [...episodes].reverse()), [episodes, order]);
      const current = seasons.find((entry) => entry.season_number === season);
      return (
            <section className="cr-eps">
                  <div className="cr-eps__bar">
                        <select value={season} onChange={(event) => setSeason(Number(event.target.value))} aria-label="Season">
                              {seasons.map((entry) => <option key={entry.season_number} value={entry.season_number}>S{entry.season_number}: {entry.name}</option>)}
                        </select>
                        <div className="cr-eps__sort">
                              <button type="button" className={order === "oldest" ? "is-active" : ""} onClick={() => setOrder("oldest")}>OLDEST</button>
                              <button type="button" className={order === "newest" ? "is-active" : ""} onClick={() => setOrder("newest")}>NEWEST</button>
                        </div>
                  </div>
                  {current && <p className="cr-eps__count">{current.episode_count} episodes{current.air_date ? ` · ${current.air_date.slice(0, 4)}` : ""}</p>}
                  {status === "error" && <div className="cr-error"><span>{error}</span><button type="button" onClick={retry}>TRY AGAIN</button></div>}
                  <div className="cr-eps__grid">
                        {status === "loading" && Array.from({ length: 8 }).map((_, index) => <span key={index} className="cr-skel cr-skel--episode xp-skeleton" />)}
                        {sorted.map((episode) => (
                              <button key={episode.id} type="button" className="cr-episode" onClick={() => play(detail, season, episode.episode_number)}>
                                    <span className="cr-episode__art">
                                          <Img path={episode.still_path || detail.backdrop_path} size="w500" alt="" fallbackTitle={episode.name} />
                                          {episode.runtime ? <span className="cr-episode__time">{episode.runtime}m</span> : null}
                                          <span className="cr-episode__play"><Play size={26} fill="currentColor" /></span>
                                    </span>
                                    <span className="cr-episode__name">S{season} E{episode.episode_number} - {episode.name}</span>
                                    <span className="cr-episode__when">{episode.air_date ? new Date(episode.air_date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : ""}</span>
                              </button>
                        ))}
                  </div>
            </section>
      );
}

export default function CrunchyrollDetails({ mediaType }) {
      const { id } = useParams();
      const { status, data, error, retry } = useTitle("crunchyroll", mediaType, id);
      const cert = useCertification(mediaType, id);
      const { play, trailer } = useTitleNav();
      const { has, toggle } = useMyList("crunchyroll");
      const [expanded, setExpanded] = useState(false);
      useEffect(() => {
            setExpanded(false);
            if (data?.detail) document.title = `Watch ${titleOf(data.detail)} - crunchyreel`;
      }, [data?.detail]);

      if (status === "loading") return <div className="cr-detail"><div className="cr-detail__banner xp-skeleton" /></div>;
      if (status === "error") return <div className="cr-page cr-page--pad"><div className="cr-error"><span>{error}</span><button type="button" onClick={retry}>TRY AGAIN</button></div></div>;

      const { detail } = data;
      const title = titleOf(detail);
      return (
            <div className="cr-detail">
                  <div className="cr-detail__banner">
                        <Img path={detail.backdrop_path} size="w1280" alt="" eager fallbackTitle="" />
                  </div>
                  <div className="cr-detail__body">
                        <div className="cr-detail__main">
                              {data.logo ? <Img path={data.logo} size="w500" alt={title} className="cr-detail__logo" eager /> : <h1 className="cr-detail__title">{title}</h1>}
                              <p className="cr-detail__meta">
                                    {cert && <span className="cr-cert">{cert}</span>}
                                    <span>{mediaType === "tv" ? "Series" : "Movie"}</span>
                                    <span>{yearOf(detail)}</span>
                                    <span>{mediaType === "tv" ? `${detail.number_of_episodes} Episodes` : runtimeLabel(detail.runtime)}</span>
                              </p>
                              <StarRating value={detail.vote_average} count={detail.vote_count} />
                              <div className="cr-detail__actions">
                                    <button type="button" className="cr-btn cr-btn--primary" onClick={() => play(detail)}><Play size={20} fill="currentColor" /> {mediaType === "tv" ? "START WATCHING S1 E1" : "WATCH NOW"}</button>
                                    <button type="button" className="cr-btn cr-btn--outline cr-btn--square" onClick={() => toggle(detail)} aria-label="Watchlist">{has(detail) ? <BookmarkCheck size={22} /> : <Bookmark size={22} />}</button>
                                    {data.trailer && <button type="button" className="cr-btn cr-btn--outline cr-btn--square" onClick={() => trailer(detail)} aria-label="Trailer"><Clapperboard size={20} /></button>}
                                    <button type="button" className="cr-btn cr-btn--outline cr-btn--square" onClick={() => navigator.clipboard?.writeText(window.location.href)} aria-label="Copy link"><Share2 size={20} /></button>
                              </div>
                              <p className={`cr-detail__desc ${expanded ? "is-open" : ""}`}>{detail.overview}</p>
                              {detail.overview?.length > 260 && <button type="button" className="cr-detail__more" onClick={() => setExpanded((value) => !value)}>{expanded ? "LESS DETAILS" : "MORE DETAILS"}</button>}
                              <div className="cr-tags">
                                    {(detail.genres || []).map((genre) => <span key={genre.id}>{genre.name}</span>)}
                              </div>
                        </div>
                        <aside className="cr-detail__side">
                              <dl>
                                    {data.creators.length > 0 && (<><dt>Creator</dt><dd>{data.creators.map((person) => person.name).join(", ")}</dd></>)}
                                    {data.director.length > 0 && (<><dt>Director</dt><dd>{data.director.map((person) => person.name).join(", ")}</dd></>)}
                                    <dt>Studio</dt><dd>{(detail.production_companies || []).slice(0, 2).map((company) => company.name).join(", ") || "—"}</dd>
                                    <dt>Audio</dt><dd>{(detail.spoken_languages || []).map((language) => language.english_name).join(", ") || "—"}</dd>
                                    {detail.first_air_date && (<><dt>First aired</dt><dd>{detail.first_air_date}</dd></>)}
                                    {cert && (<><dt>Content rating</dt><dd>{cert}</dd></>)}
                              </dl>
                        </aside>
                  </div>
                  {mediaType === "tv" && <div className="cr-detail__section"><Episodes detail={detail} /></div>}
                  <div className="cr-detail__section">
                        <CrunchyRow title="More Like This" items={data.related} loading={data.relatedStatus === "loading"} />
                  </div>
                  <Outlet />
            </div>
      );
}
