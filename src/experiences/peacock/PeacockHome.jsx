import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronLeft, ChevronRight, Play, Plus } from "lucide-react";
import Img from "../shared/Img";
import { isRecent, progressOf, titleOf, useCatalogue, useInView, useInfiniteSentinel, useLogo, useMyList, usePagedCatalogue, useWatchHistory, yearOf } from "../shared/hooks";
import { useCarousel, useRail, useTitleNav } from "../shared/navigation";
import { genreNames } from "../shared/services";
import { PEACOCK_DOTS } from "../shared/Wordmark";

const KEY = "peacock";

/* ------------------------------------------------------------- jumbotron */
function JumboCard({ item, position, onSelect }) {
      const { play } = useTitleNav();
      const { has, toggle } = useMyList(KEY);
      const active = position === 0;
      const logo = useLogo(item.media_type, item.id, Math.abs(position) <= 1);
      const title = titleOf(item);
      return (
            <div className={`pk-jumbo__card ${active ? "is-active" : ""}`} style={{ "--pos": position }} aria-hidden={!active}>
                  <button type="button" className="pk-jumbo__art" onClick={onSelect} tabIndex={active ? 0 : -1} aria-label={title}>
                        <Img path={item.backdrop_path} size="w1280" alt="" eager={Math.abs(position) <= 1} fallbackTitle={title} />
                  </button>
                  <div className="pk-jumbo__info">
                        {logo ? <Img path={logo} size="w500" alt={title} className="pk-jumbo__logo" /> : <h2>{title}</h2>}
                        <p>{[item.media_type === "tv" ? "Series" : "Movie", yearOf(item), genreNames(item, 1)[0]].filter(Boolean).join(" · ")}</p>
                        <div className="pk-jumbo__actions">
                              <button type="button" className="pk-btn pk-btn--watch" onClick={() => play(item)} tabIndex={active ? 0 : -1}><Play size={16} fill="currentColor" /> Watch Now</button>
                              <button type="button" className="pk-iconbtn" onClick={() => toggle(item)} aria-label="My Stuff" tabIndex={active ? 0 : -1}>{has(item) ? <Check size={18} /> : <Plus size={20} />}</button>
                        </div>
                  </div>
            </div>
      );
}

export function PeacockJumbotron({ items, loading }) {
      const slides = useMemo(() => (items || []).filter((item) => item.backdrop_path).slice(0, 7), [items]);
      const [index, go] = useCarousel(slides.length, 7000);
      const { open } = useTitleNav();
      if (!slides.length) return <section className="pk-jumbo"><div className={`pk-jumbo__card is-active ${loading ? "xp-skeleton" : ""}`} style={{ "--pos": 0 }} /></section>;
      return (
            <section className="pk-jumbo" aria-roledescription="carousel">
                  <div className="pk-jumbo__stage">
                        {slides.map((item, slideIndex) => {
                              let position = slideIndex - index;
                              if (position > slides.length / 2) position -= slides.length;
                              if (position < -slides.length / 2) position += slides.length;
                              if (Math.abs(position) > 1) return null;
                              return <JumboCard key={item.id} item={item} position={position} onSelect={() => (position === 0 ? open(item) : go(slideIndex))} />;
                        })}
                  </div>
                  <button type="button" className="pk-jumbo__arrow pk-jumbo__arrow--prev" onClick={() => go(index - 1)} aria-label="Previous"><ChevronLeft size={28} /></button>
                  <button type="button" className="pk-jumbo__arrow pk-jumbo__arrow--next" onClick={() => go(index + 1)} aria-label="Next"><ChevronRight size={28} /></button>
                  <div className="pk-jumbo__dots">
                        {slides.map((item, dot) => <button key={item.id} type="button" className={dot === index ? "is-active" : ""} style={{ "--dot": PEACOCK_DOTS[dot % PEACOCK_DOTS.length] }} onClick={() => go(dot)} aria-label={`Slide ${dot + 1}`} />)}
                  </div>
            </section>
      );
}

/* ----------------------------------------------------------------- tiles */
export function PeacockTile({ item, progress }) {
      const { open } = useTitleNav();
      const title = titleOf(item);
      return (
            <button type="button" className="pk-tile" onClick={() => open(item)} aria-label={title}>
                  <span className="pk-tile__art">
                        <Img path={item.backdrop_path || item.poster_path} size="w500" alt="" fallbackTitle={title} />
                        {isRecent(item, 45) && <span className="pk-tile__badge">{item.media_type === "tv" ? "NEW EPISODE" : "NEW"}</span>}
                        {progress !== undefined && <span className="pk-progress"><span style={{ width: `${progress * 100}%` }} /></span>}
                  </span>
                  <span className="pk-tile__title">{title}</span>
            </button>
      );
}

