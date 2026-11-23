import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import Img from "../shared/Img";
import { progressOf, runtimeLabel, titleOf, useCatalogue, useInView, useInfiniteSentinel, useLogo, usePagedCatalogue, useTmdb, useWatchHistory, yearOf } from "../shared/hooks";
import { useCarousel, useRail, useTitleNav } from "../shared/navigation";
import { genreNames } from "../shared/services";

const KEY = "mgm";

export const COLLECTIONS = [
      { slug: "noir", title: "Shadows & Noir", tagline: "Crime, mystery and moral grey.", spec: { types: ["movie"], genres: "80|9648" } },
      { slug: "westerns", title: "The Frontier", tagline: "Westerns, old and new.", spec: { types: ["movie"], genres: "37" } },
      { slug: "epics", title: "Grand Epics", tagline: "History on the biggest canvas.", spec: { types: ["movie"], genres: "36|10752" } },
      { slug: "visions", title: "Sci-Fi Visions", tagline: "Futures imagined on film.", spec: { types: ["movie"], genres: "878" } },
      { slug: "classics", title: "Cinema Classics", tagline: "Films made before 1990.", spec: { types: ["movie"], sort: "season", from: "1920-01-01", to: "1989-12-31" } },
      { slug: "thrillers", title: "Edge of Your Seat", tagline: "Thrillers that never let go.", spec: { types: ["movie", "tv"], genres: "53" } },
];

export const collectionSpec = (collection, sort = "popular") => ({ sort, ...collection.spec, ...(collection.spec.sort ? {} : { sort }) });

/* ----------------------------------------------------------- letterbox hero */
function HeroSlide({ item, active }) {
      const logo = useLogo(item.media_type, item.id, active);
      return (
            <div className={`mg-hero__slide ${active ? "is-active" : ""}`} aria-hidden={!active}>
                  <Img path={item.backdrop_path} size="w1280" alt="" className="mg-hero__img" eager={active} fallbackTitle="" />
                  <div className="mg-hero__shade" />
                  <div className="mg-hero__content">
                        <span className="mg-kicker">{item.media_type === "tv" ? "Series" : "Feature Presentation"}</span>
                        {logo ? <Img path={logo} size="w500" alt={titleOf(item)} className="mg-hero__logo" eager /> : <h2 className="mg-hero__title">{titleOf(item)}</h2>}
                        <p className="mg-hero__meta">{[yearOf(item), ...genreNames(item, 2)].filter(Boolean).join("  ·  ")}</p>
                        <p className="mg-hero__synopsis">{item.overview}</p>
                  </div>
            </div>
      );
}

export function MgmHero({ items, loading }) {
      const slides = useMemo(() => (items || []).filter((item) => item.backdrop_path).slice(0, 5), [items]);
      const [index, go] = useCarousel(slides.length, 9000);
      const { play, open } = useTitleNav();
      const current = slides[index];
      if (!slides.length) return <section className={`mg-hero ${loading ? "xp-skeleton" : ""}`} />;
      return (
            <section className="mg-hero" aria-roledescription="carousel">
                  <div className="mg-hero__frame">
                        {slides.map((item, slideIndex) => <HeroSlide key={item.id} item={item} active={slideIndex === index} />)}
                  </div>
                  <div className="mg-hero__bar">
                        <div className="mg-hero__actions">
                              <button type="button" className="mg-btn mg-btn--gold" onClick={() => play(current)}><Play size={16} fill="currentColor" /> WATCH NOW</button>
                              <button type="button" className="mg-btn mg-btn--line" onClick={() => open(current)}>MORE INFO</button>
                        </div>
                        <div className="mg-hero__counter">
                              <button type="button" onClick={() => go(index - 1)} aria-label="Previous"><ChevronLeft size={18} /></button>
                              <span><strong>{String(index + 1).padStart(2, "0")}</strong> / {String(slides.length).padStart(2, "0")}</span>
                              <span className="mg-hero__line"><span key={index} /></span>
                              <button type="button" onClick={() => go(index + 1)} aria-label="Next"><ChevronRight size={18} /></button>
                        </div>
                  </div>
            </section>
      );
}

/* ----------------------------------------------------------------- cards */
export function MgmPoster({ item, progress }) {
      const { open } = useTitleNav();
      const title = titleOf(item);
      return (
            <button type="button" className="mg-poster" onClick={() => open(item)} aria-label={title}>
                  <span className="mg-poster__art">
                        <Img path={item.poster_path || item.backdrop_path} size="w342" alt="" fallbackTitle={title} />
                        {progress !== undefined && <span className="mg-progress"><span style={{ width: `${progress * 100}%` }} /></span>}
                  </span>
                  <span className="mg-poster__title">{title}</span>
                  <span className="mg-poster__year">{yearOf(item)}{item.media_type === "tv" ? " · Series" : ""}</span>
            </button>
      );
}

