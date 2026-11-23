import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Clapperboard, Home, LayoutGrid, ListVideo, LogOut, Search, Tv, X } from "lucide-react";
import "./apple.css";
import Wordmark from "../shared/Wordmark";
import { useExperience } from "../shared/ExperienceContext";
import { isImmersivePath } from "../shared/navigation";
import { useCatalogue, useDebounced, useMyList, useServiceSearch, useWatchHistory } from "../shared/hooks";
import { MOVIE_GENRES, TV_GENRES } from "../shared/services";
import { AppleGrid, AppleHero, AppleHome, COLLECTIONS, CatalogueShelf, Lazy, Shelf } from "./AppleHome";
import AppleDetails from "./AppleDetails";

const NAV = [
      { to: "/", label: "Home", icon: Home, end: true },
      { to: "/tv", label: "TV Shows", icon: Tv },
      { to: "/trending", label: "Movies", icon: Clapperboard },
      { to: "/my-list", label: "Up Next", icon: ListVideo },
];

function Sidebar() {
      const navigate = useNavigate();
      const { setExperience } = useExperience();
      return (
            <aside className="at-sidebar" aria-label="Pear TV+">
                  <Link to="/" className="at-sidebar__logo" aria-label="Pear TV+ home"><Wordmark service="apple" height={26} /></Link>
                  <button type="button" className="at-sidebar__search" onClick={() => navigate("/search")}><Search size={15} /> Search</button>
                  <nav>
                        {NAV.map(({ to, label, icon: Icon, end }) => (
                              <NavLink key={to} to={to} end={end}><Icon size={18} /> {label}</NavLink>
                        ))}
                  </nav>
                  <h4>Collections</h4>
                  <nav>
                        {COLLECTIONS.slice(0, 6).map((collection) => <NavLink key={collection.slug} to={`/browse/${collection.slug}`}><span className="at-sidebar__dot" style={{ background: collection.bg }} /> {collection.label}</NavLink>)}
                  </nav>
                  <div className="at-sidebar__foot">
                        <button type="button" onClick={() => navigate("/experiences")}><LayoutGrid size={16} /> Switch Service</button>
                        <button type="button" onClick={() => { setExperience(null); navigate("/"); }}><LogOut size={16} /> Return to MTStreams</button>
                  </div>
            </aside>
      );
}

function TabBar() {
      return (
            <nav className="at-tabbar" aria-label="Pear TV+">
                  <NavLink to="/" end><Home size={22} /><span>Home</span></NavLink>
                  <NavLink to="/tv"><Tv size={22} /><span>TV Shows</span></NavLink>
                  <NavLink to="/trending"><Clapperboard size={22} /><span>Movies</span></NavLink>
                  <NavLink to="/my-list"><ListVideo size={22} /><span>Up Next</span></NavLink>
                  <NavLink to="/search"><Search size={22} /><span>Search</span></NavLink>
            </nav>
      );
}

function AppleBrowse({ type }) {
      const [params, setParams] = useSearchParams();
      const genres = type === "tv" ? TV_GENRES : MOVIE_GENRES;
      const genre = params.get("genre");
      const label = type === "tv" ? "TV Shows" : "Movies";
      const hero = useCatalogue("apple", { types: [type], sort: "trending" }, { target: 12, enabled: !genre });
      useEffect(() => { document.title = `${label} - Pear TV+`; }, [label]);
      return (
            <div className="at-page">
                  {!genre && <AppleHero items={hero.items} loading={hero.loading} />}
                  <div className={`at-shelves ${genre ? "at-shelves--top" : ""}`}>
                        <h1 className="at-pagetitle">{genre ? genres[genre] : label}</h1>
                        <div className="at-segmented at-segmented--scroll xp-scroll-x">
                              <button type="button" className={!genre ? "is-active" : ""} onClick={() => setParams({})}>All</button>
                              {Object.entries(genres).map(([id, name]) => <button key={id} type="button" className={genre === id ? "is-active" : ""} onClick={() => setParams({ genre: id })}>{name}</button>)}
                        </div>
                        {!genre && (
                              <>
                                    <CatalogueShelf title={`Top Chart: ${label}`} spec={{ types: [type], sort: "popular" }} ranked limit={10} />
                                    <Lazy><CatalogueShelf title="New Releases" spec={{ types: [type], sort: "new" }} /></Lazy>
                              </>
                        )}
                        <section className="at-shelf">
                              <header className="at-shelf__head"><h2>{genre ? `All ${genres[genre]}` : `All ${label}`}</h2></header>
                              <AppleGrid key={`${type}-${genre}`} spec={{ types: [type], sort: "popular", ...(genre ? { genres: genre } : {}) }} variant={type === "movie" ? "poster" : "wide"} />
                        </section>
                  </div>
            </div>
      );
}

