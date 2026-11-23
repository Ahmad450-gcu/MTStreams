import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Play, Plus, Check } from "lucide-react";
import Img from "../shared/Img";
import { progressOf, titleOf, useCatalogue, useCertification, useInView, useInfiniteSentinel, useLogo, useMyList, usePagedCatalogue, useWatchHistory, yearOf } from "../shared/hooks";
import { useCarousel, useRail, useTitleNav } from "../shared/navigation";
import { genreNames } from "../shared/services";

const KEY = "paramount";

export const BRANDS = [
      { slug: "cbx", name: "CBX", spec: { types: ["tv"], networks: "16" }, color: "#0b3fd6", shape: "eye" },
      { slug: "nickelodon", name: "nickelodon", spec: { types: ["tv"], networks: "13" }, color: "#ff6a00", shape: "splat" },
      { slug: "comedy-hub", name: "COMEDY HUB", spec: { types: ["tv"], networks: "47" }, color: "#ffd400", shape: "box" },
      { slug: "mtb", name: "MTB", spec: { types: ["tv"], networks: "33" }, color: "#ffffff", shape: "block" },
      { slug: "showtyme", name: "SHOWTYME", spec: { types: ["tv"], networks: "67" }, color: "#e11d2a", shape: "box" },
      { slug: "pictures", name: "Paramont Pictures", spec: { types: ["movie"], companies: "4" }, color: "#7dd3fc", shape: "mountain" },
];

/* ------------------------------------------------------------- marquee */
function MarqueeSlide({ item, active }) {
      const { play, open } = useTitleNav();
      const { has, toggle } = useMyList(KEY);
      const logo = useLogo(item.media_type, item.id, active);
      const cert = useCertification(item.media_type, item.id, active);
      const title = titleOf(item);
      return (
            <div className={`pp-marquee__slide ${active ? "is-active" : ""}`} aria-hidden={!active}>
                  <Img path={item.backdrop_path} size="w1280" alt="" className="pp-marquee__img" eager={active} fallbackTitle="" />
                  <div className="pp-marquee__shade" />
                  <div className="pp-marquee__content">
                        {logo ? <Img path={logo} size="w500" alt={title} className="pp-marquee__logo" eager /> : <h2 className="pp-marquee__title">{title}</h2>}
                        <p className="pp-marquee__meta">{[cert, yearOf(item), ...genreNames(item, 2)].filter(Boolean).join(" | ")}</p>
                        <p className="pp-marquee__synopsis">{item.overview}</p>
                        <div className="pp-marquee__actions">
                              <button type="button" className="pp-btn pp-btn--primary" onClick={() => play(item)} tabIndex={active ? 0 : -1}><Play size={18} fill="currentColor" /> WATCH NOW</button>
                              <button type="button" className="pp-btn pp-btn--secondary" onClick={() => open(item)} tabIndex={active ? 0 : -1}>MORE INFO</button>
                              <button type="button" className="pp-btn pp-btn--icon" onClick={() => toggle(item)} aria-label="My List" tabIndex={active ? 0 : -1}>{has(item) ? <Check size={20} /> : <Plus size={20} />}</button>
                        </div>
                  </div>
            </div>
      );
}

export function ParamountMarquee({ items, loading }) {
      const slides = useMemo(() => (items || []).filter((item) => item.backdrop_path).slice(0, 6), [items]);
      const [index, go] = useCarousel(slides.length, 7500);
      if (!slides.length) return <section className={`pp-marquee ${loading ? "xp-skeleton" : ""}`} />;
      return (
            <section className="pp-marquee" aria-roledescription="carousel">
                  {slides.map((item, slideIndex) => <MarqueeSlide key={item.id} item={item} active={slideIndex === index} />)}
                  <div className="pp-marquee__nav">
                        <button type="button" onClick={() => go(index - 1)} aria-label="Previous"><ChevronLeft size={24} /></button>
                        <div className="pp-marquee__thumbs">
                              {slides.map((item, thumb) => (
                                    <button key={item.id} type="button" className={thumb === index ? "is-active" : ""} onClick={() => go(thumb)} aria-label={titleOf(item)}>
                                          <Img path={item.poster_path} size="w154" alt="" />
                                    </button>
                              ))}
                        </div>
                        <button type="button" onClick={() => go(index + 1)} aria-label="Next"><ChevronRight size={24} /></button>
                  </div>
            </section>
      );
}

