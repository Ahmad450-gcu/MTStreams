import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Clapperboard, Home, LayoutGrid, LogOut, Search, Tv, UserRound, X } from "lucide-react";
import "./hotstar.css";
import Wordmark, { HotstarSpark } from "../shared/Wordmark";
import { useExperience } from "../shared/ExperienceContext";
import { isImmersivePath } from "../shared/navigation";
import { useCatalogue, useDebounced, useMyList, useServiceSearch, useWatchHistory } from "../shared/hooks";
import { MOVIE_GENRES, TV_GENRES } from "../shared/services";
import { CatalogueRow, HotstarGrid, HotstarHero, HotstarHome, HotstarRow, KEY, LANGUAGES, LanguageRow, Lazy, PreviewLayer } from "./HotstarHome";
import HotstarDetails from "./HotstarDetails";

const NAV = [
      { to: "/my-list", label: "My Space", icon: UserRound },
      { to: "/search", label: "Search", icon: Search },
      { to: "/", label: "Home", icon: Home, end: true },
      { to: "/tv", label: "TV", icon: Tv },
      { to: "/trending", label: "Movies", icon: Clapperboard },
      { to: "/browse/categories", label: "Categories", icon: LayoutGrid },
];

function Sidebar() {
      return (
            <>
                  <aside className="jh-side" aria-label="JioHotster">
                        <Link to="/" className="jh-side__logo" aria-label="JioHotster home">
                              <svg viewBox="0 0 20 20" width="34" height="34" aria-hidden="true"><HotstarSpark size={20} id="jh-side-spark" /></svg>
                        </Link>
                        <nav className="jh-side__nav">
                              {NAV.map(({ to, label, icon: Icon, end }) => (
                                    <NavLink key={to} to={to} end={end} className="jh-side__link">
                                          <Icon size={24} strokeWidth={2} />
                                          <span>{label}</span>
                                    </NavLink>
                              ))}
                        </nav>
                  </aside>
                  <header className="jh-topbar">
                        <Link to="/" aria-label="JioHotster home"><Wordmark service="hotstar" height={26} /></Link>
                  </header>
                  <nav className="jh-tabbar" aria-label="JioHotster">
                        {[NAV[2], NAV[1], NAV[3], NAV[4], NAV[0]].map(({ to, label, icon: Icon, end }) => (
                              <NavLink key={to} to={to} end={end}><Icon size={22} /><span>{label}</span></NavLink>
                        ))}
                  </nav>
            </>
      );
}

function HotstarBrowse({ type }) {
      const [params, setParams] = useSearchParams();
      const genres = type === "tv" ? TV_GENRES : MOVIE_GENRES;
      const genre = params.get("genre");
      const label = type === "tv" ? "TV" : "Movies";
      const hero = useCatalogue(KEY, { types: [type], sort: "trending" }, { target: 10, enabled: !genre });
      useEffect(() => { document.title = `${label} | JioHotster`; }, [label]);
      return (
            <div className="jh-page">
                  {!genre && <HotstarHero items={hero.items} loading={hero.loading} compact />}
                  <div className={`jh-rows ${genre ? "jh-rows--top" : ""}`}>
                        <div className="jh-chips xp-scroll-x">
                              <button type="button" className={!genre ? "is-active" : ""} onClick={() => setParams({})}>All</button>
                              {Object.entries(genres).map(([id, name]) => <button key={id} type="button" className={genre === id ? "is-active" : ""} onClick={() => setParams({ genre: id })}>{name}</button>)}
                        </div>
                        {genre ? (
                              <>
                                    <h1 className="jh-pagetitle">{genres[genre]}</h1>
                                    <HotstarGrid key={`${type}-${genre}`} spec={{ types: [type], sort: "popular", genres: genre }} />
                              </>
                        ) : (
                              <>
                                    <CatalogueRow title={`Top 10 ${label} in India`} spec={{ types: [type], sort: "trending" }} kind="rank" limit={10} />
                                    <CatalogueRow title={type === "tv" ? "Latest Episodes" : "Latest Releases"} spec={type === "tv" ? { types: ["tv"], sort: "airing", windowDays: 21 } : { types: ["movie"], sort: "new" }} />
                                    <LanguageRow />
                                    <Lazy><CatalogueRow title={`Hindi ${label}`} spec={{ types: [type], sort: "popular", language: "hi", ...(type === "tv" ? { minVotes: 3 } : {}) }} /></Lazy>
                                    <Lazy><CatalogueRow title={`English ${label}`} spec={{ types: [type], sort: "popular", language: "en" }} /></Lazy>
                                    <Lazy><CatalogueRow title={`Top Rated ${label}`} spec={{ types: [type], sort: "top" }} /></Lazy>
                                    <h2 className="jh-subtitle">All {label}</h2>
                                    <HotstarGrid key={type} spec={{ types: [type], sort: "popular" }} />
                              </>
                        )}
                  </div>
            </div>
      );
}

const CATEGORY_GENRES = [
      ["Drama", "18"], ["Comedy", "35"], ["Crime", "80"], ["Thriller", "53"], ["Action", "28"], ["Romance", "10749"],
      ["Animation", "16"], ["Family", "10751"], ["Horror", "27"], ["Sci-Fi", "878"], ["Documentary", "99"], ["Reality", "10764"],
];

