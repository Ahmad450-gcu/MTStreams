import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronLeft, ChevronRight, Play, Plus } from "lucide-react";
import Img from "../shared/Img";
import { progressOf, titleOf, useCatalogue, useInView, useInfiniteSentinel, useLogo, useMyList, usePagedCatalogue, useWatchHistory, yearOf } from "../shared/hooks";
import { useCarousel, useRail, useTitleNav } from "../shared/navigation";
import { genreNames } from "../shared/services";

const KEY = "apple";

export const COLLECTIONS = [
      { slug: "comedy", label: "Comedy", spec: { types: ["tv", "movie"], genres: "35" }, bg: "linear-gradient(135deg,#ffb340,#ff6a3d)" },
      { slug: "drama", label: "Drama", spec: { types: ["tv", "movie"], genres: "18" }, bg: "linear-gradient(135deg,#5e5ce6,#2a2a72)" },
      { slug: "thriller", label: "Thriller", spec: { types: ["movie"], genres: "53" }, bg: "linear-gradient(135deg,#3a3a3c,#0b0b0c)" },
      { slug: "sci-fi", label: "Sci-Fi", spec: { types: ["tv", "movie"], genres: "878|10765" }, bg: "linear-gradient(135deg,#30d0c6,#0a6f86)" },
      { slug: "kids", label: "Kids & Family", spec: { types: ["tv", "movie"], genres: "10751" }, bg: "linear-gradient(135deg,#34c759,#1a7f3a)" },
      { slug: "docs", label: "Documentary", spec: { types: ["tv", "movie"], genres: "99" }, bg: "linear-gradient(135deg,#bf8f5a,#5b3d1e)" },
      { slug: "crime", label: "Crime", spec: { types: ["tv"], genres: "80" }, bg: "linear-gradient(135deg,#ff375f,#6e0b22)" },
      { slug: "animation", label: "Animation", spec: { types: ["tv", "movie"], genres: "16" }, bg: "linear-gradient(135deg,#64d2ff,#0a84ff)" },
];

/* ------------------------------------------------------------------ hero */
function HeroSlide({ item, active }) {
      const { play, open } = useTitleNav();
      const { has, toggle } = useMyList(KEY);
      const logo = useLogo(item.media_type, item.id, active);
      const title = titleOf(item);
      return (
            <div className={`at-hero__slide ${active ? "is-active" : ""}`} aria-hidden={!active}>
                  <Img path={item.backdrop_path} size="w1280" alt="" className="at-hero__img" eager={active} fallbackTitle="" />
                  <div className="at-hero__shade" />
                  <div className="at-hero__content">
                        {logo ? <Img path={logo} size="w500" alt={title} className="at-hero__logo" eager /> : <h2 className="at-hero__title">{title}</h2>}
                        <p className="at-hero__kicker">{[item.media_type === "tv" ? "Series" : "Film", genreNames(item, 1)[0]].filter(Boolean).join(" · ")}</p>
                        <p className="at-hero__synopsis">{item.overview}</p>
                        <div className="at-hero__actions">
                              <button type="button" className="at-btn at-btn--primary" onClick={() => play(item)} tabIndex={active ? 0 : -1}><Play size={16} fill="currentColor" /> {item.media_type === "tv" ? "Play S1, E1" : "Play"}</button>
                              <button type="button" className="at-btn at-btn--secondary" onClick={() => open(item)} tabIndex={active ? 0 : -1}>Details</button>
                              <button type="button" className="at-roundbtn" onClick={() => toggle(item)} aria-label="Add to Up Next" tabIndex={active ? 0 : -1}>{has(item) ? <Check size={18} /> : <Plus size={20} />}</button>
                        </div>
                  </div>
            </div>
      );
}

export function AppleHero({ items, loading }) {
      const slides = useMemo(() => (items || []).filter((item) => item.backdrop_path).slice(0, 6), [items]);
      const [index, go] = useCarousel(slides.length, 8000);
      if (!slides.length) return <section className={`at-hero ${loading ? "xp-skeleton" : ""}`} />;
      return (
            <section className="at-hero" aria-roledescription="carousel">
                  {slides.map((item, slideIndex) => <HeroSlide key={item.id} item={item} active={slideIndex === index} />)}
                  <button type="button" className="at-hero__paddle at-hero__paddle--prev" onClick={() => go(index - 1)} aria-label="Previous"><ChevronLeft size={26} /></button>
                  <button type="button" className="at-hero__paddle at-hero__paddle--next" onClick={() => go(index + 1)} aria-label="Next"><ChevronRight size={26} /></button>
                  <div className="at-hero__dots">
                        {slides.map((item, dot) => <button key={item.id} type="button" className={dot === index ? "is-active" : ""} onClick={() => go(dot)} aria-label={`Item ${dot + 1}`} />)}
                  </div>
            </section>
      );
}

