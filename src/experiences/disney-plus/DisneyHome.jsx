import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Img from "../shared/Img";
import { progressOf, titleOf, useCatalogue, useInView, useInfiniteSentinel, useLogo, usePagedCatalogue, useWatchHistory } from "../shared/hooks";
import { useCarousel, useRail, useTitleNav } from "../shared/navigation";

const KEY = "disney";

// Franchise destinations (fictionalised names). Each opens a catalogue of
// titles from the studio's TMDB companies that are associated with Dizney+.
export const BRANDS = [
      { slug: "dizney", name: "Dizney", style: "script", companies: "2|6125", bg: "linear-gradient(180deg,#0b1d5a,#06123a)" },
      { slug: "pixl", name: "PIXL", style: "pixl", companies: "3", bg: "linear-gradient(180deg,#0a2a52,#020f22)" },
      { slug: "marvl", name: "MARVL", style: "marvl", companies: "420|7505", bg: "linear-gradient(180deg,#5a0a0f,#1b0204)" },
      { slug: "star-saga", name: "STAR SAGA", style: "saga", companies: "1", bg: "linear-gradient(180deg,#0f0f10,#000)" },
      { slug: "geo-wild", name: "GEO WILD", style: "geo", companies: "7521|4", bg: "linear-gradient(180deg,#1a1a1a,#000)" },
];

export function BrandWordmark({ brand, large = false }) {
      return <span className={`dp-brandmark dp-brandmark--${brand.style} ${large ? "is-large" : ""}`}>{brand.style === "geo" ? <><i />{brand.name}</> : brand.name}</span>;
}

/* ------------------------------------------------------------------ hero */
function HeroSlide({ item, active, onClick }) {
      const logo = useLogo(item.media_type, item.id, active);
      return (
            <button type="button" className={`dp-hero__slide ${active ? "is-active" : ""}`} onClick={onClick} aria-label={titleOf(item)} tabIndex={active ? 0 : -1}>
                  <Img path={item.backdrop_path} size="w1280" alt="" eager fallbackTitle={titleOf(item)} />
                  <span className="dp-hero__shade" />
                  <span className="dp-hero__logo">
                        {logo ? <Img path={logo} size="w500" alt="" /> : <strong>{titleOf(item)}</strong>}
                  </span>
            </button>
      );
}

export function DisneyHero({ items, loading }) {
      const slides = useMemo(() => (items || []).filter((item) => item.backdrop_path).slice(0, 8), [items]);
      const [index, go] = useCarousel(slides.length, 7000);
      const { open } = useTitleNav();
      if (!slides.length) return <section className="dp-hero"><div className={`dp-hero__track ${loading ? "" : ""}`}><span className="dp-hero__slide is-active xp-skeleton" /></div></section>;
      return (
            <section className="dp-hero" aria-roledescription="carousel">
                  <button type="button" className="dp-hero__arrow dp-hero__arrow--prev" onClick={() => go(index - 1)} aria-label="Previous"><ChevronLeft size={34} /></button>
                  <div className="dp-hero__track" style={{ transform: `translateX(calc(${-index} * (100% + 20px)))` }}>
                        {slides.map((item, slideIndex) => (
                              <HeroSlide key={item.id} item={item} active={slideIndex === index} onClick={() => (slideIndex === index ? open(item) : go(slideIndex))} />
                        ))}
                  </div>
                  <button type="button" className="dp-hero__arrow dp-hero__arrow--next" onClick={() => go(index + 1)} aria-label="Next"><ChevronRight size={34} /></button>
                  <div className="dp-hero__dots">
                        {slides.map((item, dot) => <button key={item.id} type="button" className={dot === index ? "is-active" : ""} onClick={() => go(dot)} aria-label={`Slide ${dot + 1}`} />)}
                  </div>
            </section>
      );
}

/* ----------------------------------------------------------------- tiles */
export function DisneyTile({ item, progress, portrait = false }) {
      const { open } = useTitleNav();
      const title = titleOf(item);
      return (
            <button type="button" className={`dp-tile ${portrait ? "dp-tile--portrait" : ""}`} onClick={() => open(item)} aria-label={title}>
                  <Img path={portrait ? item.poster_path : item.backdrop_path || item.poster_path} size={portrait ? "w342" : "w500"} alt="" fallbackTitle={title} />
                  {!portrait && <span className="dp-tile__title">{title}</span>}
                  {progress !== undefined && <span className="dp-progress"><span style={{ width: `${progress * 100}%` }} /></span>}
            </button>
      );
}

export function DisneyRow({ title, items, loading, error, onRetry, portrait, to, hasMore, onEnd, progress }) {
      const rail = useRail();
      useEffect(() => {
            if (rail.end && hasMore && !loading && items.length) onEnd?.();
      }, [rail.end, hasMore, loading, items.length, onEnd]);
      if (!loading && !error && !items.length) return null;
      return (
            <section className="dp-row" aria-label={title}>
                  <h2 className="dp-row__title">{to ? <Link to={to}>{title}</Link> : title}</h2>
                  {error && !items.length ? (
                        <div className="dp-error"><span>{error}</span><button type="button" onClick={onRetry}>RETRY</button></div>
                  ) : (
                        <div className="dp-row__wrap">
                              {!rail.start && <button type="button" className="dp-row__arrow dp-row__arrow--prev" onClick={() => rail.scroll(-1)} aria-label="Previous"><ChevronLeft size={32} /></button>}
                              <div className={`dp-row__rail xp-scroll-x ${portrait ? "is-portrait" : ""}`} ref={rail.ref}>
                                    {items.map((item) => <DisneyTile key={`${item.media_type}-${item.id}`} item={item} portrait={portrait} progress={progress ? progressOf(item) : undefined} />)}
                                    {loading && Array.from({ length: items.length ? 2 : 6 }).map((_, index) => <span key={`s${index}`} className={`dp-tile dp-tile--skel ${portrait ? "dp-tile--portrait" : ""} xp-skeleton`} />)}
                              </div>
                              {!rail.end && <button type="button" className="dp-row__arrow dp-row__arrow--next" onClick={() => rail.scroll(1)} aria-label="Next"><ChevronRight size={32} /></button>}
                        </div>
                  )}
            </section>
      );
}

