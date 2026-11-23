import { createContext, memo, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { Check, ChevronLeft, ChevronRight, Play, Plus } from "lucide-react";
import Img from "../shared/Img";
import { isRecent, progressOf, titleOf, typeOf, useCatalogue, useInView, useInfiniteSentinel, useLogo, useMediaQuery, useMyList, usePagedCatalogue, useWatchHistory, yearOf } from "../shared/hooks";
import { useCarousel, useRail, useTitleNav } from "../shared/navigation";
import { genreNames } from "../shared/services";

export const KEY = "hotstar";

// Original-language codes shown as "languages" the way the service labels them.
export const LANGUAGES = {
      hi: { name: "Hindi", native: "हिंदी", tint: "#d9480f" },
      ta: { name: "Tamil", native: "தமிழ்", tint: "#c2255c" },
      te: { name: "Telugu", native: "తెలుగు", tint: "#7048e8" },
      ml: { name: "Malayalam", native: "മലയാളം", tint: "#0ca678" },
      kn: { name: "Kannada", native: "ಕನ್ನಡ", tint: "#e67700" },
      bn: { name: "Bengali", native: "বাংলা", tint: "#1c7ed6" },
      mr: { name: "Marathi", native: "मराठी", tint: "#9c36b5" },
      en: { name: "English", native: "English", tint: "#495057" },
};
let displayNames;
const languageNames = new Map();
export const languageName = (code) => {
      if (!code) return "";
      if (LANGUAGES[code]) return LANGUAGES[code].name;
      if (!languageNames.has(code)) {
            try {
                  displayNames ??= new Intl.DisplayNames(["en"], { type: "language" });
                  languageNames.set(code, displayNames.of(code) || "");
            } catch {
                  languageNames.set(code, "");
            }
      }
      return languageNames.get(code);
};

export const metaLine = (item, extra = []) =>
      [yearOf(item), ...extra, languageName(item.original_language)].filter(Boolean);

/* ------------------------------------------------------------------ hero */
// Keyed by title so the logo never shows the previous slide's artwork.
function HeroInfo({ item }) {
      const logo = useLogo(item.media_type, item.id);
      const { play, open } = useTitleNav();
      const { has, toggle } = useMyList(KEY);
      const title = titleOf(item);
      return (
            <div className="jh-hero__info">
                  {logo ? <Img path={logo} size="w500" alt={title} className="jh-hero__logo" eager /> : <h2 className="jh-hero__title">{logo === undefined ? "" : title}</h2>}
                  <p className="jh-meta">
                        {metaLine(item, [item.media_type === "tv" ? "Series" : "Movie"]).map((part) => <span key={part}>{part}</span>)}
                  </p>
                  <p className="jh-hero__overview">{item.overview}</p>
                  <p className="jh-genres">{genreNames(item, 3).join(" | ")}</p>
                  <div className="jh-actions">
                        <button type="button" className="jh-watch" onClick={() => play(item)}><Play size={20} fill="currentColor" /> Watch Now</button>
                        <button type="button" className="jh-square" onClick={() => toggle(item)} aria-label={has(item) ? "Remove from Watchlist" : "Add to Watchlist"}>{has(item) ? <Check size={22} /> : <Plus size={24} />}</button>
                        <button type="button" className="jh-more" onClick={() => open(item)}>More info</button>
                  </div>
            </div>
      );
}

export function HotstarHero({ items, loading, compact = false }) {
      const slides = useMemo(() => (items || []).filter((item) => item.backdrop_path).slice(0, 8), [items]);
      const [paused, setPaused] = useState(false);
      const [index, go] = useCarousel(slides.length, 8000, paused);
      const item = slides[index];

      if (!item) return <section className={`jh-hero ${compact ? "jh-hero--compact" : ""}`}><div className={`jh-hero__art ${loading ? "xp-skeleton" : ""}`} /></section>;
      return (
            <section className={`jh-hero ${compact ? "jh-hero--compact" : ""}`} aria-roledescription="carousel" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
                  <div className="jh-hero__art" key={item.id}>
                        <Img path={item.backdrop_path} size="w1280" alt="" eager fallbackTitle="" />
                  </div>
                  <div className="jh-hero__shade" />
                  <HeroInfo key={`${item.media_type}-${item.id}`} item={item} />
                  <div className="jh-tray" role="tablist" aria-label="Featured titles">
                        {slides.map((slide, slideIndex) => (
                              <button key={slide.id} type="button" role="tab" aria-selected={slideIndex === index} aria-label={titleOf(slide)} className={slideIndex === index ? "is-active" : ""} onClick={() => go(slideIndex)}>
                                    <Img path={slide.backdrop_path} size="w300" alt="" fallbackTitle={titleOf(slide)} />
                              </button>
                        ))}
                  </div>
            </section>
      );
}

/* --------------------------------------------------------- hover preview */
// Desktop cards open a wider preview after a short hover. It is rendered in a
// portal so it can overlap neighbouring rows instead of being clipped by the
// horizontally scrolling rail.
const PreviewContext = createContext(null);

function HoverPreview({ preview, onClose }) {
      const { play, open } = useTitleNav();
      const { has, toggle } = useMyList(KEY);
      const [pos, setPos] = useState(null);
      const { item, rect } = preview;

      useLayoutEffect(() => {
            const width = Math.max(rect.width * 1.9, 300);
            const margin = 16;
            let left = rect.left + rect.width / 2 - width / 2;
            left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));
            const top = rect.top + window.scrollY - 24;
            setPos({ left, top, width });
      }, [rect]);

      useEffect(() => {
            const onScroll = () => onClose();
            window.addEventListener("scroll", onScroll, { passive: true });
            return () => window.removeEventListener("scroll", onScroll);
      }, [onClose]);

      if (!pos) return null;
      const title = titleOf(item);
      return createPortal(
            <div className="jh-preview" style={{ left: pos.left, top: pos.top, width: pos.width }} onMouseLeave={onClose} role="dialog" aria-label={title}>
                  <button type="button" className="jh-preview__art" onClick={() => open(item)} aria-label={`Open ${title}`}>
                        <Img path={item.backdrop_path || item.poster_path} size="w780" alt="" fallbackTitle={title} />
                        <span className="jh-preview__name">{title}</span>
                  </button>
                  <div className="jh-preview__body">
                        <div className="jh-preview__actions">
                              <button type="button" className="jh-watch jh-watch--sm" onClick={() => play(item)}><Play size={16} fill="currentColor" /> Watch Now</button>
                              <button type="button" className="jh-square jh-square--sm" onClick={() => toggle(item)} aria-label={has(item) ? "Remove from Watchlist" : "Add to Watchlist"}>{has(item) ? <Check size={18} /> : <Plus size={20} />}</button>
                        </div>
                        <p className="jh-meta jh-meta--sm">{metaLine(item, [typeOf(item) === "tv" ? "Series" : "Movie"]).map((part) => <span key={part}>{part}</span>)}</p>
                        <p className="jh-preview__overview">{item.overview}</p>
                  </div>
            </div>,
            document.body,
      );
}

