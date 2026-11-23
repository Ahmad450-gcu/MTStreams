import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Bookmark, ChevronDown, Clapperboard, Compass, Home, LayoutGrid, LogOut, Search, UserRound, X } from "lucide-react";
import "./crunchyroll.css";
import Wordmark from "../shared/Wordmark";
import { useExperience } from "../shared/ExperienceContext";
import { isImmersivePath } from "../shared/navigation";
import { useDebounced, useMyList, useServiceSearch, useWatchHistory } from "../shared/hooks";
import { ANIME_GENRES, CrunchyGrid, CrunchyHome, CrunchyRow, animeSeason, genreSpec, simulcastSpec } from "./CrunchyrollHome";
import CrunchyrollDetails from "./CrunchyrollDetails";

function BrowseMenu() {
      const [open, setOpen] = useState(false);
      const { pathname, search } = useLocation();
      useEffect(() => setOpen(false), [pathname, search]);
      return (
            <div className="cr-browse" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
                  <button type="button" className={`cr-nav__item ${open ? "is-open" : ""}`} onClick={() => setOpen((value) => !value)} aria-expanded={open}>Browse <ChevronDown size={16} /></button>
                  {open && (
                        <div className="cr-mega">
                              <div className="cr-mega__col">
                                    <Link to="/tv?sort=popular">Popular</Link>
                                    <Link to="/tv?sort=new">New</Link>
                                    <Link to="/tv?sort=alpha">Alphabetical</Link>
                                    <Link to="/browse/simulcast">Simulcast Season</Link>
                                    <Link to="/trending">Anime Movies</Link>
                              </div>
                              <div className="cr-mega__col cr-mega__col--genres">
                                    <h4>GENRES</h4>
                                    <div>
                                          {ANIME_GENRES.map(([id, name]) => <Link key={id} to={`/tv?genre=${id}`}>{name}</Link>)}
                                    </div>
                              </div>
                        </div>
                  )}
            </div>
      );
}

function Header() {
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
                  <header className="cr-header">
                        <Link to="/" className="cr-header__logo" aria-label="crunchyreel home">
                              <span className="cr-header__full"><Wordmark service="crunchyroll" height={26} /></span>
                              <span className="cr-header__icon"><Wordmark service="crunchyroll" height={30} iconOnly /></span>
                        </Link>
                        <nav className="cr-nav" aria-label="crunchyreel">
                              <BrowseMenu />
                              <NavLink to="/browse/simulcast" className="cr-nav__item">Simulcast</NavLink>
                              <NavLink to="/trending" className="cr-nav__item">Movies</NavLink>
                        </nav>
                        <div className="cr-header__right">
                              <NavLink to="/search" className="cr-header__btn" aria-label="Search"><Search size={22} /></NavLink>
                              <NavLink to="/my-list" className="cr-header__btn" aria-label="Watchlist"><Bookmark size={22} /></NavLink>
                              <div className="cr-header__profile" ref={ref}>
                                    <button type="button" className="cr-header__btn" onClick={() => setOpen((value) => !value)} aria-label="Account" aria-expanded={open}><UserRound size={22} /><ChevronDown size={14} /></button>
                                    {open && (
                                          <div className="cr-usermenu">
                                                <div className="cr-usermenu__head"><span className="cr-usermenu__avatar">V</span><strong>Viewer</strong></div>
                                                <button type="button" onClick={() => navigate("/my-list")}>Watchlist</button>
                                                <button type="button" onClick={() => navigate("/my-list?tab=history")}>History</button>
                                                <button type="button" onClick={() => navigate("/experiences")}><LayoutGrid size={16} /> Switch Service</button>
                                                <button type="button" onClick={() => { setExperience(null); navigate("/"); }}><LogOut size={16} /> Return to MTStreams</button>
                                          </div>
                                    )}
                              </div>
                        </div>
                  </header>
                  <nav className="cr-tabbar" aria-label="crunchyreel">
                        <NavLink to="/" end><Home size={22} /><span>Home</span></NavLink>
                        <NavLink to="/tv"><Compass size={22} /><span>Browse</span></NavLink>
                        <NavLink to="/trending"><Clapperboard size={22} /><span>Movies</span></NavLink>
                        <NavLink to="/search"><Search size={22} /><span>Search</span></NavLink>
                        <NavLink to="/my-list"><Bookmark size={22} /><span>My Lists</span></NavLink>
                  </nav>
            </>
      );
}

