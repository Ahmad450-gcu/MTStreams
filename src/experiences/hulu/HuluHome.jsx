import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Info, Play } from "lucide-react";
import Img from "../shared/Img";
import { isRecent, progressOf, titleOf, useCatalogue, useCertification, useInView, useInfiniteSentinel, useLogo, usePagedCatalogue, useWatchHistory, yearOf } from "../shared/hooks";
import { useCarousel, useRail, useTitleNav } from "../shared/navigation";
import { genreNames } from "../shared/services";

const KEY = "hulu";

export const HUBS = [
      { slug: "comedy", label: "Comedy", spec: { genres: "35" }, color: "#f5b700" },
      { slug: "drama", label: "Drama", spec: { genres: "18" }, color: "#7c3aed" },
      { slug: "reality", label: "Reality", spec: { genres: "10764" }, color: "#ec4899", tvOnly: true },
      { slug: "animation", label: "Animation", spec: { genres: "16" }, color: "#06b6d4" },
      { slug: "crime", label: "True Crime", spec: { genres: "80" }, color: "#ef4444" },
      { slug: "horror", label: "Horror", spec: { genres: "27" }, color: "#111827", movieOnly: true },
      { slug: "sci-fi", label: "Sci-Fi", spec: { genres: "878" }, color: "#2563eb", movieOnly: true },
      { slug: "family", label: "Kids & Family", spec: { genres: "10751" }, color: "#16a34a" },
      { slug: "docs", label: "Documentaries", spec: { genres: "99" }, color: "#a16207" },
      { slug: "anime", label: "Anime", spec: { genres: "16", language: "ja" }, color: "#db2777", tvOnly: true },
      { slug: "romance", label: "Romance", spec: { genres: "10749" }, color: "#be123c", movieOnly: true },
      { slug: "mystery", label: "Mystery", spec: { genres: "9648" }, color: "#334155" },
];

export const hubSpec = (hub, sort = "popular") => ({
      types: hub.tvOnly ? ["tv"] : hub.movieOnly ? ["movie"] : ["tv", "movie"],
      sort,
      ...hub.spec,
});

/* ------------------------------------------------------------- masthead */
function Masthead({ item, active }) {
      const { play, open } = useTitleNav();
      const logo = useLogo(item.media_type, item.id, active);
      const cert = useCertification(item.media_type, item.id, active);
      const title = titleOf(item);
      return (
            <div className={`hu-mast__slide ${active ? "is-active" : ""}`} aria-hidden={!active}>
                  <Img path={item.backdrop_path} size="w1280" alt="" className="hu-mast__img" eager={active} fallbackTitle="" />
                  <div className="hu-mast__shade" />
                  <div className="hu-mast__content">
                        <span className="hu-mast__eyebrow">{isRecent(item, 90) ? (item.media_type === "tv" ? "NEW SERIES" : "NEW MOVIE") : item.media_type === "tv" ? "HULO SERIES" : "MOVIE"}</span>
                        {logo ? <Img path={logo} size="w500" alt={title} className="hu-mast__logo" eager /> : <h2 className="hu-mast__title">{title}</h2>}
                        <p className="hu-mast__meta">
                              {cert && <span className="hu-cert">{cert}</span>}
                              <span>{genreNames(item, 2).join(", ")}</span>
                              <span>{item.media_type === "tv" ? "Series" : "Movie"}</span>
                              <span>{yearOf(item)}</span>
                        </p>
                        <p className="hu-mast__synopsis">{item.overview}</p>
                        <div className="hu-mast__actions">
                              <button type="button" className="hu-btn hu-btn--play" onClick={() => play(item)} tabIndex={active ? 0 : -1}><Play size={18} fill="currentColor" /> {item.media_type === "tv" ? "START WATCHING" : "PLAY"}</button>
                              <button type="button" className="hu-btn hu-btn--ghost" onClick={() => open(item)} tabIndex={active ? 0 : -1}><Info size={18} /> DETAILS</button>
                        </div>
                  </div>
            </div>
      );
}

