import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Check, ChevronLeft, ChevronRight, Clapperboard, Info, Play, Plus } from "lucide-react";
import Img from "../shared/Img";
import {
      isRecent, progressOf, titleOf, useCatalogue, useCertification, useInView, useInfiniteSentinel, useLogo,
      useMyList, usePagedCatalogue, useWatchHistory, yearOf,
} from "../shared/hooks";
import { useCarousel, useRail, useTitleNav } from "../shared/navigation";
import { MOVIE_GENRES, TV_GENRES, genreNames } from "../shared/services";

const KEY = "prime";

export function IncludedBadge() {
      return (
            <span className="pv-included">
                  <span className="pv-included__check"><Check size={11} strokeWidth={4} /></span>
                  Included with prima
            </span>
      );
}

export const Rating = ({ value }) => (value > 0 ? <span className="pv-rating">TMDb {value.toFixed(1)}</span> : null);

/* ------------------------------------------------------------------ hero */
function HeroSlide({ item, active }) {
      const { play, open, trailer } = useTitleNav();
      const { has, toggle } = useMyList(KEY);
      const logo = useLogo(item.media_type, item.id, active);
      const cert = useCertification(item.media_type, item.id, active);
      const title = titleOf(item);
      return (
            <div className={`pv-hero__slide ${active ? "is-active" : ""}`} aria-hidden={!active}>
                  <div className="pv-hero__art">
                        <Img path={item.backdrop_path} size="w1280" alt="" eager={active} fallbackTitle="" />
                  </div>
                  <div className="pv-hero__content">
                        {logo ? <Img path={logo} size="w500" alt={title} className="pv-hero__logo" eager /> : <h2 className="pv-hero__title">{title}</h2>}
                        <IncludedBadge />
                        <div className="pv-hero__meta">
                              <Rating value={item.vote_average} />
                              <span>{yearOf(item)}</span>
                              {cert && <span className="pv-cert">{cert}</span>}
                              <span className="pv-tagbox">HD</span>
                        </div>
                        <p className="pv-hero__synopsis">{item.overview}</p>
                        <div className="pv-hero__actions">
                              <button type="button" className="pv-play" onClick={() => play(item)} tabIndex={active ? 0 : -1}>
                                    <span className="pv-play__icon"><Play size={22} fill="currentColor" /></span>
                                    <span>{item.media_type === "tv" ? "Play S1 E1" : "Play"}</span>
                              </button>
                              <button type="button" className="pv-roundbtn" onClick={() => trailer(item)} aria-label="Trailer" tabIndex={active ? 0 : -1}><Clapperboard size={22} /></button>
                              <button type="button" className="pv-roundbtn" onClick={() => toggle(item)} aria-label="Watchlist" tabIndex={active ? 0 : -1}>{has(item) ? <Check size={22} /> : <Plus size={24} />}</button>
                              <button type="button" className="pv-roundbtn" onClick={() => open(item)} aria-label="Details" tabIndex={active ? 0 : -1}><Info size={22} /></button>
                        </div>
                  </div>
            </div>
      );
}

export function PrimeHero({ items, loading }) {
      const slides = useMemo(() => (items || []).filter((item) => item.backdrop_path).slice(0, 7), [items]);
      const [paused, setPaused] = useState(false);
      const [index, go] = useCarousel(slides.length, 9000, paused);
      if (!slides.length) return <section className={`pv-hero ${loading ? "xp-skeleton" : ""}`} />;
      return (
            <section className="pv-hero" aria-roledescription="carousel" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
                  {slides.map((item, slideIndex) => <HeroSlide key={`${item.media_type}-${item.id}`} item={item} active={slideIndex === index} />)}
                  <button type="button" className="pv-hero__arrow pv-hero__arrow--prev" onClick={() => go(index - 1)} aria-label="Previous"><ChevronLeft size={36} /></button>
                  <button type="button" className="pv-hero__arrow pv-hero__arrow--next" onClick={() => go(index + 1)} aria-label="Next"><ChevronRight size={36} /></button>
                  <div className="pv-hero__dots">
                        {slides.map((item, dotIndex) => (
                              <button key={item.id} type="button" className={dotIndex === index ? "is-active" : ""} onClick={() => go(dotIndex)} aria-label={`Slide ${dotIndex + 1}`} />
                        ))}
                  </div>
            </section>
      );
}

