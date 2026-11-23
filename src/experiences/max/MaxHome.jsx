import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Play, Plus, Check } from "lucide-react";
import Img from "../shared/Img";
import {
      isRecent, progressOf, titleOf, useCatalogue, useCertification, useInView, useInfiniteSentinel, useLogo, useMyList,
      usePagedCatalogue, useWatchHistory, yearOf,
} from "../shared/hooks";
import { useCarousel, useRail, useTitleNav } from "../shared/navigation";
import { genreNames } from "../shared/services";

const KEY = "max";

export const BRANDS = [
      { slug: "hbx", label: "HBX", sub: "Original Series", spec: { types: ["tv"], sort: "top", networks: "49" }, bg: "linear-gradient(135deg,#1b1b1b,#000)" },
      { slug: "superheroes", label: "DC-verse", sub: "Heroes & Villains", spec: { types: ["movie", "tv"], sort: "popular", companies: "9993|128064|429" }, bg: "linear-gradient(135deg,#0047ff,#001b66)" },
      { slug: "studio", label: "WB Studio", sub: "Blockbusters", spec: { types: ["movie"], sort: "popular", companies: "174" }, bg: "linear-gradient(135deg,#0a2a6b,#5b8def)" },
      { slug: "animation", label: "Toons", sub: "Animation", spec: { types: ["tv", "movie"], sort: "popular", genres: "16" }, bg: "linear-gradient(135deg,#ff2d6f,#7a1fff)" },
      { slug: "docs", label: "Discover", sub: "Docs & Real Life", spec: { types: ["tv", "movie"], sort: "popular", genres: "99" }, bg: "linear-gradient(135deg,#0ea5e9,#0c4a6e)" },
      { slug: "reality", label: "Real", sub: "Reality & Lifestyle", spec: { types: ["tv"], sort: "popular", genres: "10764" }, bg: "linear-gradient(135deg,#f59e0b,#b45309)" },
];

/* ------------------------------------------------------------------ hero */
function HeroSlide({ item, active }) {
      const { play, open } = useTitleNav();
      const { has, toggle } = useMyList(KEY);
      const logo = useLogo(item.media_type, item.id, active);
      const cert = useCertification(item.media_type, item.id, active);
      const title = titleOf(item);
      const label = item.media_type === "tv" ? `${genreNames(item, 1)[0] || "Drama"} Series` : `${genreNames(item, 1)[0] || "Feature"} Film`;
      return (
            <div className={`mx-hero__slide ${active ? "is-active" : ""}`} aria-hidden={!active}>
                  <Img path={item.backdrop_path} size="w1280" alt="" className="mx-hero__img" eager={active} fallbackTitle="" />
                  <div className="mx-hero__shade" />
                  <div className="mx-hero__content">
                        <span className="mx-eyebrow">{label}</span>
                        {logo ? <Img path={logo} size="w500" alt={title} className="mx-hero__logo" eager /> : <h2 className="mx-hero__title">{title}</h2>}
                        <p className="mx-hero__meta">
                              {cert && <span className="mx-cert">{cert}</span>}
                              <span>{yearOf(item)}</span>
                              {genreNames(item, 2).map((genre) => <span key={genre}>{genre}</span>)}
                        </p>
                        <p className="mx-hero__synopsis">{item.overview}</p>
                        <div className="mx-hero__actions">
                              <button type="button" className="mx-btn mx-btn--play" onClick={() => play(item)} tabIndex={active ? 0 : -1}><Play size={20} fill="currentColor" /> {item.media_type === "tv" ? "Play S1 E1" : "Play"}</button>
                              <button type="button" className="mx-btn mx-btn--ghost" onClick={() => open(item)} tabIndex={active ? 0 : -1}>Details</button>
                              <button type="button" className="mx-iconbtn" onClick={() => toggle(item)} aria-label="My Stuff" tabIndex={active ? 0 : -1}>{has(item) ? <Check size={22} /> : <Plus size={22} />}</button>
                        </div>
                  </div>
            </div>
      );
}

export function MaxHero({ items, loading }) {
      const slides = useMemo(() => (items || []).filter((item) => item.backdrop_path).slice(0, 6), [items]);
      const [index, go] = useCarousel(slides.length, 8000);
      if (!slides.length) return <section className={`mx-hero ${loading ? "xp-skeleton" : ""}`} />;
      return (
            <section className="mx-hero" aria-roledescription="carousel">
                  {slides.map((item, slideIndex) => <HeroSlide key={item.id} item={item} active={slideIndex === index} />)}
                  <div className="mx-hero__pager">
                        <button type="button" onClick={() => go(index - 1)} aria-label="Previous"><ChevronLeft size={20} /></button>
                        {slides.map((item, dot) => (
                              <button key={item.id} type="button" className={`mx-hero__dot ${dot === index ? "is-active" : ""}`} onClick={() => go(dot)} aria-label={`Slide ${dot + 1}`}><span /></button>
                        ))}
                        <button type="button" onClick={() => go(index + 1)} aria-label="Next"><ChevronRight size={20} /></button>
                  </div>
            </section>
      );
}