export function HuluMasthead({ items, loading }) {
      const slides = useMemo(() => (items || []).filter((item) => item.backdrop_path).slice(0, 6), [items]);
      const [index, go] = useCarousel(slides.length, 8500);
      if (!slides.length) return <section className={`hu-mast ${loading ? "xp-skeleton" : ""}`} />;
      return (
            <section className="hu-mast" aria-roledescription="carousel">
                  {slides.map((item, slideIndex) => <Masthead key={item.id} item={item} active={slideIndex === index} />)}
                  <div className="hu-mast__thumbs">
                        {slides.map((item, thumb) => (
                              <button key={item.id} type="button" className={thumb === index ? "is-active" : ""} onClick={() => go(thumb)} aria-label={titleOf(item)}>
                                    <Img path={item.backdrop_path} size="w300" alt="" eager />
                              </button>
                        ))}
                  </div>
            </section>
      );
}

/* ----------------------------------------------------------------- tiles */
export function HuluTile({ item, progress }) {
      const { open } = useTitleNav();
      const title = titleOf(item);
      const sub = progress !== undefined && item.season
            ? `S${item.season} E${item.episode}`
            : isRecent(item, 45) ? (item.media_type === "tv" ? "New Episode" : "New Movie") : [genreNames(item, 1)[0], yearOf(item)].filter(Boolean).join(" • ");
      return (
            <button type="button" className="hu-tile" onClick={() => open(item)} aria-label={title}>
                  <span className="hu-tile__art">
                        <Img path={item.backdrop_path || item.poster_path} size="w500" alt="" fallbackTitle={title} />
                        <span className="hu-tile__more"><ChevronRight size={20} /></span>
                        {progress !== undefined && <span className="hu-progress"><span style={{ width: `${progress * 100}%` }} /></span>}
                  </span>
                  <span className="hu-tile__title">{title}</span>
                  <span className={`hu-tile__sub ${isRecent(item, 45) ? "is-new" : ""}`}>{sub}</span>
            </button>
      );
}

function PosterTile({ item }) {
      const { open } = useTitleNav();
      return (
            <button type="button" className="hu-poster" onClick={() => open(item)} aria-label={titleOf(item)}>
                  <Img path={item.poster_path} size="w342" alt="" fallbackTitle={titleOf(item)} />
            </button>
      );
}

export function HuluRow({ title, items, loading, error, onRetry, to, hasMore, onEnd, progress, poster }) {
      const rail = useRail();
      useEffect(() => {
            if (rail.end && hasMore && !loading && items.length) onEnd?.();
      }, [rail.end, hasMore, loading, items.length, onEnd]);
      if (!loading && !error && !items.length) return null;
      return (
            <section className="hu-row" aria-label={title}>
                  <header className="hu-row__head">
                        <h2>{title}</h2>
                        <div className="hu-row__tools">
                              {to && <Link to={to} className="hu-row__all">VIEW ALL</Link>}
                              <button type="button" onClick={() => rail.scroll(-1)} disabled={rail.start} aria-label="Previous"><ChevronLeft size={22} /></button>
                              <button type="button" onClick={() => rail.scroll(1)} disabled={rail.end} aria-label="Next"><ChevronRight size={22} /></button>
                        </div>
                  </header>
                  {error && !items.length ? (
                        <div className="hu-error"><span>{error}</span><button type="button" onClick={onRetry}>TRY AGAIN</button></div>
                  ) : (
                        <div className="hu-row__rail xp-scroll-x" ref={rail.ref}>
                              {items.map((item) => (poster ? <PosterTile key={`${item.media_type}-${item.id}`} item={item} /> : <HuluTile key={`${item.media_type}-${item.id}`} item={item} progress={progress ? progressOf(item) : undefined} />))}
                              {loading && Array.from({ length: items.length ? 2 : 6 }).map((_, index) => <span key={`s${index}`} className={`${poster ? "hu-poster" : "hu-tile hu-tile--skel"} xp-skeleton`} />)}
                        </div>
                  )}
            </section>
      );
}

export function CatalogueRow({ title, spec, to, poster }) {
      const [target, setTarget] = useState(20);
      const { items, loading, error, retry, hasMore } = useCatalogue(KEY, spec, { target });
      return <HuluRow title={title} items={items.slice(0, 60)} loading={loading && items.length < target} error={error} onRetry={retry} to={to} poster={poster} hasMore={hasMore && items.length < 60} onEnd={() => setTarget((current) => current + 20)} />;
}

export function Lazy({ children }) {
      const [ref, inView] = useInView({ rootMargin: "500px 0px" });
      return <div ref={ref} style={inView ? undefined : { minHeight: 260 }}>{inView && children}</div>;
}