export function PreviewLayer({ children }) {
      const [preview, setPreview] = useState(null);
      const canHover = useMediaQuery("(hover: hover) and (pointer: fine) and (min-width: 900px)");
      const close = useCallback(() => setPreview(null), []);
      const { pathname } = useLocation();
      useEffect(() => setPreview(null), [pathname]);
      return (
            <PreviewContext.Provider value={canHover ? setPreview : null}>
                  {children}
                  {preview && <HoverPreview key={`${preview.item.media_type}-${preview.item.id}`} preview={preview} onClose={close} />}
            </PreviewContext.Provider>
      );
}

function useHoverPreview(item) {
      const setPreview = useContext(PreviewContext);
      const timer = useRef(0);
      useEffect(() => () => clearTimeout(timer.current), []);
      if (!setPreview) return {};
      return {
            onMouseEnter: (event) => {
                  const target = event.currentTarget;
                  clearTimeout(timer.current);
                  timer.current = setTimeout(() => setPreview({ item, rect: target.getBoundingClientRect() }), 450);
            },
            onMouseLeave: () => clearTimeout(timer.current),
      };
}

/* ------------------------------------------------------------------ cards */
// Cards are memoised: rows re-render each time their catalogue grows, but
// existing cards keep the same item objects and do not need to re-render.
export const PosterCard = memo(function PosterCard({ item, progress }) {
      const { open } = useTitleNav();
      const hover = useHoverPreview(item);
      const title = titleOf(item);
      return (
            <button type="button" className="jh-card" onClick={() => open(item)} aria-label={title} {...hover}>
                  <Img path={item.poster_path || item.backdrop_path} size="w342" alt="" fallbackTitle={title} />
                  {isRecent(item, 30) && <span className="jh-card__tag">{typeOf(item) === "tv" ? "New Episode" : "Newly Added"}</span>}
                  {progress !== undefined && <span className="jh-progress"><span style={{ width: `${progress * 100}%` }} /></span>}
            </button>
      );
});