/* ----------------------------------------------------------------- cards */
export function MaxTile({ item, progress }) {
      const { open } = useTitleNav();
      const title = titleOf(item);
      return (
            <button type="button" className="mx-tile" onClick={() => open(item)} aria-label={title}>
                  <span className="mx-tile__art">
                        <Img path={item.backdrop_path || item.poster_path} size="w500" alt="" fallbackTitle={title} />
                        {isRecent(item, 60) && <span className="mx-tile__flag">{item.media_type === "tv" ? "New Episode" : "Just Added"}</span>}
                        {progress !== undefined && <span className="mx-progress"><span style={{ width: `${progress * 100}%` }} /></span>}
                  </span>
                  <span className="mx-tile__title">{title}</span>
                  <span className="mx-tile__sub">{progress !== undefined && item.season ? `S${item.season} E${item.episode}` : genreNames(item, 1)[0] || (item.media_type === "tv" ? "Series" : "Movie")}</span>
            </button>
      );
}

function PosterTile({ item, rank }) {
      const { open } = useTitleNav();
      return (
            <button type="button" className={`mx-poster ${rank ? "mx-poster--ranked" : ""}`} onClick={() => open(item)} aria-label={titleOf(item)}>
                  {rank && <span className="mx-rank">{rank}</span>}
                  <span className="mx-poster__art"><Img path={item.poster_path} size="w342" alt="" fallbackTitle={titleOf(item)} /></span>
            </button>
      );
}

function SpotlightCard({ item }) {
      const { open, play } = useTitleNav();
      const logo = useLogo(item.media_type, item.id);
      return (
            <article className="mx-spot">
                  <button type="button" className="mx-spot__art" onClick={() => open(item)} aria-label={titleOf(item)}>
                        <Img path={item.backdrop_path} size="w1280" alt="" fallbackTitle={titleOf(item)} />
                  </button>
                  <div className="mx-spot__body">
                        {logo ? <Img path={logo} size="w300" alt={titleOf(item)} className="mx-spot__logo" /> : <h3>{titleOf(item)}</h3>}
                        <p>{item.overview}</p>
                        <button type="button" className="mx-btn mx-btn--play mx-btn--sm" onClick={() => play(item)}><Play size={16} fill="currentColor" /> Play</button>
                  </div>
            </article>
      );
}

/* ------------------------------------------------------------------ rows */
export function MaxRail({ title, items, loading, error, onRetry, kind = "tile", to, hasMore, onEnd, progress }) {
      const rail = useRail();
      useEffect(() => {
            if (rail.end && hasMore && !loading && items.length) onEnd?.();
      }, [rail.end, hasMore, loading, items.length, onEnd]);
      if (!loading && !error && !items.length) return null;
      return (
            <section className={`mx-row mx-row--${kind}`} aria-label={title}>
                  <header className="mx-row__head">
                        <h2>{to ? <Link to={to}>{title} <ChevronRight size={20} /></Link> : title}</h2>
                        <div className="mx-row__nav">
                              <button type="button" onClick={() => rail.scroll(-1)} disabled={rail.start} aria-label="Scroll left"><ChevronLeft size={20} /></button>
                              <button type="button" onClick={() => rail.scroll(1)} disabled={rail.end} aria-label="Scroll right"><ChevronRight size={20} /></button>
                        </div>
                  </header>
                  {error && !items.length ? (
                        <div className="mx-error"><span>{error}</span><button type="button" onClick={onRetry}>Try again</button></div>
                  ) : (
                        <div className="mx-row__rail xp-scroll-x" ref={rail.ref}>
                              {items.map((item, index) =>
                                    kind === "top10" ? <PosterTile key={item.id} item={item} rank={index + 1} />
                                          : kind === "poster" ? <PosterTile key={item.id} item={item} />
                                                : kind === "spotlight" ? <SpotlightCard key={item.id} item={item} />
                                                      : <MaxTile key={`${item.media_type}-${item.id}`} item={item} progress={progress ? progressOf(item) : undefined} />
                              )}
                              {loading && Array.from({ length: items.length ? 2 : 6 }).map((_, index) => <span key={`s${index}`} className={`mx-skel mx-skel--${kind} xp-skeleton`} />)}
                        </div>
                  )}
            </section>
      );
}

export function CatalogueRail({ title, spec, kind, limit, to }) {
      const [target, setTarget] = useState(kind === "top10" ? 10 : kind === "spotlight" ? 6 : 20);
      const { items, loading, error, retry, hasMore } = useCatalogue(KEY, spec, { target });
      const shown = items.slice(0, limit || 60);
      return (
            <MaxRail title={title} items={shown} loading={loading && shown.length < (limit || target)} error={error} onRetry={retry} kind={kind} to={to}
                  hasMore={!limit && hasMore && items.length < 60} onEnd={() => setTarget((current) => current + 20)} />
      );
}