/* ----------------------------------------------------------------- cards */
export function PrimeCard({ item, progress }) {
      const { open, play } = useTitleNav();
      const { has, toggle } = useMyList(KEY);
      const title = titleOf(item);
      return (
            <article className="pv-card">
                  <button type="button" className="pv-card__art" onClick={() => open(item)} aria-label={title}>
                        <Img path={item.backdrop_path || item.poster_path} size="w500" alt="" fallbackTitle={title} />
                        <span className="pv-card__title">{title}</span>
                        {progress !== undefined && <span className="pv-progress"><span style={{ width: `${progress * 100}%` }} /></span>}
                        {isRecent(item) && <span className="pv-card__flag">New</span>}
                  </button>
                  <div className="pv-card__panel">
                        <IncludedBadge />
                        <div className="pv-card__row">
                              <button type="button" className="pv-card__play" onClick={() => play(item)} aria-label={`Play ${title}`}><Play size={18} fill="currentColor" /></button>
                              <strong>{progress !== undefined ? "Resume" : "Play"}</strong>
                              <button type="button" className="pv-card__mini" onClick={() => toggle(item)} aria-label="Watchlist">{has(item) ? <Check size={18} /> : <Plus size={18} />}</button>
                              <button type="button" className="pv-card__mini" onClick={() => open(item)} aria-label="Details"><Info size={18} /></button>
                        </div>
                        <h4>{title}</h4>
                        <p className="pv-card__meta">
                              <Rating value={item.vote_average} /> <span>{yearOf(item)}</span> <span>{genreNames(item, 2).join(", ")}</span>
                        </p>
                        <p className="pv-card__synopsis">{item.overview}</p>
                  </div>
            </article>
      );
}

function TallCard({ item }) {
      const { open } = useTitleNav();
      return (
            <button type="button" className="pv-tall" onClick={() => open(item)} aria-label={titleOf(item)}>
                  <Img path={item.poster_path || item.backdrop_path} size="w500" alt="" fallbackTitle={titleOf(item)} />
                  <span className="pv-tall__badge">prima</span>
            </button>
      );
}

function Top10Card({ item, rank }) {
      const { open } = useTitleNav();
      return (
            <button type="button" className="pv-top10" onClick={() => open(item)} aria-label={`${rank}. ${titleOf(item)}`}>
                  <span className="pv-top10__num">{rank}</span>
                  <span className="pv-top10__art"><Img path={item.poster_path} size="w342" alt="" fallbackTitle={titleOf(item)} /></span>
            </button>
      );
}

/* ------------------------------------------------------------------ rows */
export function PrimeRail({ title, items, loading, error, onRetry, kind = "card", seeMore, onEnd, hasMore, progress }) {
      const rail = useRail();
      useEffect(() => {
            if (rail.end && hasMore && !loading && items.length) onEnd?.();
      }, [rail.end, hasMore, loading, items.length, onEnd]);
      if (!loading && !error && !items.length) return null;
      return (
            <section className={`pv-row pv-row--${kind}`} aria-label={title}>
                  <div className="pv-row__head">
                        <h2>{kind === "card" && <span className="pv-row__brand">prima</span>}{title}</h2>
                        {seeMore && <Link to={seeMore} className="pv-row__more">See more</Link>}
                  </div>
                  {error && !items.length ? (
                        <div className="pv-error"><span>{error}</span><button type="button" onClick={onRetry}>Retry</button></div>
                  ) : (
                        <div className="pv-row__wrap">
                              {!rail.start && <button type="button" className="pv-row__arrow pv-row__arrow--prev" onClick={() => rail.scroll(-1)} aria-label="Scroll left"><ChevronLeft size={34} /></button>}
                              <div className="pv-row__rail xp-scroll-x" ref={rail.ref}>
                                    {items.map((item, index) =>
                                          kind === "top10" ? <Top10Card key={`${item.media_type}-${item.id}`} item={item} rank={index + 1} />
                                                : kind === "tall" ? <TallCard key={`${item.media_type}-${item.id}`} item={item} />
                                                      : <PrimeCard key={`${item.media_type}-${item.id}`} item={item} progress={progress ? progressOf(item) : undefined} />
                                    )}
                                    {loading && Array.from({ length: items.length ? 2 : 6 }).map((_, index) => <span key={`s${index}`} className={`pv-skel pv-skel--${kind} xp-skeleton`} />)}
                              </div>
                              {!rail.end && <button type="button" className="pv-row__arrow pv-row__arrow--next" onClick={() => rail.scroll(1)} aria-label="Scroll right"><ChevronRight size={34} /></button>}
                        </div>
                  )}
            </section>
      );
}