/* --------------------------------------------------------------- lockups */
export function Lockup({ item, rank, progress, variant = "wide" }) {
      const { open, play } = useTitleNav();
      const title = titleOf(item);
      if (variant === "poster") {
            return (
                  <button type="button" className="at-lockup at-lockup--poster" onClick={() => open(item)} aria-label={title}>
                        <span className="at-lockup__art"><Img path={item.poster_path} size="w342" alt="" fallbackTitle={title} /></span>
                  </button>
            );
      }
      if (variant === "feature") {
            return (
                  <button type="button" className="at-lockup at-lockup--feature" onClick={() => open(item)} aria-label={title}>
                        <span className="at-lockup__art">
                              <Img path={item.backdrop_path} size="w1280" alt="" fallbackTitle={title} />
                              <span className="at-lockup__overlay">
                                    <small>{item.media_type === "tv" ? "SERIES" : "FILM"}</small>
                                    <strong>{title}</strong>
                                    <span>{item.overview}</span>
                              </span>
                        </span>
                  </button>
            );
      }
      return (
            <button type="button" className="at-lockup" onClick={() => (progress !== undefined ? play(item, item.season, item.episode) : open(item))} aria-label={title}>
                  <span className="at-lockup__art">
                        <Img path={item.backdrop_path || item.poster_path} size="w500" alt="" fallbackTitle={title} />
                        {progress !== undefined && <span className="at-progress"><span style={{ width: `${progress * 100}%` }} /></span>}
                  </span>
                  <span className="at-lockup__caption">
                        {rank && <span className="at-lockup__rank">{rank}</span>}
                        <span>
                              <span className="at-lockup__title">{title}</span>
                              <span className="at-lockup__sub">{progress !== undefined && item.season ? `S${item.season}, E${item.episode}` : [genreNames(item, 1)[0], yearOf(item)].filter(Boolean).join(" · ")}</span>
                        </span>
                  </span>
            </button>
      );
}

export function Shelf({ title, items, loading, error, onRetry, variant = "wide", ranked, to, hasMore, onEnd, progress }) {
      const rail = useRail();
      useEffect(() => {
            if (rail.end && hasMore && !loading && items.length) onEnd?.();
      }, [rail.end, hasMore, loading, items.length, onEnd]);
      if (!loading && !error && !items.length) return null;
      return (
            <section className={`at-shelf at-shelf--${variant}`} aria-label={title}>
                  <header className="at-shelf__head">
                        <h2>{to ? <Link to={to}>{title}<ChevronRight size={22} strokeWidth={2.6} /></Link> : title}</h2>
                  </header>
                  {error && !items.length ? (
                        <div className="at-error"><span>{error}</span><button type="button" onClick={onRetry}>Try Again</button></div>
                  ) : (
                        <div className="at-shelf__wrap">
                              {!rail.start && <button type="button" className="at-shelf__paddle at-shelf__paddle--prev" onClick={() => rail.scroll(-1)} aria-label="Previous"><ChevronLeft size={26} /></button>}
                              <div className="at-shelf__rail xp-scroll-x" ref={rail.ref}>
                                    {items.map((item, index) => <Lockup key={`${item.media_type}-${item.id}`} item={item} variant={variant} rank={ranked ? index + 1 : undefined} progress={progress ? progressOf(item) : undefined} />)}
                                    {loading && Array.from({ length: items.length ? 2 : 6 }).map((_, index) => <span key={`s${index}`} className={`at-lockup at-lockup--${variant} at-skel xp-skeleton`} />)}
                              </div>
                              {!rail.end && <button type="button" className="at-shelf__paddle at-shelf__paddle--next" onClick={() => rail.scroll(1)} aria-label="Next"><ChevronRight size={26} /></button>}
                        </div>
                  )}
            </section>
      );
}

export function CatalogueShelf({ title, spec, variant, ranked, limit, to }) {
      const [target, setTarget] = useState(limit || 20);
      const { items, loading, error, retry, hasMore } = useCatalogue(KEY, spec, { target });
      const shown = items.slice(0, limit || 60);
      return <Shelf title={title} items={shown} loading={loading && shown.length < (limit || target)} error={error} onRetry={retry} variant={variant} ranked={ranked} to={to} hasMore={!limit && hasMore && items.length < 60} onEnd={() => setTarget((current) => current + 20)} />;
}

