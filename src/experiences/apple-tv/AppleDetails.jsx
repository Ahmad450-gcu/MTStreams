import { useEffect, useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import { Check, Play, Plus } from "lucide-react";
import Img from "../shared/Img";
import { runtimeLabel, titleOf, useCertification, useMyList, useSeason, useTitle, yearOf } from "../shared/hooks";
import { useRail, useTitleNav } from "../shared/navigation";
import { Shelf } from "./AppleHome";

function Seasons({ detail }) {
      const seasons = (detail.seasons || []).filter((season) => season.episode_count > 0 && season.season_number > 0);
      const [season, setSeason] = useState(seasons[0]?.season_number ?? 1);
      const { episodes, status, error, retry } = useSeason(detail.id, season);
      const { play } = useTitleNav();
      const rail = useRail();
      return (
            <section className="at-shelf at-seasons">
                  <div className="at-segmented" role="tablist" aria-label="Seasons">
                        {seasons.map((entry) => (
                              <button key={entry.season_number} type="button" role="tab" aria-selected={entry.season_number === season} className={entry.season_number === season ? "is-active" : ""} onClick={() => setSeason(entry.season_number)}>Season {entry.season_number}</button>
                        ))}
                  </div>
                  {status === "error" && <div className="at-error"><span>{error}</span><button type="button" onClick={retry}>Try Again</button></div>}
                  <div className="at-shelf__rail xp-scroll-x" ref={rail.ref}>
                        {status === "loading" && Array.from({ length: 4 }).map((_, index) => <span key={index} className="at-lockup at-skel xp-skeleton" />)}
                        {episodes.map((episode) => (
                              <button key={episode.id} type="button" className="at-lockup at-episode" onClick={() => play(detail, season, episode.episode_number)}>
                                    <span className="at-lockup__art">
                                          <Img path={episode.still_path || detail.backdrop_path} size="w500" alt="" fallbackTitle={episode.name} />
                                          <span className="at-episode__play"><Play size={18} fill="currentColor" /></span>
                                    </span>
                                    <span className="at-episode__label">EPISODE {episode.episode_number}</span>
                                    <span className="at-lockup__title">{episode.name}</span>
                                    <span className="at-episode__overview">{episode.overview}</span>
                                    {episode.runtime ? <span className="at-lockup__sub">{episode.runtime} min</span> : null}
                              </button>
                        ))}
                  </div>
            </section>
      );
}

export default function AppleDetails({ mediaType }) {
      const { id } = useParams();
      const { status, data, error, retry } = useTitle("apple", mediaType, id);
      const cert = useCertification(mediaType, id);
      const { play, trailer } = useTitleNav();
      const { has, toggle } = useMyList("apple");
      const [more, setMore] = useState(false);
      useEffect(() => {
            setMore(false);
            if (data?.detail) document.title = `${titleOf(data.detail)} - Pear TV+`;
      }, [data?.detail]);

      if (status === "loading") return <div className="at-detail"><div className="at-hero at-hero--detail xp-skeleton" /></div>;
      if (status === "error") return <div className="at-page at-page--pad"><div className="at-error"><span>{error}</span><button type="button" onClick={retry}>Try Again</button></div></div>;

      const { detail } = data;
      const title = titleOf(detail);
      const crew = [...data.director.map((person) => ({ ...person, role: "Director" })), ...data.creators.map((person) => ({ ...person, role: "Creator" }))];
      return (
            <div className="at-detail">
                  <section className="at-hero at-hero--detail">
                        <Img path={detail.backdrop_path} size="w1280" alt="" className="at-hero__img" eager fallbackTitle="" />
                        <div className="at-hero__shade" />
                        <div className="at-hero__content">
                              {data.logo ? <Img path={data.logo} size="w500" alt={title} className="at-hero__logo" eager /> : <h1 className="at-hero__title">{title}</h1>}
                              <div className="at-hero__actions">
                                    <button type="button" className="at-btn at-btn--primary at-btn--wide" onClick={() => play(detail)}><Play size={16} fill="currentColor" /> {mediaType === "tv" ? "Play S1, E1" : "Play"}</button>
                                    <button type="button" className="at-roundbtn" onClick={() => toggle(detail)} aria-label="Add to Up Next">{has(detail) ? <Check size={18} /> : <Plus size={20} />}</button>
                              </div>
                              <p className={`at-detail__desc ${more ? "is-open" : ""}`}>
                                    {detail.overview}
                                    {!more && detail.overview?.length > 180 && <button type="button" onClick={() => setMore(true)}>MORE</button>}
                              </p>
                              <p className="at-detail__meta">
                                    <span>{(detail.genres || [])[0]?.name}</span>
                                    <span>{yearOf(detail)}</span>
                                    <span>{mediaType === "tv" ? `${detail.number_of_seasons} Season${detail.number_of_seasons > 1 ? "s" : ""}` : runtimeLabel(detail.runtime)}</span>
                                    {cert && <span className="at-badge">{cert}</span>}
                                    <span className="at-badge">HD</span>
                              </p>
                              {data.trailer && <button type="button" className="at-detail__trailer" onClick={() => trailer(detail)}>Watch Trailer</button>}
                        </div>
                  </section>

                  <div className="at-shelves at-shelves--detail">
                        {mediaType === "tv" && <Seasons detail={detail} />}
                        {data.related.length > 0 && <Shelf title="Related" items={data.related} />}
                        {data.relatedStatus === "loading" && <Shelf title="Related" items={[]} loading />}

                        {(data.cast.length > 0 || crew.length > 0) && (
                              <section className="at-shelf">
                                    <header className="at-shelf__head"><h2>Cast &amp; Crew</h2></header>
                                    <div className="at-shelf__rail xp-scroll-x">
                                          {[...data.cast.slice(0, 14).map((person) => ({ ...person, role: person.character })), ...crew].map((person, index) => (
                                                <div key={`${person.id}-${index}`} className="at-person">
                                                      <span className="at-person__photo">
                                                            {person.profile_path ? <img src={`https://image.tmdb.org/t/p/w185${person.profile_path}`} alt="" loading="lazy" /> : <span>{person.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span>}
                                                      </span>
                                                      <strong>{person.name}</strong>
                                                      <small>{person.role}</small>
                                                </div>
                                          ))}
                                    </div>
                              </section>
                        )}

                        <section className="at-shelf at-info">
                              <header className="at-shelf__head"><h2>Information</h2></header>
                              <div className="at-info__grid">
                                    <div><h3>About</h3><p>{detail.overview}</p></div>
                                    <dl>
                                          <dt>Studio</dt><dd>{(detail.production_companies || [])[0]?.name || "—"}</dd>
                                          <dt>Released</dt><dd>{detail.release_date || detail.first_air_date || "—"}</dd>
                                          <dt>{mediaType === "tv" ? "Episodes" : "Run Time"}</dt><dd>{mediaType === "tv" ? detail.number_of_episodes : runtimeLabel(detail.runtime)}</dd>
                                          {cert && (<><dt>Rated</dt><dd>{cert}</dd></>)}
                                    </dl>
                                    <dl>
                                          <dt>Region of Origin</dt><dd>{(detail.production_countries || detail.origin_country || []).map((country) => country.name || country).slice(0, 2).join(", ") || "—"}</dd>
                                          <dt>Original Audio</dt><dd>{(detail.spoken_languages || [])[0]?.english_name || "—"}</dd>
                                          <dt>Genre</dt><dd>{(detail.genres || []).map((genre) => genre.name).join(", ")}</dd>
                                    </dl>
                              </div>
                        </section>
                  </div>
                  <Outlet />
            </div>
      );
}