export function CatalogueRail({ title, spec, kind, limit, seeMore }) {
      const [target, setTarget] = useState(kind === "top10" ? 10 : 20);
      const { items, loading, error, retry, hasMore } = useCatalogue(KEY, spec, { target });
      const shown = items.slice(0, limit || 60);
      return (
            <PrimeRail
                  title={title}
                  items={shown}
                  loading={loading && shown.length < (limit || target)}
                  error={error}
                  onRetry={retry}
                  kind={kind}
                  seeMore={seeMore}
                  hasMore={!limit && hasMore && items.length < 60}
                  onEnd={() => setTarget((current) => current + 20)}
            />
      );
}

function Lazy({ children, height = 240 }) {
      const [ref, inView] = useInView({ rootMargin: "500px 0px" });
      return <div ref={ref} style={inView ? undefined : { minHeight: height }}>{inView && children}</div>;
}

const GENRE_TILES = [
      ["28", "Action and adventure", "linear-gradient(135deg,#7a1a0b,#ff6b2c)"],
      ["35", "Comedy", "linear-gradient(135deg,#1a5cff,#22d3ee)"],
      ["18", "Drama", "linear-gradient(135deg,#3b0764,#a855f7)"],
      ["53", "Suspense", "linear-gradient(135deg,#111827,#475569)"],
      ["878", "Science fiction", "linear-gradient(135deg,#064e3b,#10b981)"],
      ["27", "Horror", "linear-gradient(135deg,#450a0a,#b91c1c)"],
      ["10749", "Romance", "linear-gradient(135deg,#831843,#f472b6)"],
      ["99", "Documentary", "linear-gradient(135deg,#713f12,#f59e0b)"],
      ["16", "Animation", "linear-gradient(135deg,#1e3a8a,#60a5fa)"],
      ["10751", "Kids and family", "linear-gradient(135deg,#065f46,#a3e635)"],
];

function GenreTiles() {
      const rail = useRail();
      return (
            <section className="pv-row pv-row--genres">
                  <div className="pv-row__head"><h2>Popular genres</h2><Link to="/browse/categories" className="pv-row__more">See more</Link></div>
                  <div className="pv-row__wrap">
                        <div className="pv-row__rail xp-scroll-x" ref={rail.ref}>
                              {GENRE_TILES.map(([id, name, bg]) => (
                                    <Link key={id} to={`/trending?genre=${id}`} className="pv-genretile" style={{ background: bg }}>{name}</Link>
                              ))}
                        </div>
                  </div>
            </section>
      );
}

function ContinueRow() {
      const history = useWatchHistory(KEY);
      if (!history.length) return null;
      return <PrimeRail title="Continue watching" items={history} progress />;
}