/* ----------------------------------------------------------------- tiles */
export function PosterCard({ item }) {
      const { open } = useTitleNav();
      return (
            <button type="button" className="pp-poster" onClick={() => open(item)} aria-label={titleOf(item)}>
                  <Img path={item.poster_path || item.backdrop_path} size="w342" alt="" fallbackTitle={titleOf(item)} />
            </button>
      );
}

function WideCard({ item, progress }) {
      const { open, play } = useTitleNav();
      return (
            <article className="pp-wide">
                  <button type="button" className="pp-wide__art" onClick={() => (progress !== undefined ? play(item, item.season, item.episode) : open(item))} aria-label={titleOf(item)}>
                        <Img path={item.backdrop_path || item.poster_path} size="w500" alt="" fallbackTitle={titleOf(item)} />
                        <span className="pp-wide__play"><Play size={20} fill="currentColor" /></span>
                        {progress !== undefined && <span className="pp-progress"><span style={{ width: `${progress * 100}%` }} /></span>}
                  </button>
                  <h3>{titleOf(item)}</h3>
                  <p>{item.season ? `S${item.season} E${item.episode}` : [yearOf(item), genreNames(item, 1)[0]].filter(Boolean).join(" • ")}</p>
            </article>
      );
}

export function ParamountRow({ title, items, loading, error, onRetry, to, hasMore, onEnd, wide, progress }) {
      const rail = useRail();
      useEffect(() => {
            if (rail.end && hasMore && !loading && items.length) onEnd?.();
      }, [rail.end, hasMore, loading, items.length, onEnd]);
      if (!loading && !error && !items.length) return null;
      return (
            <section className="pp-row" aria-label={title}>
                  <header className="pp-row__head">
                        <h2>{title}</h2>
                        {to && <Link to={to}>View All <ChevronRight size={16} /></Link>}
                  </header>
                  {error && !items.length ? (
                        <div className="pp-error"><span>{error}</span><button type="button" onClick={onRetry}>TRY AGAIN</button></div>
                  ) : (
                        <div className="pp-row__wrap">
                              {!rail.start && <button type="button" className="pp-row__arrow pp-row__arrow--prev" onClick={() => rail.scroll(-1)} aria-label="Previous"><ChevronLeft size={30} /></button>}
                              <div className="pp-row__rail xp-scroll-x" ref={rail.ref}>
                                    {items.map((item) => (wide ? <WideCard key={`${item.media_type}-${item.id}`} item={item} progress={progress ? progressOf(item) : undefined} /> : <PosterCard key={`${item.media_type}-${item.id}`} item={item} />))}
                                    {loading && Array.from({ length: items.length ? 2 : 8 }).map((_, index) => <span key={`s${index}`} className={`${wide ? "pp-skel-wide" : "pp-poster"} xp-skeleton`} />)}
                              </div>
                              {!rail.end && <button type="button" className="pp-row__arrow pp-row__arrow--next" onClick={() => rail.scroll(1)} aria-label="Next"><ChevronRight size={30} /></button>}
                        </div>
                  )}
            </section>
      );
}

export function CatalogueRow({ title, spec, to, wide }) {
      const [target, setTarget] = useState(20);
      const { items, loading, error, retry, hasMore } = useCatalogue(KEY, spec, { target });
      return <ParamountRow title={title} items={items.slice(0, 60)} loading={loading && items.length < target} error={error} onRetry={retry} to={to} wide={wide} hasMore={hasMore && items.length < 60} onEnd={() => setTarget((current) => current + 20)} />;
}

export function Lazy({ children }) {
      const [ref, inView] = useInView({ rootMargin: "500px 0px" });
      return <div ref={ref} style={inView ? undefined : { minHeight: 300 }}>{inView && children}</div>;
}

