import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ChevronDown, Home, LayoutGrid, LogOut, Search, Star, Tv, Clapperboard, X } from "lucide-react";
import "./hulu.css";
import Wordmark from "../shared/Wordmark";
import { useExperience } from "../shared/ExperienceContext";
import { isImmersivePath, useScrolled } from "../shared/navigation";
import { useCatalogue, useDebounced, useMyList, useServiceSearch, useWatchHistory } from "../shared/hooks";
import { MOVIE_GENRES, TV_GENRES } from "../shared/services";
import { CatalogueRow, HUBS, HuluGrid, HuluHome, HuluMasthead, HuluRow, Lazy, hubSpec } from "./HuluHome";
import HuluDetails from "./HuluDetails";

const LINKS = [
      { to: "/", label: "Home", end: true },
      { to: "/tv", label: "TV" },
      { to: "/trending", label: "Movies" },
      { to: "/my-list", label: "My Stuff" },
      { to: "/browse/hubs", label: "Hubs" },
];

function Header() {
      const scrolled = useScrolled(8);
      const [open, setOpen] = useState(false);
      const { setExperience } = useExperience();
      const navigate = useNavigate();
      const ref = useRef(null);
      useEffect(() => {
            const close = (event) => !ref.current?.contains(event.target) && setOpen(false);
            document.addEventListener("mousedown", close);
            return () => document.removeEventListener("mousedown", close);
      }, []);
      return (
            <>
                  <header className={`hu-header ${scrolled ? "is-solid" : ""}`}>
                        <Link to="/" className="hu-header__logo" aria-label="hulo home"><Wordmark service="hulu" height={24} /></Link>
                        <nav className="hu-header__nav" aria-label="hulo">
                              {LINKS.map((link) => <NavLink key={link.to} to={link.to} end={link.end}>{link.label}</NavLink>)}
                        </nav>
                        <div className="hu-header__right">
                              <NavLink to="/search" className="hu-header__search" aria-label="Search"><Search size={22} /></NavLink>
                              <div className="hu-header__profile" ref={ref}>
                                    <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
                                          <span className="hu-avatar">V</span>
                                          <span className="hu-header__name">Viewer</span>
                                          <ChevronDown size={16} />
                                    </button>
                                    {open && (
                                          <div className="hu-header__menu">
                                                <button type="button" onClick={() => navigate("/experiences")}><LayoutGrid size={16} /> Switch Service</button>
                                                <button type="button" onClick={() => navigate("/my-list")}>My Stuff</button>
                                                <button type="button" onClick={() => { setExperience(null); navigate("/"); }}><LogOut size={16} /> Return to MTStreams</button>
                                          </div>
                                    )}
                              </div>
                        </div>
                  </header>
                  <nav className="hu-tabbar" aria-label="hulo">
                        <NavLink to="/" end><Home size={22} /><span>Home</span></NavLink>
                        <NavLink to="/tv"><Tv size={22} /><span>TV</span></NavLink>
                        <NavLink to="/trending"><Clapperboard size={22} /><span>Movies</span></NavLink>
                        <NavLink to="/search"><Search size={22} /><span>Search</span></NavLink>
                        <NavLink to="/my-list"><Star size={22} /><span>My Stuff</span></NavLink>
                  </nav>
            </>
      );
}

function HuluBrowse({ type }) {
      const [params, setParams] = useSearchParams();
      const genre = params.get("genre");
      const genres = type === "tv" ? TV_GENRES : MOVIE_GENRES;
      const label = type === "tv" ? "TV" : "Movies";
      const hero = useCatalogue("hulu", { types: [type], sort: "trending" }, { target: 12, enabled: !genre });
      useEffect(() => { document.title = `hulo | ${label}`; }, [label]);
      return (
            <div className="hu-page">
                  {!genre && <HuluMasthead items={hero.items} loading={hero.loading} />}
                  <div className={`hu-rows ${genre ? "hu-rows--top" : ""}`}>
                        <div className="hu-subnav xp-scroll-x">
                              <button type="button" className={!genre ? "is-active" : ""} onClick={() => setParams({})}>FEATURED</button>
                              {Object.entries(genres).map(([id, name]) => <button key={id} type="button" className={genre === id ? "is-active" : ""} onClick={() => setParams({ genre: id })}>{name.toUpperCase()}</button>)}
                        </div>
                        {genre ? (
                              <>
                                    <h1 className="hu-pagetitle">{genres[genre]}</h1>
                                    <HuluGrid key={`${type}-${genre}`} spec={{ types: [type], sort: "popular", genres: genre }} />
                              </>
                        ) : (
                              <>
                                    <HuluRow title={`Trending ${label}`} items={hero.items.slice(6)} loading={hero.loading} />
                                    <CatalogueRow title={`New ${label}`} spec={{ types: [type], sort: "new" }} />
                                    <Lazy><CatalogueRow title="Critically Acclaimed" spec={{ types: [type], sort: "top" }} /></Lazy>
                                    <h2 className="hu-pagetitle hu-pagetitle--sub">All {label}</h2>
                                    <HuluGrid spec={{ types: [type], sort: "popular" }} />
                              </>
                        )}
                  </div>
            </div>
      );
}