/* --------------------------------------------------------------- pages */
export function PrimeHome() {
      const hero = useCatalogue(KEY, { types: ["movie", "tv"], sort: "trending" }, { target: 20 });
      useEffect(() => { document.title = "prima video: Home"; }, []);
      const rows = [
            { title: "Top 10 on prima today", spec: { types: ["movie", "tv"], sort: "trending" }, kind: "top10", limit: 10 },
            { title: "Recommended movies", spec: { types: ["movie"], sort: "popular" }, seeMore: "/trending?view=all" },
            { title: "Recommended TV", spec: { types: ["tv"], sort: "popular" }, seeMore: "/tv?view=all" },
            { genres: true },
            { title: "Featured on prima", spec: { types: ["tv", "movie"], sort: "new", windowDays: 900, minVotes: 40 }, kind: "tall" },
            { title: "New releases", spec: { types: ["movie"], sort: "new" } },
            { title: "Action and adventure movies", spec: { types: ["movie"], sort: "popular", genres: "28" }, seeMore: "/trending?genre=28" },
            { title: "Critically acclaimed TV", spec: { types: ["tv"], sort: "top" } },
            { title: "Comedy movies", spec: { types: ["movie"], sort: "popular", genres: "35" }, seeMore: "/trending?genre=35" },
            { title: "Suspense and thriller", spec: { types: ["movie"], sort: "popular", genres: "53" }, seeMore: "/trending?genre=53" },
            { title: "Sci-fi and fantasy TV", spec: { types: ["tv"], sort: "popular", genres: "10765" }, seeMore: "/tv?genre=10765" },
            { title: "Movies we think you'll like", spec: { types: ["movie"], sort: "top" } },
            { title: "Kids and family", spec: { types: ["movie", "tv"], sort: "popular", genres: "10751" } },
            { title: "Documentaries", spec: { types: ["movie", "tv"], sort: "popular", genres: "99" } },
      ];
      return (
            <div className="pv-page">
                  <PrimeHero items={hero.items} loading={hero.loading} />
                  <div className="pv-rows">
                        <ContinueRow />
                        <PrimeRail title="Trending now" items={hero.items.slice(7)} loading={hero.loading} error={hero.error} onRetry={hero.retry} hasMore={hero.hasMore} onEnd={() => hero.loadMore(20)} />
                        {rows.map((row, index) =>
                              row.genres ? <GenreTiles key="genres" /> : index < 2 ? <CatalogueRail key={row.title} {...row} /> : <Lazy key={row.title} height={row.kind === "tall" ? 420 : 240}><CatalogueRail {...row} /></Lazy>
                        )}
                  </div>
            </div>
      );
}

export function PrimeGrid({ spec, items: given, emptyText = "No titles found." }) {
      const catalogue = usePagedCatalogue(KEY, spec || { types: ["movie"] }, { pageSize: 30, enabled: !given });
      const source = given ? { items: given, loading: false, hasMore: false, error: null } : catalogue;
      const sentinel = useInfiniteSentinel(() => !source.loading && source.hasMore && catalogue.loadMore(), !given && source.hasMore && !source.error);
      return (
            <>
                  <div className="pv-grid">
                        {source.items.map((item) => <PrimeCard key={`${item.media_type}-${item.id}`} item={item} />)}
                        {source.loading && Array.from({ length: source.items.length ? 4 : 16 }).map((_, index) => <span key={index} className="pv-skel pv-skel--card xp-skeleton" />)}
                  </div>
                  {!source.loading && !source.items.length && !source.error && <p className="pv-empty">{emptyText}</p>}
                  {source.error && <div className="pv-error"><span>{source.error}</span><button type="button" onClick={catalogue.retry}>Retry</button></div>}
                  <div ref={sentinel} />
                  {!given && source.hasMore && !source.loading && source.items.length > 0 && <button type="button" className="pv-loadmore" onClick={catalogue.loadMore}>Show more</button>}
            </>
      );
}