export function CatalogueRow({ title, spec, portrait, to }) {
      const [target, setTarget] = useState(20);
      const { items, loading, error, retry, hasMore } = useCatalogue(KEY, spec, { target });
      return <DisneyRow title={title} items={items.slice(0, 60)} loading={loading && items.length < target} error={error} onRetry={retry} portrait={portrait} to={to} hasMore={hasMore && items.length < 60} onEnd={() => setTarget((current) => current + 20)} />;
}

export function Lazy({ children }) {
      const [ref, inView] = useInView({ rootMargin: "500px 0px" });
      return <div ref={ref} style={inView ? undefined : { minHeight: 220 }}>{inView && children}</div>;
}

export function DisneyGrid({ spec, items: given, portrait = false, empty = "No titles found." }) {
      const catalogue = usePagedCatalogue(KEY, spec || { types: ["movie"] }, { pageSize: 30, enabled: !given });
      const source = given ? { items: given, loading: false, hasMore: false } : catalogue;
      const sentinel = useInfiniteSentinel(() => !source.loading && source.hasMore && catalogue.loadMore(), !given && source.hasMore && !catalogue.error);
      return (
            <>
                  <div className={`dp-grid ${portrait ? "is-portrait" : ""}`}>
                        {source.items.map((item) => <DisneyTile key={`${item.media_type}-${item.id}`} item={item} portrait={portrait} />)}
                        {source.loading && Array.from({ length: source.items.length ? 5 : 15 }).map((_, index) => <span key={index} className={`dp-tile dp-tile--skel ${portrait ? "dp-tile--portrait" : ""} xp-skeleton`} />)}
                  </div>
                  {!source.loading && !source.items.length && !catalogue.error && <p className="dp-empty">{empty}</p>}
                  {!given && catalogue.error && <div className="dp-error"><span>{catalogue.error}</span><button type="button" onClick={catalogue.retry}>RETRY</button></div>}
                  <div ref={sentinel} />
                  {!given && source.hasMore && !source.loading && source.items.length > 0 && <button type="button" className="dp-loadmore" onClick={catalogue.loadMore}>LOAD MORE</button>}
            </>
      );
}

function BrandTiles() {
      return (
            <div className="dp-brands">
                  {BRANDS.map((brand) => (
                        <Link key={brand.slug} to={`/browse/${brand.slug}`} className="dp-brand" style={{ background: brand.bg }} aria-label={brand.name}>
                              <BrandWordmark brand={brand} />
                        </Link>
                  ))}
            </div>
      );
}

function ContinueRow() {
      const history = useWatchHistory(KEY);
      return history.length ? <DisneyRow title="Continue Watching" items={history} progress /> : null;
}

export function DisneyHome() {
      const hero = useCatalogue(KEY, { types: ["movie", "tv"], sort: "trending" }, { target: 20 });
      useEffect(() => { document.title = "Home | Dizney+"; }, []);
      const rows = [
            { title: "New to Dizney+", spec: { types: ["movie", "tv"], sort: "new", windowDays: 365 } },
            { title: "Trending", items: true },
            { title: "Series We Love", spec: { types: ["tv"], sort: "popular" }, portrait: true, to: "/tv" },
            { title: "Animated Favorites", spec: { types: ["movie"], sort: "popular", genres: "16" } },
            { title: "Marvl Cinematic Collection", spec: { types: ["movie", "tv"], sort: "popular", companies: "420|7505" }, to: "/browse/marvl" },
            { title: "Star Saga Adventures", spec: { types: ["movie", "tv"], sort: "popular", companies: "1" }, to: "/browse/star-saga" },
            { title: "Pixl Picks", spec: { types: ["movie"], sort: "popular", companies: "3" }, to: "/browse/pixl" },
            { title: "Hit Movies", spec: { types: ["movie"], sort: "top" }, portrait: true, to: "/trending" },
            { title: "Family Movie Night", spec: { types: ["movie"], sort: "popular", genres: "10751" } },
            { title: "Comedy Series", spec: { types: ["tv"], sort: "popular", genres: "35" } },
            { title: "Documentaries & Wildlife", spec: { types: ["movie", "tv"], sort: "popular", genres: "99" }, to: "/browse/geo-wild" },
            { title: "Action & Adventure", spec: { types: ["movie"], sort: "popular", genres: "28|12" } },
      ];
      return (
            <div className="dp-page">
                  <DisneyHero items={hero.items} loading={hero.loading} />
                  <BrandTiles />
                  <div className="dp-rows">
                        <ContinueRow />
                        {rows.map((row, index) =>
                              row.items ? <DisneyRow key="trending" title="Trending" items={hero.items.slice(8)} loading={hero.loading} error={hero.error} onRetry={hero.retry} hasMore={hero.hasMore} onEnd={() => hero.loadMore(20)} />
                                    : index < 1 ? <CatalogueRow key={row.title} {...row} /> : <Lazy key={row.title}><CatalogueRow {...row} /></Lazy>
                        )}
                  </div>
            </div>
      );
}