function CrunchyBrowse({ movies }) {
      const [params, setParams] = useSearchParams();
      const sort = params.get("sort") || "popular";
      const genre = params.get("genre");
      const genreLabel = ANIME_GENRES.find(([id]) => id === genre)?.[1];
      useEffect(() => { document.title = `${movies ? "Anime Movies" : genreLabel || "Browse"} - crunchyreel`; }, [movies, genreLabel]);
      const spec = movies
            ? { types: ["movie"], sort: sort === "alpha" ? "alpha" : sort, ...(sort === "alpha" ? { minVotes: 20 } : {}) }
            : genre ? genreSpec(genre, sort) : { types: ["tv"], sort, ...(sort === "alpha" ? { minVotes: 20 } : {}) };
      const set = (next) => setParams({ ...(genre ? { genre } : {}), sort, ...next });
      return (
            <div className="cr-page cr-page--pad">
                  <header className="cr-browsehead">
                        <h1>{movies ? "Anime Movies" : genreLabel ? `${genreLabel} Anime` : "Browse"}</h1>
                        <div className="cr-browsehead__tools">
                              <div className="cr-tabs" role="tablist">
                                    {[["popular", "Popular"], ["new", "Newest"], ["alpha", "Alphabetical"]].map(([key, label]) => (
                                          <button key={key} type="button" role="tab" aria-selected={sort === key} className={sort === key ? "is-active" : ""} onClick={() => set({ sort: key })}>{label}</button>
                                    ))}
                              </div>
                              {!movies && (
                                    <select value={genre || ""} onChange={(event) => setParams(event.target.value ? { genre: event.target.value, sort } : { sort })} aria-label="Genre">
                                          <option value="">All Genres</option>
                                          {ANIME_GENRES.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                                    </select>
                              )}
                        </div>
                  </header>
                  <CrunchyGrid key={JSON.stringify(spec)} spec={spec} />
            </div>
      );
}

function Simulcast() {
      const seasons = [0, -1, -2, -3].map((offset) => animeSeason(offset));
      const { slug } = useParams();
      const [params, setParams] = useSearchParams();
      const selected = seasons.find((season) => season.key === params.get("season")) || seasons[0];
      useEffect(() => { document.title = `${selected.label} Simulcast - crunchyreel`; }, [selected.label]);
      if (slug && slug !== "simulcast") return <CrunchyBrowse />;
      return (
            <div className="cr-page cr-page--pad">
                  <header className="cr-browsehead">
                        <h1>{selected.label} Simulcast Season</h1>
                        <div className="cr-browsehead__tools">
                              <select value={selected.key} onChange={(event) => setParams({ season: event.target.value })} aria-label="Season">
                                    {seasons.map((season) => <option key={season.key} value={season.key}>{season.label}</option>)}
                              </select>
                        </div>
                  </header>
                  <p className="cr-simulcast__note">Series airing new episodes between {selected.from} and {selected.to}.</p>
                  <CrunchyGrid key={selected.key} spec={simulcastSpec(selected)} empty="No simulcasts found for this season." />
            </div>
      );
}

function CrunchySearch() {
      const [params] = useSearchParams();
      const navigate = useNavigate();
      const [draft, setDraft] = useState(params.get("q") || "");
      const debounced = useDebounced(draft, 350);
      const search = useServiceSearch("crunchyroll", debounced);
      useEffect(() => {
            navigate(debounced ? `/search?q=${encodeURIComponent(debounced)}` : "/search", { replace: true });
            document.title = "Search - crunchyreel";
      }, [debounced, navigate]);
      const series = search.items.filter((item) => item.media_type === "tv");
      const films = search.items.filter((item) => item.media_type === "movie");
      return (
            <div className="cr-page">
                  <div className="cr-searchband">
                        <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Search..." autoFocus aria-label="Search" />
                        {draft && <button type="button" onClick={() => setDraft("")} aria-label="Clear"><X size={26} /></button>}
                  </div>
                  <div className="cr-page--pad cr-searchresults">
                        {debounced.trim().length >= 2 ? (
                              <>
                                    {series.length > 0 && <><h2 className="cr-section-title">Series</h2><CrunchyGrid items={series} /></>}
                                    {films.length > 0 && <><h2 className="cr-section-title">Movies</h2><CrunchyGrid items={films} /></>}
                                    {search.loading && <div className="cr-grid">{Array.from({ length: 6 }).map((_, index) => <span key={index} className="cr-skel cr-skel--series xp-skeleton" />)}</div>}
                                    {!search.loading && !search.items.length && !search.error && <p className="cr-empty">No results found for &ldquo;{debounced}&rdquo;.</p>}
                                    {search.error && <div className="cr-error"><span>{search.error}</span><button type="button" onClick={search.retry}>TRY AGAIN</button></div>}
                                    {search.hasMore && !search.loading && search.items.length > 0 && <button type="button" className="cr-loadmore" onClick={search.loadMore}>LOAD MORE</button>}
                              </>
                        ) : (
                              <p className="cr-empty">Search for anime series and movies on crunchyreel.</p>
                        )}
                  </div>
            </div>
      );
}

function CrunchyLists() {
      const { list } = useMyList("crunchyroll");
      const history = useWatchHistory("crunchyroll");
      const [params, setParams] = useSearchParams();
      const tab = params.get("tab") === "history" ? "history" : "watchlist";
      useEffect(() => { document.title = "My Lists - crunchyreel"; }, []);
      return (
            <div className="cr-page cr-page--pad">
                  <header className="cr-browsehead"><h1>My Lists</h1></header>
                  <div className="cr-tabs cr-tabs--page" role="tablist">
                        <button type="button" role="tab" aria-selected={tab === "watchlist"} className={tab === "watchlist" ? "is-active" : ""} onClick={() => setParams({})}>WATCHLIST</button>
                        <button type="button" role="tab" aria-selected={tab === "history"} className={tab === "history" ? "is-active" : ""} onClick={() => setParams({ tab: "history" })}>HISTORY</button>
                  </div>
                  {tab === "history"
                        ? (history.length ? <CrunchyRow title="Recently Watched" items={history} kind="continue" /> : <p className="cr-empty">Your watch history is empty.</p>)
                        : <CrunchyGrid items={list} empty="Your Watchlist needs some love. Add anime with the bookmark button." />}
            </div>
      );
}

export default function CrunchyrollExperience({ page }) {
      const { pathname } = useLocation();
      let content;
      switch (page) {
            case "movies": content = <CrunchyBrowse movies />; break;
            case "tv": content = <CrunchyBrowse />; break;
            case "search": content = <CrunchySearch />; break;
            case "list": content = <CrunchyLists />; break;
            case "collection": content = <Simulcast />; break;
            case "movie": content = <CrunchyrollDetails mediaType="movie" />; break;
            case "tvdetail": content = <CrunchyrollDetails mediaType="tv" />; break;
            default: content = <CrunchyHome />;
      }
      return (
            <div className={`cr xp-root ${isImmersivePath(pathname) ? "is-immersive" : ""}`}>
                  <Header />
                  <main className="cr-main">{content}</main>
                  <footer className="cr-footer">
                        <Wordmark service="crunchyroll" height={22} />
                        <span>crunchyreel is a fan-made anime interface inside MTStreams.</span>
                  </footer>
            </div>
      );
}
