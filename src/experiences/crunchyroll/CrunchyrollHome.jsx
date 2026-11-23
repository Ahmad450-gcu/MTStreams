import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, Info, Play, Star } from "lucide-react";
import Img from "../shared/Img";
import { progressOf, titleOf, useCatalogue, useCertification, useInView, useInfiniteSentinel, useLogo, useMyList, usePagedCatalogue, useTmdb, useWatchHistory, yearOf } from "../shared/hooks";
import { useCarousel, useRail, useTitleNav } from "../shared/navigation";

const KEY = "crunchyroll";

/* --------------------------------------------------------- anime seasons */
const SEASON_NAMES = ["Winter", "Spring", "Summer", "Fall"];

export function animeSeason(offset = 0, now = new Date()) {
      const index = Math.floor(now.getMonth() / 3) + offset;
      const year = now.getFullYear() + Math.floor(index / 4);
      const quarter = ((index % 4) + 4) % 4;
      const startMonth = quarter * 3;
      const pad = (value) => String(value).padStart(2, "0");
      const lastDay = new Date(year, startMonth + 3, 0).getDate();
      return {
            key: `${SEASON_NAMES[quarter].toLowerCase()}-${year}`,
            label: `${SEASON_NAMES[quarter]} ${year}`,
            from: `${year}-${pad(startMonth + 1)}-01`,
            to: `${year}-${pad(startMonth + 3)}-${pad(lastDay)}`,
      };
}

export const simulcastSpec = (season) => ({ types: ["tv"], sort: "season", airDates: true, from: season.from, to: season.to, genres: "16", language: "ja", ignoreCandidateFilter: true });

export const ANIME_GENRES = [
      ["10759", "Action & Adventure"], ["35", "Comedy"], ["18", "Drama"], ["10765", "Fantasy & Sci-Fi"], ["9648", "Mystery"], ["80", "Crime"], ["10751", "Family"], ["10762", "Kids"],
];

export const genreSpec = (id, sort = "popular") => ({ types: ["tv"], sort, genres: `16,${id}`, language: "ja", ignoreCandidateFilter: true });

/* ------------------------------------------------------------------ hero */
function HeroSlide({ item, active }) {
      const { play, open } = useTitleNav();
      const { has, toggle } = useMyList(KEY);
      const logo = useLogo(item.media_type, item.id, active);
      const cert = useCertification(item.media_type, item.id, active);
      const title = titleOf(item);
      return (
            <div className={`cr-hero__slide ${active ? "is-active" : ""}`} aria-hidden={!active}>
                  <Img path={item.backdrop_path} size="w1280" alt="" className="cr-hero__img" eager={active} fallbackTitle="" />
                  <div className="cr-hero__shade" />
                  <div className="cr-hero__content">
                        {logo ? <Img path={logo} size="w500" alt={title} className="cr-hero__logo" eager /> : <h2 className="cr-hero__title">{title}</h2>}
                        <p className="cr-hero__meta">
                              {cert && <span className="cr-cert">{cert}</span>}
                              <span>{item.media_type === "tv" ? "Series" : "Movie"}</span>
                              <span>{yearOf(item)}</span>
                        </p>
                        <p className="cr-hero__synopsis">{item.overview}</p>
                        <div className="cr-hero__actions">
                              <button type="button" className="cr-btn cr-btn--primary" onClick={() => play(item)} tabIndex={active ? 0 : -1}><Play size={20} fill="currentColor" /> {item.media_type === "tv" ? "START WATCHING S1 E1" : "WATCH NOW"}</button>
                              <button type="button" className="cr-btn cr-btn--outline cr-btn--square" onClick={() => toggle(item)} aria-label="Add to Watchlist" tabIndex={active ? 0 : -1}>{has(item) ? <BookmarkCheck size={22} /> : <Bookmark size={22} />}</button>
                              <button type="button" className="cr-btn cr-btn--text" onClick={() => open(item)} tabIndex={active ? 0 : -1}>MORE DETAILS</button>
                        </div>
                  </div>
            </div>
      );
}

