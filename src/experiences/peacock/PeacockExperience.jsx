import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Bookmark, Clapperboard, Home, LayoutGrid, LogOut, Search, Tv, X } from "lucide-react";
import "./peacock.css";
import Wordmark from "../shared/Wordmark";
import { useExperience } from "../shared/ExperienceContext";
import { isImmersivePath, useScrolled } from "../shared/navigation";
import { useCatalogue, useDebounced, useMyList, useServiceSearch, useWatchHistory } from "../shared/hooks";
import { MOVIE_GENRES, TV_GENRES } from "../shared/services";
import { CatalogueRow, Lazy, PeacockGrid, PeacockHome, PeacockJumbotron, PeacockRow } from "./PeacockHome";
import PeacockDetails from "./PeacockDetails";

function Header() {
      const scrolled = useScrolled(8);
      const { setExperience } = useExperience();
      const navigate = useNavigate();
      const [open, setOpen] = useState(false);
      const ref = useRef(null);
      useEffect(() => {
            const close = (event) => !ref.current?.contains(event.target) && setOpen(false);
            document.addEventListener("mousedown", close);
            return () => document.removeEventListener("mousedown", close);
      }, []);
      return (
            <>
                  <header className={`pk-header ${scrolled ? "is-solid" : ""}`}>
                        <Link to="/" className="pk-header__logo" aria-label="peacoq home"><Wordmark service="peacock" height={28} /></Link>
                        <nav className="pk-header__nav" aria-label="peacoq">
                              <NavLink to="/" end>Home</NavLink>
                              <NavLink to="/tv">TV Shows</NavLink>
                              <NavLink to="/trending">Movies</NavLink>
                              <NavLink to="/browse/kids">Kids</NavLink>
                              <NavLink to="/my-list">My Stuff</NavLink>
                        </nav>
                        <div className="pk-header__right">
                              <NavLink to="/search" className="pk-header__search"><Search size={18} /> <span>Search</span></NavLink>
                              <div className="pk-header__profile" ref={ref}>
                                    <button type="button" className="pk-avatar" onClick={() => setOpen((value) => !value)} aria-label="Account" aria-expanded={open}>V</button>
                                    {open && (
                                          <div className="pk-menu">
                                                <button type="button" onClick={() => navigate("/experiences")}><LayoutGrid size={16} /> Switch Service</button>
                                                <button type="button" onClick={() => navigate("/my-list")}>My Stuff</button>
                                                <button type="button" onClick={() => { setExperience(null); navigate("/"); }}><LogOut size={16} /> Return to MTStreams</button>
                                          </div>
                                    )}
                              </div>
                        </div>
                  </header>
                  <nav className="pk-tabbar" aria-label="peacoq">
                        <NavLink to="/" end><Home size={22} /><span>Home</span></NavLink>
                        <NavLink to="/tv"><Tv size={22} /><span>TV</span></NavLink>
                        <NavLink to="/trending"><Clapperboard size={22} /><span>Movies</span></NavLink>
                        <NavLink to="/search"><Search size={22} /><span>Search</span></NavLink>
                        <NavLink to="/my-list"><Bookmark size={22} /><span>My Stuff</span></NavLink>
                  </nav>
            </>
      );
}