function CollectionCard({ collection }) {
      const { items } = useCatalogue(KEY, collectionSpec(collection), { target: 3 });
      return (
            <Link to={`/browse/${collection.slug}`} className="mg-collection">
                  <span className="mg-collection__strip">
                        {[0, 1, 2].map((slot) => (
                              <span key={slot} className="mg-collection__frame">{items[slot] && <Img path={items[slot].poster_path} size="w185" alt="" />}</span>
                        ))}
                  </span>
                  <span className="mg-collection__body">
                        <strong>{collection.title}</strong>
                        <small>{collection.tagline}</small>
                  </span>
            </Link>
      );
}

function FeatureSpotlight({ item }) {
      const { play, open } = useTitleNav();
      const detail = useTmdb(item ? `${item.media_type}/${item.id}` : null, {}, Boolean(item));
      const credits = useTmdb(item ? `${item.media_type}/${item.id}/credits` : null, {}, Boolean(item));
      if (!item) return null;
      const director = (credits.data?.crew || []).find((person) => person.job === "Director");
      return (
            <section className="mg-spotlight">
                  <div className="mg-spotlight__art"><Img path={item.backdrop_path} size="w1280" alt="" fallbackTitle={titleOf(item)} /></div>
                  <div className="mg-spotlight__body">
                        <span className="mg-kicker">Director&apos;s Spotlight</span>
                        <h2>{titleOf(item)}</h2>
                        {director && <p className="mg-spotlight__by">A film by {director.name}</p>}
                        <p className="mg-spotlight__meta">{[yearOf(item), runtimeLabel(detail.data?.runtime), ...genreNames(item, 2)].filter(Boolean).join("  ·  ")}</p>
                        <p className="mg-spotlight__text">{item.overview}</p>
                        <div className="mg-hero__actions">
                              <button type="button" className="mg-btn mg-btn--gold" onClick={() => play(item)}><Play size={16} fill="currentColor" /> WATCH NOW</button>
                              <button type="button" className="mg-btn mg-btn--line" onClick={() => open(item)}>MORE INFO</button>
                        </div>
                  </div>
            </section>
      );
}

export function MgmRow({ title, subtitle, items, loading, error, onRetry, to, hasMore, onEnd, progress }) {
      const rail = useRail();
      useEffect(() => {
            if (rail.end && hasMore && !loading && items.length) onEnd?.();
      }, [rail.end, hasMore, loading, items.length, onEnd]);
      if (!loading && !error && !items.length) return null;
      return (
            <section className="mg-row" aria-label={title}>
                  <header className="mg-row__head">
                        <div>
                              <h2>{title}</h2>
                              {subtitle && <p>{subtitle}</p>}
                        </div>
                        <div className="mg-row__tools">
                              {to && <Link to={to}>SEE ALL</Link>}
                              <button type="button" onClick={() => rail.scroll(-1)} disabled={rail.start} aria-label="Previous"><ChevronLeft size={18} /></button>
                              <button type="button" onClick={() => rail.scroll(1)} disabled={rail.end} aria-label="Next"><ChevronRight size={18} /></button>
                        </div>
                  </header>
                  {error && !items.length ? (
                        <div className="mg-error"><span>{error}</span><button type="button" onClick={onRetry}>TRY AGAIN</button></div>
                  ) : (
                        <div className="mg-row__rail xp-scroll-x" ref={rail.ref}>
                              {items.map((item) => <MgmPoster key={`${item.media_type}-${item.id}`} item={item} progress={progress ? progressOf(item) : undefined} />)}
                              {loading && Array.from({ length: items.length ? 2 : 7 }).map((_, index) => <span key={`s${index}`} className="mg-poster mg-skel xp-skeleton" />)}
                        </div>
                  )}
            </section>
      );
}

export function CatalogueRow({ title, subtitle, spec, to }) {
      const [target, setTarget] = useState(20);
      const { items, loading, error, retry, hasMore } = useCatalogue(KEY, spec, { target });
      return <MgmRow title={title} subtitle={subtitle} items={items.slice(0, 60)} loading={loading && items.length < target} error={error} onRetry={retry} to={to} hasMore={hasMore && items.length < 60} onEnd={() => setTarget((current) => current + 20)} />;
}

