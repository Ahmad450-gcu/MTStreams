import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Bookmark, Clapperboard, Film, Home, LayoutGrid, LogOut, Search, Tv, UserRound, X } from "lucide-react";
import "./mgm.css";
import Wordmark from "../shared/Wordmark";
import { useExperience } from "../shared/ExperienceContext";
import { isImmersivePath, useScrolled } from "../shared/navigation";
import { useCatalogue, useDebounced, useMyList, useServiceSearch, useWatchHistory } from "../shared/hooks";
import { MOVIE_GENRES, TV_GENRES } from "../shared/services";
import { COLLECTIONS, CatalogueRow, Lazy, MgmGrid, MgmHero, MgmHome, MgmRow, collectionSpec } from "./MgmHome";
import MgmDetails from "./MgmDetails";

function Header() {
      const scrolled = useScrolled(10);
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
                  <header className={`mg-header ${scrolled ? "is-solid" : ""}`}>
                        <nav className="mg-header__side">
                              <NavLink to="/" end>Home</NavLink>
                              <NavLink to="/trending">Movies</NavLink>
                              <NavLink to="/tv">Series</NavLink>
                        </nav>
                        <Link to="/" className="mg-header__logo" aria-label="MGN+ home"><Wordmark service="mgm" height={34} /></Link>
                        <nav className="mg-header__side mg-header__side--right">
                              <NavLink to="/browse/collections">Collections</NavLink>
                              <NavLink to="/my-list">My List</NavLink>
                              <NavLink to="/search" aria-label="Search" className="mg-header__icon"><Search size={18} /></NavLink>
                              <div className="mg-header__profile" ref={ref}>
                                    <button type="button" onClick={() => setOpen((value) => !value)} aria-label="Account" aria-expanded={open}><UserRound size={18} /></button>
                                    {open && (
                                          <div className="mg-menu">
                                                <button type="button" onClick={() => navigate("/experiences")}><LayoutGrid size={15} /> Switch Service</button>
                                                <button type="button" onClick={() => { setExperience(null); navigate("/"); }}><LogOut size={15} /> Return to MTStreams</button>
                                          </div>
                                    )}
                              </div>
                        </nav>
                  </header>
                  <nav className="mg-tabbar" aria-label="MGN+">
                        <NavLink to="/" end><Home size={20} /><span>Home</span></NavLink>
                        <NavLink to="/trending"><Clapperboard size={20} /><span>Movies</span></NavLink>
                        <NavLink to="/tv"><Tv size={20} /><span>Series</span></NavLink>
                        <NavLink to="/browse/collections"><Film size={20} /><span>Collections</span></NavLink>
                        <NavLink to="/search"><Search size={20} /><span>Search</span></NavLink>
                        <NavLink to="/my-list"><Bookmark size={20} /><span>My List</span></NavLink>
                  </nav>
            </>
      );
}

function MgmBrowse({ type }) {
      const [params, setParams] = useSearchParams();
      const genres = type === "tv" ? TV_GENRES : MOVIE_GENRES;
      const genre = params.get("genre");
      const label = type === "tv" ? "Series" : "Movies";
      const hero = useCatalogue("mgm", { types: [type], sort: "trending" }, { target: 10, enabled: !genre });
      useEffect(() => { document.title = `${label} | MGN+`; }, [label]);
      return (
            <div className="mg-page">
                  {!genre && <MgmHero items={hero.items} loading={hero.loading} />}
                  <div className={`mg-rows ${genre ? "mg-rows--top" : ""}`}>
                        <header className="mg-browsehead">
                              <h1>{genre ? genres[genre] : label}</h1>
                              <div className="mg-genres xp-scroll-x">
                                    <button type="button" className={!genre ? "is-active" : ""} onClick={() => setParams({})}>All</button>
                                    {Object.entries(genres).map(([id, name]) => <button key={id} type="button" className={genre === id ? "is-active" : ""} onClick={() => setParams({ genre: id })}>{name}</button>)}
                              </div>
                        </header>
                        {!genre && <CatalogueRow title={`Critics' Choice ${label}`} spec={{ types: [type], sort: "top" }} />}
                        <h2 className="mg-section-title">{genre ? `All ${genres[genre]}` : `The Full ${label} Library`}</h2>
                        <MgmGrid key={`${type}-${genre}`} spec={{ types: [type], sort: "popular", ...(genre ? { genres: genre } : {}) }} />
                  </div>
            </div>
      );
}