const WideCard = memo(function WideCard({ item, progress }) {
      const { open } = useTitleNav();
      const title = titleOf(item);
      return (
            <button type="button" className="jh-wide" onClick={() => open(item)} aria-label={title}>
                  <span className="jh-wide__art">
                        <Img path={item.backdrop_path || item.poster_path} size="w500" alt="" fallbackTitle={title} />
                        {progress !== undefined && <span className="jh-progress"><span style={{ width: `${progress * 100}%` }} /></span>}
                  </span>
                  <span className="jh-wide__title">{title}</span>
                  {item.season && <span className="jh-wide__sub">S{item.season} E{item.episode || 1}</span>}
            </button>
      );
});

const RankCard = memo(function RankCard({ item, rank }) {
      const { open } = useTitleNav();
      const hover = useHoverPreview(item);
      return (
            <button type="button" className="jh-rank" onClick={() => open(item)} aria-label={`${rank}. ${titleOf(item)}`} {...hover}>
                  <span className="jh-rank__num" aria-hidden="true">{rank}</span>
                  <span className="jh-rank__art">
                        <Img path={item.poster_path} size="w342" alt="" fallbackTitle={titleOf(item)} />
                        <span className="jh-rank__badge">TOP 10</span>
                  </span>
            </button>
      );
});

/* ------------------------------------------------------------------- rows */
export function HotstarRow({ title, items, loading, error, onRetry, kind = "poster", to, hasMore, onEnd, progress }) {
      const rail = useRail();
      useEffect(() => {
            if (rail.end && hasMore && !loading && items.length) onEnd?.();
      }, [rail.end, hasMore, loading, items.length, onEnd]);
      if (!loading && !error && !items.length) return null;
      return (
            <section className={`jh-row jh-row--${kind}`} aria-label={title}>
                  <header className="jh-row__head">
                        <h2>{title}</h2>
                        {to && <Link to={to} className="jh-row__all">View All <ChevronRight size={16} /></Link>}
                  </header>
                  {error && !items.length ? (
                        <div className="jh-error"><span>{error}</span><button type="button" onClick={onRetry}>Retry</button></div>
                  ) : (
                        <div className="jh-row__wrap">
                              {!rail.start && <button type="button" className="jh-row__arrow jh-row__arrow--prev" onClick={() => rail.scroll(-1)} aria-label="Previous"><ChevronLeft size={30} /></button>}
                              <div className="jh-row__rail xp-scroll-x" ref={rail.ref}>
                                    {items.map((item, index) =>
                                          kind === "rank" ? <RankCard key={item.id} item={item} rank={index + 1} />
                                                : kind === "wide" ? <WideCard key={`${item.media_type}-${item.id}`} item={item} progress={progress ? progressOf(item) : undefined} />
                                                      : <PosterCard key={`${item.media_type}-${item.id}`} item={item} />
                                    )}
                                    {loading && Array.from({ length: items.length ? 2 : 8 }).map((_, index) => <span key={`s${index}`} className={`jh-skel jh-skel--${kind} xp-skeleton`} />)}
                              </div>
                              {!rail.end && <button type="button" className="jh-row__arrow jh-row__arrow--next" onClick={() => rail.scroll(1)} aria-label="Next"><ChevronRight size={30} /></button>}
                        </div>
                  )}
            </section>
      );
}

export function CatalogueRow({ title, spec, kind, limit, to }) {
      const [target, setTarget] = useState(limit || 20);
      const { items, loading, error, retry, hasMore } = useCatalogue(KEY, spec, { target });
      const grow = useCallback(() => setTarget((current) => current + 20), []);
      const shown = items.slice(0, limit || 60);
      return <HotstarRow title={title} items={shown} loading={loading && shown.length < (limit || target)} error={error} onRetry={retry} kind={kind} to={to} hasMore={!limit && hasMore && items.length < 60} onEnd={grow} />;
}

export function Lazy({ children, height = 300 }) {
      const [ref, inView] = useInView({ rootMargin: "600px 0px" });
      return <div ref={ref} style={inView ? undefined : { minHeight: height }}>{inView && children}</div>;
}

