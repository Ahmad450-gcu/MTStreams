import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Bookmark, Clapperboard, Home, LayoutGrid, LogOut, Search, Sparkles, Tv, X } from "lucide-react";
import "./max.css";
import Wordmark from "../shared/Wordmark";
import { useExperience } from "../shared/ExperienceContext";
import { isImmersivePath } from "../shared/navigation";
import { useCatalogue, useDebounced, useMyList, useServiceSearch, useWatchHistory } from "../shared/hooks";
import { MOVIE_GENRES, TV_GENRES } from "../shared/services";
import { BRANDS, CatalogueRail, Lazy, MaxGrid, MaxHero, MaxHome, MaxRail } from "./MaxHome";
import MaxDetails from "./MaxDetails";

function SideRail() {
      const { setExperience } = useExperience();
      const navigate = useNavigate();
      const [menu, setMenu] = useState(false);
      const items = [
            { to: "/search", icon: Search, label: "Search" },
            { to: "/", icon: Home, label: "Home", end: true },
            { to: "/tv", icon: Tv, label: "Series" },
            { to: "/trending", icon: Clapperboard, label: "Movies" },
            { to: "/browse/hbx", icon: Sparkles, label: "HBX" },
            { to: "/my-list", icon: Bookmark, label: "My Stuff" },
      ];
      return (
            <nav className="mx-rail" aria-label="HBX max">
                  <NavLink to="/" className="mx-rail__logo" aria-label="HBX max home"><span className="mx-rail__mark">HBX</span><span className="mx-rail__full"><Wordmark service="max" height={22} /></span></NavLink>
                  <ul>
                        {items.map(({ to, icon: Icon, label, end }) => (
                              <li key={to}>
                                    <NavLink to={to} end={end}><Icon size={22} strokeWidth={1.8} /><span>{label}</span></NavLink>
                              </li>
                        ))}
                  </ul>
                  <div className="mx-rail__profile">
                        <button type="button" onClick={() => setMenu((value) => !value)} aria-expanded={menu}>
                              <span className="mx-avatar">V</span><span>Viewer</span>
                        </button>
                        {menu && (
                              <div className="mx-rail__menu">
                                    <button type="button" onClick={() => navigate("/experiences")}><LayoutGrid size={16} /> Switch service</button>
                                    <button type="button" onClick={() => { setExperience(null); navigate("/"); }}><LogOut size={16} /> Return to MTStreams</button>
                              </div>
                        )}
                  </div>
            </nav>
      );
}

function MaxBrowse({ type }) {
      const [params, setParams] = useSearchParams();
      const genre = params.get("genre");
      const genres = type === "tv" ? TV_GENRES : MOVIE_GENRES;
      const label = type === "tv" ? "Series" : "Movies";
      const hero = useCatalogue("max", { types: [type], sort: "trending" }, { target: 12, enabled: !genre });
      useEffect(() => { document.title = `${label} | HBX max`; }, [label]);
      return (
            <div className="mx-page">
                  {!genre && <MaxHero items={hero.items} loading={hero.loading} />}
                  <div className={`mx-rows ${genre ? "mx-rows--top" : ""}`}>
                        <h1 className="mx-pagetitle">{genre ? genres[genre] : label}</h1>
                        <div className="mx-pills xp-scroll-x">
                              <button type="button" className={!genre ? "is-active" : ""} onClick={() => setParams({})}>All</button>
                              {Object.entries(genres).map(([id, name]) => (
                                    <button key={id} type="button" className={genre === id ? "is-active" : ""} onClick={() => setParams({ genre: id })}>{name}</button>
                              ))}
                        </div>
                        {!genre && (
                              <>
                                    <CatalogueRail title={`Top 10 ${label} Today`} spec={{ types: [type], sort: "trending" }} kind="top10" limit={10} />
                                    <CatalogueRail title={`New ${label}`} spec={{ types: [type], sort: "new" }} />
                                    <Lazy><CatalogueRail title={`Critically Acclaimed ${label}`} spec={{ types: [type], sort: "top" }} kind="poster" /></Lazy>
                              </>
                        )}
                        <h2 className="mx-subtitle">{genre ? `All ${genres[genre]}` : `All ${label}`}</h2>
                        <MaxGrid key={`${type}-${genre}`} spec={{ types: [type], sort: "popular", ...(genre ? { genres: genre } : {}) }} />
                  </div>
            </div>
      );
}