function HuluHubs() {
      const { slug } = useParams();
      const hub = HUBS.find((entry) => entry.slug === slug);
      useEffect(() => { document.title = `hulo | ${hub?.label || "Hubs"}`; }, [hub]);
      if (!hub) {
            return (
                  <div className="hu-page hu-page--pad">
                        <h1 className="hu-pagetitle">Hubs</h1>
                        <div className="hu-hubgrid">
                              {HUBS.map((entry) => <Link key={entry.slug} to={`/browse/${entry.slug}`} className="hu-hubtile hu-hubtile--grid" style={{ "--hub": entry.color }}><span>{entry.label}</span></Link>)}
                        </div>
                  </div>
            );
      }
      return (
            <div className="hu-page hu-page--pad">
                  <header className="hu-hubhero" style={{ "--hub": hub.color }}>
                        <span>HUB</span>
                        <h1>{hub.label}</h1>
                  </header>
                  <CatalogueRow title="Trending" spec={hubSpec(hub, "trending")} />
                  <Lazy><CatalogueRow title="Critically Acclaimed" spec={hubSpec(hub, "top")} /></Lazy>
                  <h2 className="hu-pagetitle hu-pagetitle--sub">All {hub.label}</h2>
                  <HuluGrid spec={hubSpec(hub)} />
            </div>
      );
}

function HuluSearch() {
      const [params] = useSearchParams();
      const navigate = useNavigate();
      const [draft, setDraft] = useState(params.get("q") || "");
      const debounced = useDebounced(draft, 350);
      const search = useServiceSearch("hulu", debounced);
      useEffect(() => {
            navigate(debounced ? `/search?q=${encodeURIComponent(debounced)}` : "/search", { replace: true });
            document.title = "hulo | Search";
      }, [debounced, navigate]);
      return (
            <div className="hu-page hu-page--pad">
                  <div className="hu-searchbox">
                        <Search size={24} />
                        <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="TV shows, movies, and more" autoFocus aria-label="Search" />
                        {draft && <button type="button" onClick={() => setDraft("")} aria-label="Clear"><X size={20} /></button>}
                  </div>
                  {debounced.trim().length >= 2 ? (
                        <>
                              <p className="hu-results">{search.items.length ? `TOP RESULTS FOR "${debounced.toUpperCase()}"` : ""}</p>
                              <HuluGrid items={search.items} empty={search.loading ? "" : `No results for "${debounced}".`} />
                              {search.loading && <div className="hu-grid">{Array.from({ length: 4 }).map((_, index) => <span key={index} className="hu-tile hu-tile--skel xp-skeleton" />)}</div>}
                              {search.error && <div className="hu-error"><span>{search.error}</span><button type="button" onClick={search.retry}>TRY AGAIN</button></div>}
                              {search.hasMore && !search.loading && search.items.length > 0 && <button type="button" className="hu-loadmore" onClick={search.loadMore}>LOAD MORE</button>}
                        </>
                  ) : (
                        <div className="hu-hubgrid">
                              {HUBS.map((entry) => <Link key={entry.slug} to={`/browse/${entry.slug}`} className="hu-hubtile hu-hubtile--grid" style={{ "--hub": entry.color }}><span>{entry.label}</span></Link>)}
                        </div>
                  )}
            </div>
      );
}

function HuluMyStuff() {
      const { list } = useMyList("hulu");
      const history = useWatchHistory("hulu");
      useEffect(() => { document.title = "hulo | My Stuff"; }, []);
      return (
            <div className="hu-page hu-page--pad">
                  <h1 className="hu-pagetitle">My Stuff</h1>
                  {history.length > 0 && <HuluRow title="Keep Watching" items={history} progress />}
                  <h2 className="hu-pagetitle hu-pagetitle--sub">Saved</h2>
                  <HuluGrid items={list} empty="Add shows and movies to My Stuff and they'll appear here." />
            </div>
      );
}

export default function HuluExperience({ page }) {
      const { pathname } = useLocation();
      let content;
      switch (page) {
            case "movies": content = <HuluBrowse type="movie" />; break;
            case "tv": content = <HuluBrowse type="tv" />; break;
            case "search": content = <HuluSearch />; break;
            case "list": content = <HuluMyStuff />; break;
            case "collection": content = <HuluHubs />; break;
            case "movie": content = <HuluDetails mediaType="movie" />; break;
            case "tvdetail": content = <HuluDetails mediaType="tv" />; break;
            default: content = <HuluHome />;
      }
      return (
            <div className={`hu xp-root ${isImmersivePath(pathname) ? "is-immersive" : ""}`}>
                  <Header />
                  <main className="hu-main">{content}</main>
            </div>
      );
}