function RankTile({ item, rank }) {
      const { open } = useTitleNav();
      return (
            <button type="button" className="pk-rank" onClick={() => open(item)} aria-label={`${rank}. ${titleOf(item)}`}>
                  <span className="pk-rank__num" style={{ "--c1": PEACOCK_DOTS[(rank - 1) % 6], "--c2": PEACOCK_DOTS[(rank + 2) % 6] }}>{rank}</span>
                  <span className="pk-rank__art"><Img path={item.poster_path} size="w342" alt="" fallbackTitle={titleOf(item)} /></span>
            </button>
      );
}

function TallTile({ item }) {
      const { open } = useTitleNav();
      return (
            <button type="button" className="pk-tall" onClick={() => open(item)} aria-label={titleOf(item)}>
                  <Img path={item.poster_path} size="w342" alt="" fallbackTitle={titleOf(item)} />
            </button>
      );
}

export function PeacockRow({ title, items, loading, error, onRetry, kind = "tile", to, hasMore, onEnd, progress }) {
      const rail = useRail();
      useEffect(() => {
            if (rail.end && hasMore && !loading && items.length) onEnd?.();
      }, [rail.end, hasMore, loading, items.length, onEnd]);
      if (!loading && !error && !items.length) return null;
      return (
            <section className={`pk-row pk-row--${kind}`} aria-label={title}>
                  <header className="pk-row__head">
                        <h2>{title}</h2>
                        {to && <Link to={to}>See All <ChevronRight size={16} /></Link>}
                  </header>
                  {error && !items.length ? (
                        <div className="pk-error"><span>{error}</span><button type="button" onClick={onRetry}>Try Again</button></div>
                  ) : (
                        <div className="pk-row__wrap">
                              {!rail.start && <button type="button" className="pk-row__arrow pk-row__arrow--prev" onClick={() => rail.scroll(-1)} aria-label="Previous"><ChevronLeft size={26} /></button>}
                              <div className="pk-row__rail xp-scroll-x" ref={rail.ref}>
                                    {items.map((item, index) =>
                                          kind === "rank" ? <RankTile key={item.id} item={item} rank={index + 1} />
                                                : kind === "tall" ? <TallTile key={item.id} item={item} />
                                                      : <PeacockTile key={`${item.media_type}-${item.id}`} item={item} progress={progress ? progressOf(item) : undefined} />
                                    )}
                                    {loading && Array.from({ length: items.length ? 2 : 6 }).map((_, index) => <span key={`s${index}`} className={`pk-skel pk-skel--${kind} xp-skeleton`} />)}
                              </div>
                              {!rail.end && <button type="button" className="pk-row__arrow pk-row__arrow--next" onClick={() => rail.scroll(1)} aria-label="Next"><ChevronRight size={26} /></button>}
                        </div>
                  )}
            </section>
      );
}

export function CatalogueRow({ title, spec, kind, limit, to }) {
      const [target, setTarget] = useState(limit || 20);
      const { items, loading, error, retry, hasMore } = useCatalogue(KEY, spec, { target });
      const shown = items.slice(0, limit || 60);
      return <PeacockRow title={title} items={shown} loading={loading && shown.length < (limit || target)} error={error} onRetry={retry} kind={kind} to={to} hasMore={!limit && hasMore && items.length < 60} onEnd={() => setTarget((current) => current + 20)} />;
}

export function Lazy({ children }) {
      const [ref, inView] = useInView({ rootMargin: "500px 0px" });
      return <div ref={ref} style={inView ? undefined : { minHeight: 260 }}>{inView && children}</div>;
}

export function PeacockGrid({ spec, items: given, empty = "Nothing here yet." }) {
      const catalogue = usePagedCatalogue(KEY, spec || { types: ["tv"] }, { pageSize: 30, enabled: !given });
      const source = given ? { items: given, loading: false, hasMore: false } : catalogue;
      const sentinel = useInfiniteSentinel(() => !source.loading && source.hasMore && catalogue.loadMore(), !given && source.hasMore && !catalogue.error);
      return (
            <>
                  <div className="pk-grid">
                        {source.items.map((item) => <PeacockTile key={`${item.media_type}-${item.id}`} item={item} />)}
                        {source.loading && Array.from({ length: source.items.length ? 4 : 12 }).map((_, index) => <span key={index} className="pk-skel pk-skel--tile xp-skeleton" />)}
                  </div>
                  {!source.loading && !source.items.length && !catalogue.error && <p className="pk-empty">{empty}</p>}
                  {!given && catalogue.error && <div className="pk-error"><span>{catalogue.error}</span><button type="button" onClick={catalogue.retry}>Try Again</button></div>}
                  <div ref={sentinel} />
                  {!given && source.hasMore && !source.loading && source.items.length > 0 && <button type="button" className="pk-loadmore" onClick={catalogue.loadMore}>Load More</button>}
            </>
      );
}