export function PrimeBrowse({ type }) {
      const [params, setParams] = useSearchParams();
      const genre = params.get("genre");
      const viewAll = params.get("view") === "all";
      const genres = type === "tv" ? TV_GENRES : MOVIE_GENRES;
      const noun = type === "tv" ? "TV shows" : "Movies";
      const hero = useCatalogue(KEY, { types: [type], sort: "trending" }, { target: 12, enabled: !genre && !viewAll });
      useEffect(() => { document.title = `prima video: ${noun}`; }, [noun]);

      const chips = (
            <div className="pv-chips xp-scroll-x">
                  <button type="button" className={!genre && !viewAll ? "is-active" : ""} onClick={() => setParams({})}>Featured</button>
                  <button type="button" className={viewAll && !genre ? "is-active" : ""} onClick={() => setParams({ view: "all" })}>All {noun.toLowerCase()}</button>
                  {Object.entries(genres).map(([id, name]) => (
                        <button key={id} type="button" className={genre === id ? "is-active" : ""} onClick={() => setParams({ genre: id })}>{name}</button>
                  ))}
            </div>
      );

      if (genre || viewAll) {
            return (
                  <div className="pv-page pv-page--padded">
                        <h1 className="pv-pagetitle">{genre ? `${genres[genre]} ${noun.toLowerCase()}` : noun}</h1>
                        {chips}
                        <PrimeGrid key={`${type}-${genre}`} spec={{ types: [type], sort: "popular", ...(genre ? { genres: genre } : {}) }} />
                  </div>
            );
      }

      const g = (id) => ({ types: [type], sort: "popular", genres: id });
      const rows = type === "tv"
            ? [["Top 10 TV shows", { types: ["tv"], sort: "trending" }, "top10"], ["Popular TV", { types: ["tv"], sort: "popular" }], ["New TV", { types: ["tv"], sort: "new" }], ["Drama TV", g("18")], ["Comedy TV", g("35")], ["Crime TV", g("80")], ["Sci-fi and fantasy TV", g("10765")], ["Reality TV", g("10764")], ["Top rated TV", { types: ["tv"], sort: "top" }]]
            : [["Top 10 movies", { types: ["movie"], sort: "trending" }, "top10"], ["Popular movies", { types: ["movie"], sort: "popular" }], ["New release movies", { types: ["movie"], sort: "new" }], ["Action movies", g("28")], ["Comedy movies", g("35")], ["Drama movies", g("18")], ["Horror movies", g("27")], ["Romance movies", g("10749")], ["Top rated movies", { types: ["movie"], sort: "top" }]];
      return (
            <div className="pv-page">
                  <PrimeHero items={hero.items} loading={hero.loading} />
                  <div className="pv-rows">
                        {chips}
                        {rows.map(([title, spec, kind], index) =>
                              index < 2 ? <CatalogueRail key={title} title={title} spec={spec} kind={kind} limit={kind ? 10 : undefined} seeMore={spec.genres ? `?genre=${spec.genres}` : "?view=all"} />
                                    : <Lazy key={title}><CatalogueRail title={title} spec={spec} seeMore={spec.genres ? `?genre=${spec.genres}` : "?view=all"} /></Lazy>
                        )}
                  </div>
            </div>
      );
}

export function PrimeCategories() {
      const navigate = useNavigate();
      useEffect(() => { document.title = "prima video: Categories"; }, []);
      return (
            <div className="pv-page pv-page--padded">
                  <h1 className="pv-pagetitle">Categories</h1>
                  <h2 className="pv-subtitle">Genres</h2>
                  <div className="pv-catgrid">
                        {GENRE_TILES.map(([id, name, bg]) => (
                              <button key={id} type="button" className="pv-genretile pv-genretile--big" style={{ background: bg }} onClick={() => navigate(`/trending?genre=${id}`)}>{name}</button>
                        ))}
                  </div>
                  <h2 className="pv-subtitle">TV genres</h2>
                  <div className="pv-catgrid">
                        {Object.entries(TV_GENRES).slice(0, 10).map(([id, name], index) => (
                              <button key={id} type="button" className="pv-genretile pv-genretile--big" style={{ background: GENRE_TILES[index % GENRE_TILES.length][2] }} onClick={() => navigate(`/tv?genre=${id}`)}>{name}</button>
                        ))}
                  </div>
            </div>
      );
}

export function PrimeMyStuff() {
      const { list } = useMyList(KEY);
      const history = useWatchHistory(KEY);
      const [tab, setTab] = useState("watchlist");
      useEffect(() => { document.title = "prima video: My Stuff"; }, []);
      return (
            <div className="pv-page pv-page--padded">
                  <h1 className="pv-pagetitle">My Stuff</h1>
                  <div className="pv-tabs" role="tablist">
                        <button type="button" role="tab" aria-selected={tab === "watchlist"} className={tab === "watchlist" ? "is-active" : ""} onClick={() => setTab("watchlist")}>Watchlist</button>
                        <button type="button" role="tab" aria-selected={tab === "history"} className={tab === "history" ? "is-active" : ""} onClick={() => setTab("history")}>Continue watching</button>
                  </div>
                  <PrimeGrid items={tab === "watchlist" ? list : history} emptyText={tab === "watchlist" ? "Your Watchlist is empty. Add movies and TV shows with the + button." : "Nothing in progress yet."} />
            </div>
      );
}