export function CrunchyHero({ items, loading }) {
      const slides = useMemo(() => (items || []).filter((item) => item.backdrop_path).slice(0, 6), [items]);
      const [index, go] = useCarousel(slides.length, 8000);
      if (!slides.length) return <section className={`cr-hero ${loading ? "xp-skeleton" : ""}`} />;
      return (
            <section className="cr-hero" aria-roledescription="carousel">
                  {slides.map((item, slideIndex) => <HeroSlide key={item.id} item={item} active={slideIndex === index} />)}
                  <button type="button" className="cr-hero__arrow cr-hero__arrow--prev" onClick={() => go(index - 1)} aria-label="Previous"><ChevronLeft size={32} /></button>
                  <button type="button" className="cr-hero__arrow cr-hero__arrow--next" onClick={() => go(index + 1)} aria-label="Next"><ChevronRight size={32} /></button>
                  <div className="cr-hero__bars">
                        {slides.map((item, bar) => (
                              <button key={item.id} type="button" className={`${bar === index ? "is-active" : ""} ${bar < index ? "is-done" : ""}`} onClick={() => go(bar)} aria-label={`Slide ${bar + 1}`}><span /></button>
                        ))}
                  </div>
            </section>
      );
}

/* ----------------------------------------------------------------- cards */
export function SeriesCard({ item }) {
      const { open, play } = useTitleNav();
      const { has, toggle } = useMyList(KEY);
      const title = titleOf(item);
      const rating = item.vote_average ? (item.vote_average / 2).toFixed(1) : null;
      return (
            <article className="cr-card">
                  <button type="button" className="cr-card__art" onClick={() => open(item)} aria-label={title}>
                        <Img path={item.poster_path || item.backdrop_path} size="w342" alt="" fallbackTitle={title} />
                  </button>
                  <div className="cr-card__hover">
                        <button type="button" className="cr-card__hoverbody" onClick={() => open(item)} tabIndex={-1}>
                              <strong>{title}</strong>
                              {rating && <span className="cr-card__rating">{rating} <Star size={12} fill="currentColor" /> {item.vote_count ? `(${item.vote_count >= 1000 ? `${(item.vote_count / 1000).toFixed(1)}k` : item.vote_count})` : ""}</span>}
                              <span className="cr-card__facts">{item.media_type === "tv" ? "Series" : "Movie"}{yearOf(item) ? ` · ${yearOf(item)}` : ""}</span>
                              <span className="cr-card__desc">{item.overview}</span>
                        </button>
                        <div className="cr-card__icons">
                              <button type="button" onClick={() => play(item)} aria-label={`Play ${title}`}><Play size={20} fill="currentColor" /></button>
                              <button type="button" onClick={() => toggle(item)} aria-label="Watchlist">{has(item) ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}</button>
                              <button type="button" onClick={() => open(item)} aria-label="Details"><Info size={20} /></button>
                        </div>
                  </div>
                  <h4 className="cr-card__title">{title}</h4>
                  <p className="cr-card__type">{item.media_type === "tv" ? "Series" : "Movie"}</p>
            </article>
      );
}