export function Lazy({ children }) {
      const [ref, inView] = useInView({ rootMargin: "500px 0px" });
      return <div ref={ref} style={inView ? undefined : { minHeight: 280 }}>{inView && children}</div>;
}

export function AppleGrid({ spec, items: given, variant = "wide", empty = "Nothing here yet." }) {
      const catalogue = usePagedCatalogue(KEY, spec || { types: ["tv"] }, { pageSize: 30, enabled: !given });
      const source = given ? { items: given, loading: false, hasMore: false } : catalogue;
      const sentinel = useInfiniteSentinel(() => !source.loading && source.hasMore && catalogue.loadMore(), !given && source.hasMore && !catalogue.error);
      return (
            <>
                  <div className={`at-grid at-grid--${variant}`}>
                        {source.items.map((item) => <Lockup key={`${item.media_type}-${item.id}`} item={item} variant={variant} />)}
                        {source.loading && Array.from({ length: source.items.length ? 4 : 12 }).map((_, index) => <span key={index} className={`at-lockup at-lockup--${variant} at-skel xp-skeleton`} />)}
                  </div>
                  {!source.loading && !source.items.length && !catalogue.error && <p className="at-empty">{empty}</p>}
                  {!given && catalogue.error && <div className="at-error"><span>{catalogue.error}</span><button type="button" onClick={catalogue.retry}>Try Again</button></div>}
                  <div ref={sentinel} />
                  {!given && source.hasMore && !source.loading && source.items.length > 0 && <button type="button" className="at-loadmore" onClick={catalogue.loadMore}>Show More</button>}
            </>
      );
}

export function CollectionTiles() {
      return (
            <section className="at-shelf" aria-label="Browse by Collection">
                  <header className="at-shelf__head"><h2>Browse by Collection</h2></header>
                  <div className="at-shelf__rail xp-scroll-x">
                        {COLLECTIONS.map((collection) => (
                              <Link key={collection.slug} to={`/browse/${collection.slug}`} className="at-collection" style={{ background: collection.bg }}>{collection.label}</Link>
                        ))}
                  </div>
            </section>
      );
}

function UpNextShelf() {
      const history = useWatchHistory(KEY);
      return history.length ? <Shelf title="Continue Watching" items={history} progress /> : null;
}

export function AppleHome() {
      const hero = useCatalogue(KEY, { types: ["tv", "movie"], sort: "trending" }, { target: 16 });
      useEffect(() => { document.title = "Pear TV+"; }, []);
      return (
            <div className="at-page">
                  <AppleHero items={hero.items} loading={hero.loading} />
                  <div className="at-shelves">
                        <UpNextShelf />
                        <CatalogueShelf title="Top Chart: Pear TV+" spec={{ types: ["tv", "movie"], sort: "popular" }} ranked limit={10} />
                        <Shelf title="New Releases" items={hero.items.slice(6)} loading={hero.loading} error={hero.error} onRetry={hero.retry} hasMore={hero.hasMore} onEnd={() => hero.loadMore(20)} />
                        <Lazy><CatalogueShelf title="Spotlight" spec={{ types: ["tv"], sort: "top", minVotes: 300 }} variant="feature" limit={8} /></Lazy>
                        <Lazy><CatalogueShelf title="Acclaimed Series" spec={{ types: ["tv"], sort: "top" }} to="/tv" /></Lazy>
                        <Lazy><CatalogueShelf title="Feature Films" spec={{ types: ["movie"], sort: "popular" }} variant="poster" to="/trending" /></Lazy>
                        <CollectionTiles />
                        <Lazy><CatalogueShelf title="Comedy That Hits Home" spec={{ types: ["tv", "movie"], sort: "popular", genres: "35" }} to="/browse/comedy" /></Lazy>
                        <Lazy><CatalogueShelf title="Mind-Bending Sci-Fi" spec={{ types: ["tv", "movie"], sort: "popular", genres: "878|10765" }} to="/browse/sci-fi" /></Lazy>
                        <Lazy><CatalogueShelf title="Gripping Thrillers" spec={{ types: ["movie", "tv"], sort: "popular", genres: "53|9648" }} variant="poster" /></Lazy>
                        <Lazy><CatalogueShelf title="Documentaries" spec={{ types: ["tv", "movie"], sort: "popular", genres: "99" }} to="/browse/docs" /></Lazy>
                        <Lazy><CatalogueShelf title="For Kids & Family" spec={{ types: ["tv", "movie"], sort: "popular", genres: "10751|16" }} to="/browse/kids" /></Lazy>
                  </div>
            </div>
      );
}