// Category chips under the jumbotron re-programme the rows below them.
const CHANNELS = {
      featured: [
            { title: "Top 10 on peacoq Today", spec: { types: ["tv", "movie"], sort: "trending" }, kind: "rank", limit: 10 },
            { title: "Popular Shows", spec: { types: ["tv"], sort: "popular" }, to: "/tv" },
            { title: "Blockbuster Movies", spec: { types: ["movie"], sort: "popular", minVotes: 800 }, kind: "tall", to: "/trending" },
            { title: "New on peacoq", spec: { types: ["tv", "movie"], sort: "new" } },
            { title: "Laugh Out Loud", spec: { types: ["tv"], sort: "popular", genres: "35" } },
            { title: "Reality Rewind", spec: { types: ["tv"], sort: "popular", genres: "10764" } },
            { title: "Crime & Investigation", spec: { types: ["tv"], sort: "popular", genres: "80" } },
            { title: "Critically Acclaimed", spec: { types: ["tv", "movie"], sort: "top" } },
      ],
      tv: [
            { title: "Top 10 Shows", spec: { types: ["tv"], sort: "trending" }, kind: "rank", limit: 10 },
            { title: "New Episodes", spec: { types: ["tv"], sort: "airing", windowDays: 21 } },
            { title: "Binge-Worthy Dramas", spec: { types: ["tv"], sort: "popular", genres: "18" } },
            { title: "Sitcom Favorites", spec: { types: ["tv"], sort: "popular", genres: "35" } },
            { title: "Reality TV", spec: { types: ["tv"], sort: "popular", genres: "10764" } },
      ],
      movies: [
            { title: "Top 10 Movies", spec: { types: ["movie"], sort: "trending" }, kind: "rank", limit: 10 },
            { title: "New Movies", spec: { types: ["movie"], sort: "new" } },
            { title: "Action Hits", spec: { types: ["movie"], sort: "popular", genres: "28" }, kind: "tall" },
            { title: "Comedy Movies", spec: { types: ["movie"], sort: "popular", genres: "35" } },
            { title: "Horror Nights", spec: { types: ["movie"], sort: "popular", genres: "27" } },
      ],
      kids: [
            { title: "Kids' Favorites", spec: { types: ["tv"], sort: "popular", genres: "10762" } },
            { title: "Animated Movies", spec: { types: ["movie"], sort: "popular", genres: "16" }, kind: "tall" },
            { title: "Family Movie Night", spec: { types: ["movie"], sort: "popular", genres: "10751" } },
      ],
      reality: [
            { title: "Reality Hits", spec: { types: ["tv"], sort: "popular", genres: "10764" } },
            { title: "Talk & Late Night", spec: { types: ["tv"], sort: "popular", genres: "10767" } },
            { title: "Docuseries", spec: { types: ["tv"], sort: "popular", genres: "99" } },
      ],
};

const CHIP_LABELS = [["featured", "Featured"], ["tv", "TV Shows"], ["movies", "Movies"], ["kids", "Kids"], ["reality", "Reality & Talk"]];

function KeepWatching() {
      const history = useWatchHistory(KEY);
      return history.length ? <PeacockRow title="Continue Watching" items={history} progress /> : null;
}

export function PeacockHome() {
      const hero = useCatalogue(KEY, { types: ["tv", "movie"], sort: "trending" }, { target: 16 });
      const [channel, setChannel] = useState("featured");
      useEffect(() => { document.title = "peacoq: Stream TV & Movies"; }, []);
      return (
            <div className="pk-page">
                  <PeacockJumbotron items={hero.items} loading={hero.loading} />
                  <div className="pk-chips xp-scroll-x" role="tablist" aria-label="Browse categories">
                        {CHIP_LABELS.map(([key, label]) => <button key={key} type="button" role="tab" aria-selected={channel === key} className={channel === key ? "is-active" : ""} onClick={() => setChannel(key)}>{label}</button>)}
                  </div>
                  <div className="pk-rows">
                        {channel === "featured" && <KeepWatching />}
                        {channel === "featured" && <PeacockRow title="Trending Now" items={hero.items.slice(7)} loading={hero.loading} error={hero.error} onRetry={hero.retry} hasMore={hero.hasMore} onEnd={() => hero.loadMore(20)} />}
                        {CHANNELS[channel].map((row, index) => (index < 2 ? <CatalogueRow key={`${channel}-${row.title}`} {...row} /> : <Lazy key={`${channel}-${row.title}`}><CatalogueRow {...row} /></Lazy>))}
                  </div>
            </div>
      );
}