export function LanguageRow() {
      return (
            <section className="jh-row" aria-label="Popular Languages">
                  <header className="jh-row__head"><h2>Popular Languages</h2></header>
                  <div className="jh-row__rail jh-langs xp-scroll-x">
                        {Object.entries(LANGUAGES).map(([code, lang]) => (
                              <Link key={code} to={`/browse/lang-${code}`} className="jh-lang" style={{ "--tint": lang.tint }}>
                                    <strong>{lang.native}</strong>
                                    {lang.native !== lang.name && <span>{lang.name}</span>}
                              </Link>
                        ))}
                  </div>
            </section>
      );
}

export function HotstarGrid({ spec, items: given, empty = "Nothing here yet." }) {
      const catalogue = usePagedCatalogue(KEY, spec || { types: ["movie"] }, { pageSize: 30, enabled: !given });
      const source = given ? { items: given, loading: false, hasMore: false } : catalogue;
      const sentinel = useInfiniteSentinel(() => !source.loading && source.hasMore && catalogue.loadMore(), !given && source.hasMore && !catalogue.error);
      return (
            <>
                  <div className="jh-grid">
                        {source.items.map((item) => <PosterCard key={`${item.media_type}-${item.id}`} item={item} />)}
                        {source.loading && Array.from({ length: source.items.length ? 6 : 14 }).map((_, index) => <span key={index} className="jh-skel jh-skel--poster xp-skeleton" />)}
                  </div>
                  {!source.loading && !source.items.length && !catalogue.error && <p className="jh-empty">{empty}</p>}
                  {!given && catalogue.error && <div className="jh-error"><span>{catalogue.error}</span><button type="button" onClick={catalogue.retry}>Retry</button></div>}
                  <div ref={sentinel} />
            </>
      );
}

function ContinueWatching() {
      const history = useWatchHistory(KEY);
      return history.length ? <HotstarRow title="Continue Watching" items={history} kind="wide" progress /> : null;
}

const HOME_ROWS = [
      { title: "Top 10 in India Today", spec: { types: ["tv", "movie"], sort: "trending" }, kind: "rank", limit: 10 },
      { title: "Latest Releases", spec: { types: ["movie"], sort: "new" }, to: "/trending" },
      { title: "Popular Shows", spec: { types: ["tv"], sort: "popular" }, to: "/tv" },
      { language: true },
      { title: "Hindi Movies", spec: { types: ["movie"], sort: "popular", language: "hi" }, to: "/browse/lang-hi" },
      { title: "Hit Hindi Shows", spec: { types: ["tv"], sort: "popular", language: "hi", minVotes: 3 } },
      { title: "Blockbuster Movies", spec: { types: ["movie"], sort: "popular", minVotes: 1500 } },
      { title: "South Indian Hits", spec: { types: ["movie"], sort: "popular", language: "ta|te|ml|kn" } },
      { title: "Binge-worthy Thrillers", spec: { types: ["tv"], sort: "popular", genres: "80|9648" } },
      { title: "Animation for All", spec: { types: ["movie", "tv"], sort: "popular", genres: "16" } },
      { title: "Comedy Shows", spec: { types: ["tv"], sort: "popular", genres: "35" } },
      { title: "Critically Acclaimed", spec: { types: ["movie", "tv"], sort: "top" } },
];

export function HotstarHome() {
      const hero = useCatalogue(KEY, { types: ["tv", "movie"], sort: "trending" }, { target: 20 });
      useEffect(() => { document.title = "JioHotster - Watch TV Shows, Movies & More"; }, []);
      return (
            <div className="jh-page">
                  <HotstarHero items={hero.items} loading={hero.loading} />
                  <div className="jh-rows">
                        <ContinueWatching />
                        <HotstarRow title="Trending Now" items={hero.items.slice(8)} loading={hero.loading} error={hero.error} onRetry={hero.retry} hasMore={hero.hasMore} onEnd={() => hero.loadMore(20)} />
                        {HOME_ROWS.map((row, index) => {
                              const node = row.language ? <LanguageRow /> : <CatalogueRow {...row} />;
                              const key = row.title || "languages";
                              return index < 3 ? <div key={key}>{node}</div> : <Lazy key={key}>{node}</Lazy>;
                        })}
                  </div>
            </div>
      );
}