export function Lazy({ children, height = 260 }) {
      const [ref, inView] = useInView({ rootMargin: "500px 0px" });
      return <div ref={ref} style={inView ? undefined : { minHeight: height }}>{inView && children}</div>;
}

function BrandRow() {
      return (
            <section className="mx-row" aria-label="Brands">
                  <header className="mx-row__head"><h2>Explore by Brand</h2></header>
                  <div className="mx-brands">
                        {BRANDS.map((brand) => (
                              <Link key={brand.slug} to={`/browse/${brand.slug}`} className="mx-brand" style={{ background: brand.bg }}>
                                    <strong>{brand.label}</strong>
                                    <span>{brand.sub}</span>
                              </Link>
                        ))}
                  </div>
            </section>
      );
}

export function MaxGrid({ spec, items: given, kind = "poster", empty = "Nothing here yet." }) {
      const catalogue = usePagedCatalogue(KEY, spec || { types: ["tv"] }, { pageSize: 30, enabled: !given });
      const source = given ? { items: given, loading: false, hasMore: false } : catalogue;
      const sentinel = useInfiniteSentinel(() => !source.loading && source.hasMore && catalogue.loadMore(), !given && source.hasMore && !catalogue.error);
      return (
            <>
                  <div className={`mx-grid mx-grid--${kind}`}>
                        {source.items.map((item) => (kind === "tile" ? <MaxTile key={`${item.media_type}-${item.id}`} item={item} /> : <PosterTile key={`${item.media_type}-${item.id}`} item={item} />))}
                        {source.loading && Array.from({ length: source.items.length ? 6 : 18 }).map((_, index) => <span key={index} className={`mx-skel mx-skel--${kind} xp-skeleton`} />)}
                  </div>
                  {!source.loading && !source.items.length && !catalogue.error && <p className="mx-empty">{empty}</p>}
                  {!given && catalogue.error && <div className="mx-error"><span>{catalogue.error}</span><button type="button" onClick={catalogue.retry}>Try again</button></div>}
                  <div ref={sentinel} />
                  {!given && source.hasMore && !source.loading && source.items.length > 0 && <button type="button" className="mx-loadmore" onClick={catalogue.loadMore}>Load more</button>}
            </>
      );
}

function ContinueRow() {
      const history = useWatchHistory(KEY);
      return history.length ? <MaxRail title="Continue Watching" items={history} progress /> : null;
}

export function MaxHome() {
      const hero = useCatalogue(KEY, { types: ["tv", "movie"], sort: "trending" }, { target: 16 });
      useEffect(() => { document.title = "HBX max | Home"; }, []);
      const rows = [
            { title: "Top 10 Series Today", spec: { types: ["tv"], sort: "trending" }, kind: "top10", limit: 10 },
            { title: "Just Added", spec: { types: ["tv", "movie"], sort: "new" } },
            { title: "Featured Series", spec: { types: ["tv"], sort: "top", minVotes: 1500 }, kind: "spotlight", limit: 6 },
            { brands: true },
            { title: "Award-Winning HBX Originals", spec: { types: ["tv"], sort: "top", networks: "49" }, kind: "poster", to: "/browse/hbx" },
            { title: "Top 10 Movies Today", spec: { types: ["movie"], sort: "trending" }, kind: "top10", limit: 10 },
            { title: "Blockbuster Movies", spec: { types: ["movie"], sort: "popular" }, to: "/trending" },
            { title: "Series Worth Binging", spec: { types: ["tv"], sort: "popular" }, to: "/tv" },
            { title: "Heroes & Villains", spec: { types: ["movie", "tv"], sort: "popular", companies: "9993|128064|429" }, to: "/browse/superheroes" },
            { title: "Crime & Mystery Series", spec: { types: ["tv"], sort: "popular", genres: "80" } },
            { title: "Critically Acclaimed Films", spec: { types: ["movie"], sort: "top" }, kind: "poster" },
            { title: "Comedy Series", spec: { types: ["tv"], sort: "popular", genres: "35" } },
            { title: "Animation", spec: { types: ["tv", "movie"], sort: "popular", genres: "16" }, to: "/browse/animation" },
            { title: "Docs & Real Life", spec: { types: ["tv", "movie"], sort: "popular", genres: "99" }, to: "/browse/docs" },
      ];
      return (
            <div className="mx-page">
                  <MaxHero items={hero.items} loading={hero.loading} />
                  <div className="mx-rows">
                        <ContinueRow />
                        <MaxRail title="Trending Now" items={hero.items.slice(6)} loading={hero.loading} error={hero.error} onRetry={hero.retry} hasMore={hero.hasMore} onEnd={() => hero.loadMore(20)} />
                        {rows.map((row, index) => (row.brands ? <BrandRow key="brands" /> : index < 2 ? <CatalogueRail key={row.title} {...row} /> : <Lazy key={row.title}><CatalogueRail {...row} /></Lazy>))}
                  </div>
            </div>
      );
}