export function HuluGrid({ spec, items: given, empty = "Nothing to show yet." }) {
      const catalogue = usePagedCatalogue(KEY, spec || { types: ["tv"] }, { pageSize: 30, enabled: !given });
      const source = given ? { items: given, loading: false, hasMore: false } : catalogue;
      const sentinel = useInfiniteSentinel(() => !source.loading && source.hasMore && catalogue.loadMore(), !given && source.hasMore && !catalogue.error);
      return (
            <>
                  <div className="hu-grid">
                        {source.items.map((item) => <HuluTile key={`${item.media_type}-${item.id}`} item={item} />)}
                        {source.loading && Array.from({ length: source.items.length ? 4 : 12 }).map((_, index) => <span key={index} className="hu-tile hu-tile--skel xp-skeleton" />)}
                  </div>
                  {!source.loading && !source.items.length && !catalogue.error && <p className="hu-empty">{empty}</p>}
                  {!given && catalogue.error && <div className="hu-error"><span>{catalogue.error}</span><button type="button" onClick={catalogue.retry}>TRY AGAIN</button></div>}
                  <div ref={sentinel} />
                  {!given && source.hasMore && !source.loading && source.items.length > 0 && <button type="button" className="hu-loadmore" onClick={catalogue.loadMore}>LOAD MORE</button>}
            </>
      );
}

function HubsRow() {
      return (
            <section className="hu-row" aria-label="Hubs">
                  <header className="hu-row__head"><h2>Hubs</h2><div className="hu-row__tools"><Link to="/browse/hubs" className="hu-row__all">VIEW ALL</Link></div></header>
                  <div className="hu-row__rail xp-scroll-x">
                        {HUBS.slice(0, 8).map((hub) => (
                              <Link key={hub.slug} to={`/browse/${hub.slug}`} className="hu-hubtile" style={{ "--hub": hub.color }}><span>{hub.label}</span></Link>
                        ))}
                  </div>
            </section>
      );
}

function KeepWatching() {
      const history = useWatchHistory(KEY);
      return history.length ? <HuluRow title="Keep Watching" items={history} progress /> : null;
}

export function HuluHome() {
      const hero = useCatalogue(KEY, { types: ["tv", "movie"], sort: "trending" }, { target: 16 });
      useEffect(() => { document.title = "hulo | Home"; }, []);
      const rows = [
            { title: "New Episodes", spec: { types: ["tv"], sort: "airing", windowDays: 21 } },
            { title: "Popular Series", spec: { types: ["tv"], sort: "popular", minVotes: 200 }, to: "/tv", poster: true },
            { hubs: true },
            { title: "Popular Movies", spec: { types: ["movie"], sort: "popular" }, to: "/trending" },
            { title: "Comedy Favorites", spec: hubSpec(HUBS[0]), to: "/browse/comedy" },
            { title: "Critically Acclaimed", spec: { types: ["tv", "movie"], sort: "top" } },
            { title: "Animated Comedies & Adventures", spec: hubSpec(HUBS[3]), to: "/browse/animation" },
            { title: "True Crime & Mystery", spec: hubSpec(HUBS[4]), to: "/browse/crime" },
            { title: "Reality TV", spec: hubSpec(HUBS[2]), to: "/browse/reality" },
            { title: "Horror Movies", spec: hubSpec(HUBS[5]), to: "/browse/horror" },
            { title: "Anime", spec: hubSpec(HUBS[9]), to: "/browse/anime" },
            { title: "Docs Worth Watching", spec: hubSpec(HUBS[8]), to: "/browse/docs" },
      ];
      return (
            <div className="hu-page">
                  <HuluMasthead items={hero.items} loading={hero.loading} />
                  <div className="hu-rows">
                        <KeepWatching />
                        <HuluRow title="Trending" items={hero.items.slice(6)} loading={hero.loading} error={hero.error} onRetry={hero.retry} hasMore={hero.hasMore} onEnd={() => hero.loadMore(20)} />
                        {rows.map((row, index) => (row.hubs ? <HubsRow key="hubs" /> : index < 1 ? <CatalogueRow key={row.title} {...row} /> : <Lazy key={row.title}><CatalogueRow {...row} /></Lazy>))}
                  </div>
            </div>
      );
}