export function ParamountGrid({ spec, items: given, empty = "No titles found." }) {
      const catalogue = usePagedCatalogue(KEY, spec || { types: ["tv"] }, { pageSize: 30, enabled: !given });
      const source = given ? { items: given, loading: false, hasMore: false } : catalogue;
      const sentinel = useInfiniteSentinel(() => !source.loading && source.hasMore && catalogue.loadMore(), !given && source.hasMore && !catalogue.error);
      return (
            <>
                  <div className="pp-grid">
                        {source.items.map((item) => <PosterCard key={`${item.media_type}-${item.id}`} item={item} />)}
                        {source.loading && Array.from({ length: source.items.length ? 7 : 21 }).map((_, index) => <span key={index} className="pp-poster xp-skeleton" />)}
                  </div>
                  {!source.loading && !source.items.length && !catalogue.error && <p className="pp-empty">{empty}</p>}
                  {!given && catalogue.error && <div className="pp-error"><span>{catalogue.error}</span><button type="button" onClick={catalogue.retry}>TRY AGAIN</button></div>}
                  <div ref={sentinel} />
                  {!given && source.hasMore && !source.loading && source.items.length > 0 && <button type="button" className="pp-loadmore" onClick={catalogue.loadMore}>LOAD MORE</button>}
            </>
      );
}

export function BrandMark({ brand }) {
      return <span className={`pp-brandmark pp-brandmark--${brand.shape}`} style={{ "--brand": brand.color }}>{brand.name}</span>;
}

function BrandRow() {
      return (
            <section className="pp-row" aria-label="Brands">
                  <header className="pp-row__head"><h2>Brands</h2><Link to="/browse/brands">View All <ChevronRight size={16} /></Link></header>
                  <div className="pp-row__rail pp-brands xp-scroll-x">
                        {BRANDS.map((brand) => (
                              <Link key={brand.slug} to={`/browse/${brand.slug}`} className="pp-brand"><BrandMark brand={brand} /></Link>
                        ))}
                  </div>
            </section>
      );
}

function KeepWatching() {
      const history = useWatchHistory(KEY);
      return history.length ? <ParamountRow title="Keep Watching" items={history} wide progress /> : null;
}

export function ParamountHome() {
      const hero = useCatalogue(KEY, { types: ["tv", "movie"], sort: "trending" }, { target: 16 });
      useEffect(() => { document.title = "Paramont+ | Stream Live TV, Movies & Shows"; }, []);
      const rows = [
            { title: "Popular Shows", spec: { types: ["tv"], sort: "popular" }, to: "/tv" },
            { brands: true },
            { title: "Trending Movies", spec: { types: ["movie"], sort: "trending" }, to: "/trending" },
            { title: "New Episodes", spec: { types: ["tv"], sort: "airing", windowDays: 21 }, wide: true },
            { title: "Hit Movies", spec: { types: ["movie"], sort: "popular", minVotes: 800 } },
            { title: "Crime Dramas", spec: { types: ["tv"], sort: "popular", genres: "80" } },
            { title: "Reality TV Favorites", spec: { types: ["tv"], sort: "popular", genres: "10764" } },
            { title: "Action Movies", spec: { types: ["movie"], sort: "popular", genres: "28" } },
            { title: "Kids & Family", spec: { types: ["tv", "movie"], sort: "popular", genres: "10751" }, wide: true },
            { title: "Comedy Shows", spec: { types: ["tv"], sort: "popular", genres: "35" } },
            { title: "Critically Acclaimed Movies", spec: { types: ["movie"], sort: "top" } },
            { title: "Sci-Fi Universe", spec: { types: ["tv", "movie"], sort: "popular", genres: "878|10765" } },
      ];
      return (
            <div className="pp-page">
                  <ParamountMarquee items={hero.items} loading={hero.loading} />
                  <div className="pp-rows">
                        <KeepWatching />
                        <ParamountRow title="Trending Now" items={hero.items.slice(6)} loading={hero.loading} error={hero.error} onRetry={hero.retry} hasMore={hero.hasMore} onEnd={() => hero.loadMore(20)} />
                        {rows.map((row, index) => (row.brands ? <BrandRow key="brands" /> : index < 1 ? <CatalogueRow key={row.title} {...row} /> : <Lazy key={row.title}><CatalogueRow {...row} /></Lazy>))}
                  </div>
            </div>
      );
}