function MaxBrand() {
      const { slug } = useParams();
      const brand = BRANDS.find((entry) => entry.slug === slug) || BRANDS[0];
      useEffect(() => { document.title = `${brand.label} | HBX max`; }, [brand.label]);
      return (
            <div className="mx-page">
                  <header className="mx-brandhero" style={{ background: brand.bg }}>
                        <strong>{brand.label}</strong>
                        <span>{brand.sub}</span>
                  </header>
                  <div className="mx-rows mx-rows--flat">
                        <CatalogueRail title="Featured" spec={{ ...brand.spec, sort: "trending" }} kind="spotlight" limit={6} />
                        <h2 className="mx-subtitle">All titles</h2>
                        <MaxGrid spec={brand.spec} />
                  </div>
            </div>
      );
}

function MaxSearch() {
      const [params] = useSearchParams();
      const navigate = useNavigate();
      const [draft, setDraft] = useState(params.get("q") || "");
      const debounced = useDebounced(draft, 350);
      const search = useServiceSearch("max", debounced);
      const popular = useCatalogue("max", { types: ["tv", "movie"], sort: "trending" }, { target: 18, enabled: debounced.trim().length < 2 });
      useEffect(() => {
            navigate(debounced ? `/search?q=${encodeURIComponent(debounced)}` : "/search", { replace: true });
            document.title = "Search | HBX max";
      }, [debounced, navigate]);
      return (
            <div className="mx-page mx-page--pad">
                  <label className="mx-search">
                        <Search size={26} />
                        <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Search for series, movies and more" autoFocus aria-label="Search" />
                        {draft && <button type="button" onClick={() => setDraft("")} aria-label="Clear"><X size={22} /></button>}
                  </label>
                  {debounced.trim().length >= 2 ? (
                        <>
                              <h2 className="mx-subtitle">Results</h2>
                              <MaxGrid items={search.items} empty={search.loading ? "" : `No results for "${debounced}" on HBX max.`} />
                              {search.loading && <div className="mx-grid mx-grid--poster">{Array.from({ length: 6 }).map((_, index) => <span key={index} className="mx-skel mx-skel--poster xp-skeleton" />)}</div>}
                              {search.error && <div className="mx-error"><span>{search.error}</span><button type="button" onClick={search.retry}>Try again</button></div>}
                              {search.hasMore && !search.loading && search.items.length > 0 && <button type="button" className="mx-loadmore" onClick={search.loadMore}>Load more</button>}
                        </>
                  ) : (
                        <MaxRail title="Popular Searches" items={popular.items} loading={popular.loading} kind="poster" />
                  )}
            </div>
      );
}

function MaxMyStuff() {
      const { list } = useMyList("max");
      const history = useWatchHistory("max");
      useEffect(() => { document.title = "My Stuff | HBX max"; }, []);
      return (
            <div className="mx-page mx-page--pad">
                  <h1 className="mx-pagetitle">My Stuff</h1>
                  {history.length > 0 && <MaxRail title="Continue Watching" items={history} progress />}
                  <h2 className="mx-subtitle">My List</h2>
                  <MaxGrid items={list} kind="tile" empty="Add series and movies to My Stuff with the + button." />
            </div>
      );
}

export default function MaxExperience({ page }) {
      const { pathname } = useLocation();
      let content;
      switch (page) {
            case "movies": content = <MaxBrowse type="movie" />; break;
            case "tv": content = <MaxBrowse type="tv" />; break;
            case "search": content = <MaxSearch />; break;
            case "list": content = <MaxMyStuff />; break;
            case "collection": content = <MaxBrand />; break;
            case "movie": content = <MaxDetails mediaType="movie" />; break;
            case "tvdetail": content = <MaxDetails mediaType="tv" />; break;
            default: content = <MaxHome />;
      }
      return (
            <div className={`mx xp-root ${isImmersivePath(pathname) ? "is-immersive" : ""}`}>
                  <SideRail />
                  <main className="mx-main">{content}</main>
            </div>
      );
}