function HotstarCollection() {
      const { slug = "" } = useParams();
      const language = slug.startsWith("lang-") ? slug.slice(5) : null;
      const lang = language && LANGUAGES[language];
      useEffect(() => { document.title = `${lang ? `${lang.name} Movies & Shows` : "Categories"} | JioHotster`; }, [lang]);

      if (lang) {
            return (
                  <div className="jh-page">
                        <div className="jh-rows jh-rows--top">
                              <h1 className="jh-pagetitle jh-pagetitle--lang" style={{ "--tint": lang.tint }}>{lang.native}{lang.native !== lang.name && <small>{lang.name}</small>}</h1>
                              <CatalogueRow title={`Popular in ${lang.name}`} spec={{ types: ["movie", "tv"], sort: "trending", language }} kind="rank" limit={10} />
                              <CatalogueRow title={`${lang.name} Shows`} spec={{ types: ["tv"], sort: "popular", language, minVotes: 3 }} />
                              <h2 className="jh-subtitle">{lang.name} Movies</h2>
                              <HotstarGrid key={language} spec={{ types: ["movie"], sort: "popular", language }} empty={`No ${lang.name} movies found.`} />
                        </div>
                  </div>
            );
      }

      return (
            <div className="jh-page">
                  <div className="jh-rows jh-rows--top">
                        <h1 className="jh-pagetitle">Categories</h1>
                        <LanguageRow />
                        <section className="jh-row" aria-label="Genres">
                              <header className="jh-row__head"><h2>Genres</h2></header>
                              <div className="jh-genregrid">
                                    {CATEGORY_GENRES.map(([name, id]) => (
                                          <Link key={id} to={id === "10764" ? `/tv?genre=${id}` : `/trending?genre=${id}`} className="jh-genre">{name}</Link>
                                    ))}
                              </div>
                        </section>
                  </div>
            </div>
      );
}

function HotstarSearch() {
      const [params] = useSearchParams();
      const navigate = useNavigate();
      const [draft, setDraft] = useState(params.get("q") || "");
      const debounced = useDebounced(draft, 350);
      const search = useServiceSearch(KEY, debounced);
      useEffect(() => {
            navigate(debounced ? `/search?q=${encodeURIComponent(debounced)}` : "/search", { replace: true });
            document.title = "Search | JioHotster";
      }, [debounced, navigate]);
      return (
            <div className="jh-page">
                  <div className="jh-rows jh-rows--top">
                        <label className="jh-searchbar">
                              <Search size={24} />
                              <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Movies, shows and more" autoFocus aria-label="Search" />
                              {draft && <button type="button" onClick={() => setDraft("")} aria-label="Clear"><X size={22} /></button>}
                        </label>
                        {debounced.trim().length >= 2 ? (
                              <>
                                    {search.items.length > 0 && <h2 className="jh-subtitle">Top Results</h2>}
                                    <HotstarGrid items={search.items} empty={search.loading ? "" : `Couldn't find "${debounced}". Try searching for another title.`} />
                                    {search.loading && <div className="jh-grid">{Array.from({ length: 7 }).map((_, index) => <span key={index} className="jh-skel jh-skel--poster xp-skeleton" />)}</div>}
                                    {search.error && <div className="jh-error"><span>{search.error}</span><button type="button" onClick={search.retry}>Retry</button></div>}
                                    {search.hasMore && !search.loading && search.items.length > 0 && <button type="button" className="jh-loadmore" onClick={search.loadMore}>Load More</button>}
                              </>
                        ) : (
                              <>
                                    <CatalogueRow title="Trending in India" spec={{ types: ["tv", "movie"], sort: "trending" }} />
                                    <LanguageRow />
                              </>
                        )}
                  </div>
            </div>
      );
}

function HotstarMySpace() {
      const { list } = useMyList(KEY);
      const history = useWatchHistory(KEY);
      const { setExperience } = useExperience();
      const navigate = useNavigate();
      useEffect(() => { document.title = "My Space | JioHotster"; }, []);
      return (
            <div className="jh-page">
                  <div className="jh-rows jh-rows--top">
                        <section className="jh-space">
                              <span className="jh-space__avatar">V</span>
                              <div>
                                    <h1>Viewer</h1>
                                    <p>Your watchlist and recently watched titles on this device.</p>
                              </div>
                              <div className="jh-space__actions">
                                    <button type="button" onClick={() => navigate("/experiences")}><LayoutGrid size={16} /> Switch service</button>
                                    <button type="button" onClick={() => { setExperience(null); navigate("/"); }}><LogOut size={16} /> Return to MTStreams</button>
                              </div>
                        </section>
                        {history.length > 0 && <HotstarRow title="Continue Watching" items={history} kind="wide" progress />}
                        <h2 className="jh-subtitle">Watchlist</h2>
                        <HotstarGrid items={list} empty="Your watchlist is empty. Select + on any movie or show to add it here." />
                  </div>
            </div>
      );
}

export default function HotstarExperience({ page }) {
      const { pathname } = useLocation();
      let content;
      switch (page) {
            case "movies": content = <HotstarBrowse type="movie" />; break;
            case "tv": content = <HotstarBrowse type="tv" />; break;
            case "search": content = <HotstarSearch />; break;
            case "list": content = <HotstarMySpace />; break;
            case "collection": content = <HotstarCollection />; break;
            case "movie": content = <HotstarDetails mediaType="movie" />; break;
            case "tvdetail": content = <HotstarDetails mediaType="tv" />; break;
            default: content = <HotstarHome />;
      }
      return (
            <div className={`jh xp-root ${isImmersivePath(pathname) ? "is-immersive" : ""}`}>
                  <PreviewLayer>
                        <Sidebar />
                        <main className="jh-main">{content}</main>
                  </PreviewLayer>
            </div>
      );
}