const timeAgo = (date) => {
      if (!date) return "";
      const days = Math.max(0, Math.round((Date.now() - new Date(date).getTime()) / 86400000));
      if (days === 0) return "Today";
      if (days === 1) return "1 day ago";
      if (days < 30) return `${days} days ago`;
      return new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

/** "Newly added episode" card: shows the series' latest aired episode. */
function EpisodeCard({ item }) {
      const { play } = useTitleNav();
      const { data } = useTmdb(`tv/${item.id}`, {}, true);
      const episode = data?.last_episode_to_air;
      const label = episode ? `S${episode.season_number} E${episode.episode_number} - ${episode.name}` : "Latest episode";
      return (
            <button type="button" className="cr-episode" onClick={() => play(item, episode?.season_number, episode?.episode_number)} aria-label={`${titleOf(item)} ${label}`}>
                  <span className="cr-episode__art">
                        <Img path={episode?.still_path || item.backdrop_path} size="w500" alt="" fallbackTitle={titleOf(item)} />
                        {episode?.runtime ? <span className="cr-episode__time">{episode.runtime}m</span> : null}
                        <span className="cr-episode__play"><Play size={26} fill="currentColor" /></span>
                  </span>
                  <span className="cr-episode__series">{titleOf(item)}</span>
                  <span className="cr-episode__name">{label}</span>
                  <span className="cr-episode__when">{timeAgo(episode?.air_date)}</span>
            </button>
      );
}

function ContinueCard({ item }) {
      const { play } = useTitleNav();
      return (
            <button type="button" className="cr-episode" onClick={() => play(item, item.season, item.episode)} aria-label={titleOf(item)}>
                  <span className="cr-episode__art">
                        <Img path={item.backdrop_path || item.poster_path} size="w500" alt="" fallbackTitle={titleOf(item)} />
                        <span className="cr-episode__play"><Play size={26} fill="currentColor" /></span>
                        <span className="cr-progress"><span style={{ width: `${progressOf(item) * 100}%` }} /></span>
                  </span>
                  <span className="cr-episode__series">{titleOf(item)}</span>
                  <span className="cr-episode__name">{item.season ? `S${item.season} E${item.episode}` : "Movie"}</span>
            </button>
      );
}

export function CrunchyRow({ title, items, loading, error, onRetry, kind = "series", to, subtitle, hasMore, onEnd }) {
      const rail = useRail();
      useEffect(() => {
            if (rail.end && hasMore && !loading && items.length) onEnd?.();
      }, [rail.end, hasMore, loading, items.length, onEnd]);
      if (!loading && !error && !items.length) return null;
      return (
            <section className={`cr-row cr-row--${kind}`} aria-label={title}>
                  <header className="cr-row__head">
                        <div>
                              <h2>{title}</h2>
                              {subtitle && <p>{subtitle}</p>}
                        </div>
                        {to && <Link to={to} className="cr-row__all">VIEW ALL <ChevronRight size={16} /></Link>}
                  </header>
                  {error && !items.length ? (
                        <div className="cr-error"><span>{error}</span><button type="button" onClick={onRetry}>TRY AGAIN</button></div>
                  ) : (
                        <div className="cr-row__wrap">
                              {!rail.start && <button type="button" className="cr-row__arrow cr-row__arrow--prev" onClick={() => rail.scroll(-1)} aria-label="Previous"><ChevronLeft size={30} /></button>}
                              <div className="cr-row__rail xp-scroll-x" ref={rail.ref}>
                                    {items.map((item) => (kind === "episode" ? <EpisodeCard key={item.id} item={item} /> : kind === "continue" ? <ContinueCard key={`${item.media_type}-${item.id}`} item={item} /> : <SeriesCard key={`${item.media_type}-${item.id}`} item={item} />))}
                                    {loading && Array.from({ length: items.length ? 2 : 6 }).map((_, index) => <span key={`s${index}`} className={`cr-skel cr-skel--${kind} xp-skeleton`} />)}
                              </div>
                              {!rail.end && <button type="button" className="cr-row__arrow cr-row__arrow--next" onClick={() => rail.scroll(1)} aria-label="Next"><ChevronRight size={30} /></button>}
                        </div>
                  )}
            </section>
      );
}

export function CatalogueRow({ title, subtitle, spec, kind, limit, to }) {
      const [target, setTarget] = useState(limit || 20);
      const { items, loading, error, retry, hasMore } = useCatalogue(KEY, spec, { target });
      const shown = items.slice(0, limit || 60);
      return <CrunchyRow title={title} subtitle={subtitle} items={shown} loading={loading && shown.length < (limit || target)} error={error} onRetry={retry} kind={kind} to={to} hasMore={!limit && hasMore && items.length < 60} onEnd={() => setTarget((current) => current + 20)} />;
}

export function Lazy({ children }) {
      const [ref, inView] = useInView({ rootMargin: "500px 0px" });
      return <div ref={ref} style={inView ? undefined : { minHeight: 380 }}>{inView && children}</div>;
}

export function CrunchyGrid({ spec, items: given, empty = "No anime found." }) {
      const catalogue = usePagedCatalogue(KEY, spec || { types: ["tv"] }, { pageSize: 30, enabled: !given });
      const source = given ? { items: given, loading: false, hasMore: false } : catalogue;
      const sentinel = useInfiniteSentinel(() => !source.loading && source.hasMore && catalogue.loadMore(), !given && source.hasMore && !catalogue.error);
      return (
            <>
                  <div className="cr-grid">
                        {source.items.map((item) => <SeriesCard key={`${item.media_type}-${item.id}`} item={item} />)}
                        {source.loading && Array.from({ length: source.items.length ? 6 : 18 }).map((_, index) => <span key={index} className="cr-skel cr-skel--series xp-skeleton" />)}
                  </div>
                  {!source.loading && !source.items.length && !catalogue.error && <p className="cr-empty">{empty}</p>}
                  {!given && catalogue.error && <div className="cr-error"><span>{catalogue.error}</span><button type="button" onClick={catalogue.retry}>TRY AGAIN</button></div>}
                  <div ref={sentinel} />
                  {!given && source.hasMore && !source.loading && source.items.length > 0 && <button type="button" className="cr-loadmore" onClick={catalogue.loadMore}>LOAD MORE</button>}
            </>
      );
}

function GenreTiles() {
      const colors = ["#f47521", "#ff4e6a", "#7c5cff", "#00b3a4", "#2f80ed", "#c2410c", "#16a34a", "#eab308"];
      return (
            <section className="cr-row" aria-label="Browse by genre">
                  <header className="cr-row__head"><div><h2>Browse by Genre</h2></div></header>
                  <div className="cr-genres">
                        {ANIME_GENRES.map(([id, name], index) => (
                              <Link key={id} to={`/tv?genre=${id}`} className="cr-genre" style={{ "--g": colors[index] }}>{name}</Link>
                        ))}
                  </div>
            </section>
      );
}

function ContinueRow() {
      const history = useWatchHistory(KEY);
      return history.length ? <CrunchyRow title="Continue Watching" items={history} kind="continue" /> : null;
}

export function CrunchyHome() {
      const season = animeSeason(0);
      const hero = useCatalogue(KEY, { types: ["tv"], sort: "trending" }, { target: 16 });
      useEffect(() => { document.title = "crunchyreel: Watch Popular Anime Online"; }, []);
      return (
            <div className="cr-page">
                  <CrunchyHero items={hero.items} loading={hero.loading} />
                  <div className="cr-rows">
                        <ContinueRow />
                        <CatalogueRow title={`${season.label} Simulcast Season`} subtitle="New episodes as they air in Japan." spec={simulcastSpec(season)} to="/browse/simulcast" />
                        <CatalogueRow title="Newly Added Episodes" spec={{ types: ["tv"], sort: "airing", windowDays: 10, genres: "16", language: "ja", ignoreCandidateFilter: true }} kind="episode" limit={12} />
                        <Lazy><CrunchyRow title="Most Popular" items={hero.items.slice(6)} loading={hero.loading} error={hero.error} onRetry={hero.retry} to="/tv" hasMore={hero.hasMore} onEnd={() => hero.loadMore(20)} /></Lazy>
                        <Lazy><CatalogueRow title="Top Rated Anime" spec={{ types: ["tv"], sort: "top", minVotes: 150 }} to="/tv?sort=top" /></Lazy>
                        <GenreTiles />
                        <Lazy><CatalogueRow title="Action & Adventure" spec={genreSpec("10759")} to="/tv?genre=10759" /></Lazy>
                        <Lazy><CatalogueRow title="Fantasy & Isekai Worlds" spec={genreSpec("10765")} to="/tv?genre=10765" /></Lazy>
                        <Lazy><CatalogueRow title="Anime Movies" spec={{ types: ["movie"], sort: "popular" }} to="/trending" /></Lazy>
                        <Lazy><CatalogueRow title="Comedy & Slice of Life" spec={genreSpec("35")} to="/tv?genre=35" /></Lazy>
                        <Lazy><CatalogueRow title={`Last Season: ${animeSeason(-1).label}`} spec={simulcastSpec(animeSeason(-1))} /></Lazy>
                        <Lazy><CatalogueRow title="Mystery & Thriller" spec={genreSpec("9648")} to="/tv?genre=9648" /></Lazy>
                  </div>
            </div>
      );
}