function PeacockBrowse({ type, kids }) {
      const [params, setParams] = useSearchParams();
      const genres = type === "tv" ? TV_GENRES : MOVIE_GENRES;
      const genre = kids ? "10751" : params.get("genre");
      const label = kids ? "Kids" : type === "tv" ? "TV Shows" : "Movies";
      const types = kids ? ["tv", "movie"] : [type];
      const hero = useCatalogue("peacock", { types, sort: "trending", ...(kids ? { genres: "10751|10762|16" } : {}) }, { target: 10, enabled: kids || !genre });
      useEffect(() => { document.title = `${label} | peacoq`; }, [label]);
      return (
            <div className="pk-page">
                  {(kids || !genre) && <PeacockJumbotron items={hero.items} loading={hero.loading} />}
                  <div className={`pk-rows ${!kids && genre ? "pk-rows--top" : ""}`}>
                        <h1 className="pk-pagetitle">{!kids && genre ? genres[genre] : label}</h1>
                        {!kids && (
                              <div className="pk-chips pk-chips--inline xp-scroll-x">
                                    <button type="button" className={!genre ? "is-active" : ""} onClick={() => setParams({})}>All</button>
                                    {Object.entries(genres).map(([id, name]) => <button key={id} type="button" className={genre === id ? "is-active" : ""} onClick={() => setParams({ genre: id })}>{name}</button>)}
                              </div>
                        )}
                        {!genre && <CatalogueRow title={`Top 10 ${label}`} spec={{ types, sort: "trending" }} kind="rank" limit={10} />}
                        {kids && (
                              <>
                                    <CatalogueRow title="Kids' Shows" spec={{ types: ["tv"], sort: "popular", genres: "10762" }} />
                                    <Lazy><CatalogueRow title="Animated Adventures" spec={{ types: ["movie"], sort: "popular", genres: "16" }} kind="tall" /></Lazy>
                              </>
                        )}
                        <h2 className="pk-subtitle">{genre && !kids ? `All ${genres[genre]}` : `All ${label}`}</h2>
                        <PeacockGrid key={`${type}-${genre}`} spec={{ types, sort: "popular", ...(genre ? { genres: kids ? "10751|10762|16" : genre } : {}) }} />
                  </div>
            </div>
      );
}

function PeacockSearch() {
      const [params] = useSearchParams();
      const navigate = useNavigate();
      const [draft, setDraft] = useState(params.get("q") || "");
      const debounced = useDebounced(draft, 350);
      const search = useServiceSearch("peacock", debounced);
      useEffect(() => {
            navigate(debounced ? `/search?q=${encodeURIComponent(debounced)}` : "/search", { replace: true });
            document.title = "Search | peacoq";
      }, [debounced, navigate]);
      return (
            <div className="pk-page pk-page--pad">
                  <label className="pk-searchbar">
                        <Search size={22} />
                        <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Search for shows, movies, sports & more" autoFocus aria-label="Search" />
                        {draft && <button type="button" onClick={() => setDraft("")} aria-label="Clear"><X size={20} /></button>}
                  </label>
                  {debounced.trim().length >= 2 ? (
                        <>
                              <h2 className="pk-subtitle">{search.items.length ? `Results for "${debounced}"` : ""}</h2>
                              <PeacockGrid items={search.items} empty={search.loading ? "" : `No results for "${debounced}".`} />
                              {search.loading && <div className="pk-grid">{Array.from({ length: 4 }).map((_, index) => <span key={index} className="pk-skel pk-skel--tile xp-skeleton" />)}</div>}
                              {search.error && <div className="pk-error"><span>{search.error}</span><button type="button" onClick={search.retry}>Try Again</button></div>}
                              {search.hasMore && !search.loading && search.items.length > 0 && <button type="button" className="pk-loadmore" onClick={search.loadMore}>Load More</button>}
                        </>
                  ) : (
                        <CatalogueRow title="Trending Searches" spec={{ types: ["tv", "movie"], sort: "trending" }} />
                  )}
            </div>
      );
}

function PeacockMyStuff() {
      const { list } = useMyList("peacock");
      const history = useWatchHistory("peacock");
      useEffect(() => { document.title = "My Stuff | peacoq"; }, []);
      return (
            <div className="pk-page pk-page--pad">
                  <h1 className="pk-pagetitle">My Stuff</h1>
                  {history.length > 0 && <PeacockRow title="Continue Watching" items={history} progress />}
                  <h2 className="pk-subtitle">Watchlist</h2>
                  <PeacockGrid items={list} empty="Tap + on any show or movie to add it to My Stuff." />
            </div>
      );
}

export default function PeacockExperience({ page }) {
      const { pathname } = useLocation();
      let content;
      switch (page) {
            case "movies": content = <PeacockBrowse type="movie" />; break;
            case "tv": content = <PeacockBrowse type="tv" />; break;
            case "search": content = <PeacockSearch />; break;
            case "list": content = <PeacockMyStuff />; break;
            case "collection": content = <PeacockBrowse type="tv" kids />; break;
            case "movie": content = <PeacockDetails mediaType="movie" />; break;
            case "tvdetail": content = <PeacockDetails mediaType="tv" />; break;
            default: content = <PeacockHome />;
      }
      return (
            <div className={`pk xp-root ${isImmersivePath(pathname) ? "is-immersive" : ""}`}>
                  <Header />
                  <main className="pk-main">{content}</main>
            </div>
      );
}
