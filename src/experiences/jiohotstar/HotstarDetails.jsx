import { useEffect, useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import { Check, Clapperboard, Play, Plus } from "lucide-react";
import Img from "../shared/Img";
import { runtimeLabel, titleOf, useCertification, useMyList, useSeason, useTitle } from "../shared/hooks";
import { useRail, useTitleNav } from "../shared/navigation";
import { HotstarRow, KEY, metaLine } from "./HotstarHome";

function Episodes({ detail }) {
      const seasons = (detail.seasons || []).filter((season) => season.episode_count > 0 && season.season_number > 0);
      const [season, setSeason] = useState(seasons[0]?.season_number ?? 1);
      const { episodes, status, error, retry } = useSeason(detail.id, season);
      const { play } = useTitleNav();
      const rail = useRail();
      return (
            <section className="jh-row jh-episodes" aria-label="Episodes">
                  <div className="jh-seasons xp-scroll-x" role="tablist">
                        {seasons.map((entry) => (
                              <button key={entry.season_number} type="button" role="tab" aria-selected={entry.season_number === season} className={entry.season_number === season ? "is-active" : ""} onClick={() => setSeason(entry.season_number)}>
                                    Season {entry.season_number}
                              </button>
                        ))}
                  </div>
                  {status === "error" && <div className="jh-error"><span>{error}</span><button type="button" onClick={retry}>Retry</button></div>}
                  <div className="jh-row__rail xp-scroll-x" ref={rail.ref}>
                        {status === "loading" && Array.from({ length: 4 }).map((_, index) => <span key={index} className="jh-skel jh-skel--ep xp-skeleton" />)}
                        {episodes.map((episode) => (
                              <button key={episode.id} type="button" className="jh-ep" onClick={() => play(detail, season, episode.episode_number)}>
                                    <span className="jh-ep__art">
                                          <Img path={episode.still_path || detail.backdrop_path} size="w500" alt="" fallbackTitle={episode.name} />
                                          <span className="jh-ep__play"><Play size={18} fill="currentColor" /></span>
                                    </span>
                                    <span className="jh-ep__meta">S{season} E{episode.episode_number}{episode.air_date ? ` • ${new Date(episode.air_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : ""}{episode.runtime ? ` • ${episode.runtime}m` : ""}</span>
                                    <strong>{episode.name}</strong>
                                    <span className="jh-ep__overview">{episode.overview}</span>
                              </button>
                        ))}
                  </div>
            </section>
      );
}

export default function HotstarDetails({ mediaType }) {
      const { id } = useParams();
      const { status, data, error, retry } = useTitle(KEY, mediaType, id);
      const cert = useCertification(mediaType, id);
      const { play, trailer } = useTitleNav();
      const { has, toggle } = useMyList(KEY);
      useEffect(() => {
            if (data?.detail) document.title = `${titleOf(data.detail)} - Watch on JioHotster`;
      }, [data?.detail]);

      if (status === "loading") return <div className="jh-page"><section className="jh-hero"><div className="jh-hero__art xp-skeleton" /></section></div>;
      if (status === "error") return <div className="jh-page"><div className="jh-rows jh-rows--top"><div className="jh-error"><span>{error}</span><button type="button" onClick={retry}>Retry</button></div></div></div>;

      const { detail } = data;
      const title = titleOf(detail);
      const length = mediaType === "tv"
            ? `${detail.number_of_seasons} Season${detail.number_of_seasons > 1 ? "s" : ""}`
            : runtimeLabel(detail.runtime);
      const languages = (detail.spoken_languages || []).length;
      return (
            <div className="jh-page jh-detail">
                  <section className="jh-hero jh-hero--detail">
                        <div className="jh-hero__art"><Img path={detail.backdrop_path} size="w1280" alt="" eager fallbackTitle="" /></div>
                        <div className="jh-hero__shade" />
                        <div className="jh-hero__info">
                              {data.logo ? <Img path={data.logo} size="w500" alt={title} className="jh-hero__logo" eager /> : <h1 className="jh-hero__title">{title}</h1>}
                              <p className="jh-meta">
                                    {metaLine(detail, [length, languages > 1 ? `${languages} Languages` : null]).map((part) => <span key={part}>{part}</span>)}
                                    {cert && <span className="jh-cert">{cert}</span>}
                              </p>
                              <p className="jh-hero__overview jh-hero__overview--full">{detail.overview}</p>
                              <p className="jh-genres">{(detail.genres || []).slice(0, 4).map((genre) => genre.name).join(" | ")}</p>
                              <div className="jh-actions">
                                    <button type="button" className="jh-watch" onClick={() => play(detail)}><Play size={20} fill="currentColor" /> {mediaType === "tv" ? "Watch First Episode" : "Watch Now"}</button>
                                    <button type="button" className="jh-square" onClick={() => toggle(detail)} aria-label={has(detail) ? "Remove from Watchlist" : "Add to Watchlist"}>{has(detail) ? <Check size={22} /> : <Plus size={24} />}</button>
                                    {data.trailer && <button type="button" className="jh-square" onClick={() => trailer(detail)} aria-label="Watch trailer"><Clapperboard size={22} /></button>}
                              </div>
                        </div>
                  </section>
                  <div className="jh-rows">
                        {mediaType === "tv" && <Episodes detail={detail} />}
                        <HotstarRow title="More Like This" items={data.related} loading={data.relatedStatus === "loading"} />
                        {data.cast.length > 0 && (
                              <section className="jh-row" aria-label="Cast">
                                    <header className="jh-row__head"><h2>Cast</h2></header>
                                    <div className="jh-row__rail jh-cast xp-scroll-x">
                                          {data.cast.slice(0, 14).map((person) => (
                                                <div key={person.credit_id || person.id} className="jh-person">
                                                      <Img path={person.profile_path} size="w185" alt="" fallbackTitle={person.name.split(" ").map((part) => part[0]).join("").slice(0, 2)} />
                                                      <strong>{person.name}</strong>
                                                      <span>{person.character}</span>
                                                </div>
                                          ))}
                                    </div>
                              </section>
                        )}
                  </div>
                  <Outlet />
            </div>
      );
}