export function Lazy({ children }) {
      const [ref, inView] = useInView({ rootMargin: "500px 0px" });
      return <div ref={ref} style={inView ? undefined : { minHeight: 380 }}>{inView && children}</div>;
}

export function MgmGrid({ spec, items: given, empty = "Nothing in this collection yet." }) {
      const catalogue = usePagedCatalogue(KEY, spec || { types: ["movie"] }, { pageSize: 30, enabled: !given });
      const source = given ? { items: given, loading: false, hasMore: false } : catalogue;
      const sentinel = useInfiniteSentinel(() => !source.loading && source.hasMore && catalogue.loadMore(), !given && source.hasMore && !catalogue.error);
      return (
            <>
                  <div className="mg-grid">
                        {source.items.map((item) => <MgmPoster key={`${item.media_type}-${item.id}`} item={item} />)}
                        {source.loading && Array.from({ length: source.items.length ? 6 : 18 }).map((_, index) => <span key={index} className="mg-poster mg-skel xp-skeleton" />)}
                  </div>
                  {!source.loading && !source.items.length && !catalogue.error && <p className="mg-empty">{empty}</p>}
                  {!given && catalogue.error && <div className="mg-error"><span>{catalogue.error}</span><button type="button" onClick={catalogue.retry}>TRY AGAIN</button></div>}
                  <div ref={sentinel} />
                  {!given && source.hasMore && !source.loading && source.items.length > 0 && <button type="button" className="mg-loadmore" onClick={catalogue.loadMore}>LOAD MORE</button>}
            </>
      );
}

function Collections() {
      return (
            <section className="mg-row" aria-label="Collections">
                  <header className="mg-row__head"><div><h2>Curated Collections</h2><p>Hand-picked programmes from the vault.</p></div><div className="mg-row__tools"><Link to="/browse/collections">SEE ALL</Link></div></header>
                  <div className="mg-row__rail xp-scroll-x">
                        {COLLECTIONS.map((collection) => <CollectionCard key={collection.slug} collection={collection} />)}
                  </div>
            </section>
      );
}

function ContinueRow() {
      const history = useWatchHistory(KEY);
      return history.length ? <MgmRow title="Continue Watching" items={history} progress /> : null;
}

export function MgmHome() {
      const hero = useCatalogue(KEY, { types: ["movie", "tv"], sort: "trending" }, { target: 16 });
      const spotlight = useCatalogue(KEY, { types: ["movie"], sort: "top", minVotes: 1000 }, { target: 6 });
      useEffect(() => { document.title = "MGN+ | Movies & Series"; }, []);
      return (
            <div className="mg-page">
                  <MgmHero items={hero.items} loading={hero.loading} />
                  <div className="mg-rows">
                        <ContinueRow />
                        <MgmRow title="Now Showing" subtitle="What everyone is watching this week." items={hero.items.slice(5)} loading={hero.loading} error={hero.error} onRetry={hero.retry} hasMore={hero.hasMore} onEnd={() => hero.loadMore(20)} />
                        <CatalogueRow title="Prestige Series" subtitle="Acclaimed drama worth settling in for." spec={{ types: ["tv"], sort: "popular" }} to="/tv" />
                        <FeatureSpotlight item={spotlight.items[0]} />
                        <Lazy><Collections /></Lazy>
                        <Lazy><CatalogueRow title="Blockbuster Cinema" spec={{ types: ["movie"], sort: "popular", minVotes: 1000 }} to="/trending" /></Lazy>
                        <Lazy><CatalogueRow title="Cinema Classics" subtitle="Timeless films made before 1990." spec={collectionSpec(COLLECTIONS[4])} to="/browse/classics" /></Lazy>
                        <Lazy><CatalogueRow title="Shadows & Noir" spec={collectionSpec(COLLECTIONS[0])} to="/browse/noir" /></Lazy>
                        <Lazy><CatalogueRow title="Recently Added" spec={{ types: ["movie", "tv"], sort: "new" }} /></Lazy>
                        <Lazy><CatalogueRow title="Critics' Choice" subtitle="The highest-rated films in the library." spec={{ types: ["movie"], sort: "top" }} /></Lazy>
                        <Lazy><CatalogueRow title="Sci-Fi Visions" spec={collectionSpec(COLLECTIONS[3])} to="/browse/visions" /></Lazy>
                        <Lazy><CatalogueRow title="Westerns" spec={collectionSpec(COLLECTIONS[1])} to="/browse/westerns" /></Lazy>
                  </div>
            </div>
      );
}