function MgmCollections() {
      const { slug } = useParams();
      const collection = COLLECTIONS.find((entry) => entry.slug === slug);
      useEffect(() => { document.title = `${collection?.title || "Collections"} | MGN+`; }, [collection]);
      if (!collection) {
            return (
                  <div className="mg-page mg-page--pad">
                        <header className="mg-browsehead"><h1>Collections</h1><p className="mg-browsehead__sub">Curated programmes from the vault.</p></header>
                        {COLLECTIONS.map((entry, index) => (
                              index < 2 ? <CatalogueRow key={entry.slug} title={entry.title} subtitle={entry.tagline} spec={collectionSpec(entry)} to={`/browse/${entry.slug}`} />
                                    : <Lazy key={entry.slug}><CatalogueRow title={entry.title} subtitle={entry.tagline} spec={collectionSpec(entry)} to={`/browse/${entry.slug}`} /></Lazy>
                        ))}
                  </div>
            );
      }
      return (
            <div className="mg-page mg-page--pad">
                  <header className="mg-browsehead mg-browsehead--collection">
                        <span className="mg-kicker">Collection</span>
                        <h1>{collection.title}</h1>
                        <p className="mg-browsehead__sub">{collection.tagline}</p>
                  </header>
                  <MgmGrid spec={collectionSpec(collection)} />
            </div>
      );
}

function MgmSearch() {
      const [params] = useSearchParams();
      const navigate = useNavigate();
      const [draft, setDraft] = useState(params.get("q") || "");
      const debounced = useDebounced(draft, 350);
      const search = useServiceSearch("mgm", debounced);
      useEffect(() => {
            navigate(debounced ? `/search?q=${encodeURIComponent(debounced)}` : "/search", { replace: true });
            document.title = "Search | MGN+";
      }, [debounced, navigate]);
      return (
            <div className="mg-page mg-page--pad">
                  <header className="mg-searchhead">
                        <h1>Search the Collection</h1>
                        <label className="mg-search">
                              <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Title, genre or series" autoFocus aria-label="Search" />
                              {draft ? <button type="button" onClick={() => setDraft("")} aria-label="Clear"><X size={20} /></button> : <Search size={20} />}
                        </label>
                  </header>
                  {debounced.trim().length >= 2 ? (
                        <>
                              <MgmGrid items={search.items} empty={search.loading ? "" : `Nothing in the collection matches "${debounced}".`} />
                              {search.loading && <div className="mg-grid">{Array.from({ length: 6 }).map((_, index) => <span key={index} className="mg-poster mg-skel xp-skeleton" />)}</div>}
                              {search.error && <div className="mg-error"><span>{search.error}</span><button type="button" onClick={search.retry}>TRY AGAIN</button></div>}
                              {search.hasMore && !search.loading && search.items.length > 0 && <button type="button" className="mg-loadmore" onClick={search.loadMore}>LOAD MORE</button>}
                        </>
                  ) : (
                        <CatalogueRow title="Trending Searches" spec={{ types: ["movie", "tv"], sort: "trending" }} />
                  )}
            </div>
      );
}

function MgmMyList() {
      const { list } = useMyList("mgm");
      const history = useWatchHistory("mgm");
      useEffect(() => { document.title = "My List | MGN+"; }, []);
      return (
            <div className="mg-page mg-page--pad">
                  <header className="mg-browsehead"><h1>My List</h1></header>
                  {history.length > 0 && <MgmRow title="Continue Watching" items={history} progress />}
                  <MgmGrid items={list} empty="Your list is empty. Add films and series to watch later." />
            </div>
      );
}

export default function MgmExperience({ page }) {
      const { pathname } = useLocation();
      let content;
      switch (page) {
            case "movies": content = <MgmBrowse type="movie" />; break;
            case "tv": content = <MgmBrowse type="tv" />; break;
            case "search": content = <MgmSearch />; break;
            case "list": content = <MgmMyList />; break;
            case "collection": content = <MgmCollections />; break;
            case "movie": content = <MgmDetails mediaType="movie" />; break;
            case "tvdetail": content = <MgmDetails mediaType="tv" />; break;
            default: content = <MgmHome />;
      }
      return (
            <div className={`mg xp-root ${isImmersivePath(pathname) ? "is-immersive" : ""}`}>
                  <Header />
                  <main className="mg-main">{content}</main>
                  <footer className="mg-footer"><Wordmark service="mgm" height={22} /><span>A fan-made cinema interface inside MTStreams.</span></footer>
            </div>
      );
}