function AppleCollection() {
      const { slug } = useParams();
      const collection = COLLECTIONS.find((entry) => entry.slug === slug) || COLLECTIONS[0];
      useEffect(() => { document.title = `${collection.label} - Pear TV+`; }, [collection]);
      return (
            <div className="at-page">
                  <header className="at-collectionhero" style={{ background: collection.bg }}><h1>{collection.label}</h1></header>
                  <div className="at-shelves at-shelves--flat">
                        <CatalogueShelf title="Featured" spec={{ ...collection.spec, sort: "trending" }} variant="feature" limit={6} />
                        <CatalogueShelf title="Top Chart" spec={{ ...collection.spec, sort: "popular" }} ranked limit={10} />
                        <section className="at-shelf">
                              <header className="at-shelf__head"><h2>Everything in {collection.label}</h2></header>
                              <AppleGrid spec={{ ...collection.spec, sort: "top", minVotes: 40 }} />
                        </section>
                  </div>
            </div>
      );
}

function AppleSearch() {
      const [params] = useSearchParams();
      const navigate = useNavigate();
      const [draft, setDraft] = useState(params.get("q") || "");
      const debounced = useDebounced(draft, 350);
      const search = useServiceSearch("apple", debounced);
      useEffect(() => {
            navigate(debounced ? `/search?q=${encodeURIComponent(debounced)}` : "/search", { replace: true });
            document.title = "Search - Pear TV+";
      }, [debounced, navigate]);
      return (
            <div className="at-page at-page--pad">
                  <label className="at-searchfield">
                        <Search size={18} />
                        <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Shows, Movies, and More" autoFocus aria-label="Search" />
                        {draft && <button type="button" onClick={() => setDraft("")} aria-label="Clear"><X size={16} /></button>}
                  </label>
                  {debounced.trim().length >= 2 ? (
                        <section className="at-shelf">
                              <header className="at-shelf__head"><h2>{search.items.length ? "Top Results" : ""}</h2></header>
                              <AppleGrid items={search.items} empty={search.loading ? "" : `No results for "${debounced}".`} />
                              {search.loading && <div className="at-grid at-grid--wide">{Array.from({ length: 4 }).map((_, index) => <span key={index} className="at-lockup at-skel xp-skeleton" />)}</div>}
                              {search.error && <div className="at-error"><span>{search.error}</span><button type="button" onClick={search.retry}>Try Again</button></div>}
                              {search.hasMore && !search.loading && search.items.length > 0 && <button type="button" className="at-loadmore" onClick={search.loadMore}>Show More</button>}
                        </section>
                  ) : (
                        <section className="at-shelf">
                              <header className="at-shelf__head"><h2>Browse Categories</h2></header>
                              <div className="at-catgrid">
                                    {COLLECTIONS.map((collection) => <Link key={collection.slug} to={`/browse/${collection.slug}`} className="at-collection at-collection--grid" style={{ background: collection.bg }}>{collection.label}</Link>)}
                              </div>
                        </section>
                  )}
            </div>
      );
}

function AppleUpNext() {
      const { list } = useMyList("apple");
      const history = useWatchHistory("apple");
      useEffect(() => { document.title = "Up Next - Pear TV+"; }, []);
      return (
            <div className="at-page at-page--pad">
                  <h1 className="at-pagetitle">Up Next</h1>
                  {history.length > 0 && <Shelf title="Continue Watching" items={history} progress />}
                  <section className="at-shelf">
                        <header className="at-shelf__head"><h2>Added to Up Next</h2></header>
                        <AppleGrid items={list} empty="Add movies and shows to Up Next to keep track of what you want to watch." />
                  </section>
            </div>
      );
}

export default function AppleExperience({ page }) {
      const { pathname } = useLocation();
      let content;
      switch (page) {
            case "movies": content = <AppleBrowse type="movie" />; break;
            case "tv": content = <AppleBrowse type="tv" />; break;
            case "search": content = <AppleSearch />; break;
            case "list": content = <AppleUpNext />; break;
            case "collection": content = <AppleCollection />; break;
            case "movie": content = <AppleDetails mediaType="movie" />; break;
            case "tvdetail": content = <AppleDetails mediaType="tv" />; break;
            default: content = <AppleHome />;
      }
      return (
            <div className={`at xp-root ${isImmersivePath(pathname) ? "is-immersive" : ""}`}>
                  <Sidebar />
                  <header className="at-topbar"><Link to="/" aria-label="Pear TV+ home"><Wordmark service="apple" height={24} /></Link></header>
                  <main className="at-main">{content}</main>
                  <TabBar />
            </div>
      );
}
