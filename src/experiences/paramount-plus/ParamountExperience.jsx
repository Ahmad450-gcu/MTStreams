import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ChevronDown, Clapperboard, Home, LayoutGrid, LogOut, Search, Star, Tv, X } from "lucide-react";
import "./paramount.css";
import Wordmark from "../shared/Wordmark";
import { useExperience } from "../shared/ExperienceContext";
import { isImmersivePath, useScrolled } from "../shared/navigation";
import { useDebounced, useMyList, useServiceSearch, useWatchHistory } from "../shared/hooks";
import { MOVIE_GENRES, TV_GENRES } from "../shared/services";
import { BRANDS, BrandMark, CatalogueRow, Lazy, ParamountGrid, ParamountHome, ParamountRow } from "./ParamountHome";
import ParamountDetails from "./ParamountDetails";

function Header() {
      const scrolled = useScrolled(8);
      const { setExperience } = useExperience();
      const navigate = useNavigate();
      const [brands, setBrands] = useState(false);
      const [profile, setProfile] = useState(false);
      const ref = useRef(null);
      const { pathname } = useLocation();
      useEffect(() => { setBrands(false); setProfile(false); }, [pathname]);
      useEffect(() => {
            const close = (event) => !ref.current?.contains(event.target) && setProfile(false);
            document.addEventListener("mousedown", close);
            return () => document.removeEventListener("mousedown", close);
      }, []);
      return (
            <>
                  <header className={`pp-header ${scrolled ? "is-solid" : ""}`}>
                        <Link to="/" className="pp-header__logo" aria-label="Paramont+ home"><Wordmark service="paramount" height={38} /></Link>
                        <nav className="pp-header__nav" aria-label="Paramont+">
                              <NavLink to="/" end>Home</NavLink>
                              <NavLink to="/tv">Shows</NavLink>
                              <NavLink to="/trending">Movies</NavLink>
                              <div className="pp-header__brands" onMouseEnter={() => setBrands(true)} onMouseLeave={() => setBrands(false)}>
                                    <button type="button" onClick={() => setBrands((value) => !value)} aria-expanded={brands}>Brands <ChevronDown size={14} /></button>
                                    {brands && (
                                          <div className="pp-dropdown">
                                                {BRANDS.map((brand) => <Link key={brand.slug} to={`/browse/${brand.slug}`}>{brand.name}</Link>)}
                                          </div>
                                    )}
                              </div>
                              <NavLink to="/my-list">My List</NavLink>
                        </nav>
                        <div className="pp-header__right">
                              <NavLink to="/search" className="pp-header__icon" aria-label="Search"><Search size={22} /></NavLink>
                              <div className="pp-header__profile" ref={ref}>
                                    <button type="button" onClick={() => setProfile((value) => !value)} aria-expanded={profile}><span className="pp-avatar">V</span><ChevronDown size={14} /></button>
                                    {profile && (
                                          <div className="pp-dropdown pp-dropdown--right">
                                                <button type="button" onClick={() => navigate("/experiences")}><LayoutGrid size={16} /> Switch Service</button>
                                                <button type="button" onClick={() => navigate("/my-list")}>My List</button>
                                                <button type="button" onClick={() => { setExperience(null); navigate("/"); }}><LogOut size={16} /> Return to MTStreams</button>
                                          </div>
                                    )}
                              </div>
                        </div>
                  </header>
                  <nav className="pp-tabbar" aria-label="Paramont+">
                        <NavLink to="/" end><Home size={22} /><span>Home</span></NavLink>
                        <NavLink to="/tv"><Tv size={22} /><span>Shows</span></NavLink>
                        <NavLink to="/trending"><Clapperboard size={22} /><span>Movies</span></NavLink>
                        <NavLink to="/search"><Search size={22} /><span>Search</span></NavLink>
                        <NavLink to="/my-list"><Star size={22} /><span>My List</span></NavLink>
                  </nav>
            </>
      );
}

function ParamountBrowse({ type }) {
      const [params, setParams] = useSearchParams();
      const genres = type === "tv" ? TV_GENRES : MOVIE_GENRES;
      const genre = params.get("genre") || "";
      const label = type === "tv" ? "Shows" : "Movies";
      useEffect(() => { document.title = `${label} | Paramont+`; }, [label]);
      return (
            <div className="pp-page pp-page--pad">
                  <div className="pp-browsehead">
                        <h1>{label}</h1>
                        <div className="pp-filter xp-scroll-x">
                              <button type="button" className={!genre ? "is-active" : ""} onClick={() => setParams({})}>All {label}</button>
                              {Object.entries(genres).map(([id, name]) => <button key={id} type="button" className={genre === id ? "is-active" : ""} onClick={() => setParams({ genre: id })}>{name}</button>)}
                        </div>
                  </div>
                  {!genre && (
                        <>
                              <CatalogueRow title={`Trending ${label}`} spec={{ types: [type], sort: "trending" }} />
                              <Lazy><CatalogueRow title={`New ${label}`} spec={{ types: [type], sort: "new" }} wide /></Lazy>
                              <h2 className="pp-subtitle">All {label} A–Z</h2>
                        </>
                  )}
                  <ParamountGrid key={`${type}-${genre}`} spec={{ types: [type], sort: genre ? "popular" : "alpha", ...(genre ? { genres: genre } : {}) }} />
            </div>
      );
}

function ParamountBrand() {
      const { slug } = useParams();
      const brand = BRANDS.find((entry) => entry.slug === slug);
      useEffect(() => { document.title = `${brand?.name || "Brands"} | Paramont+`; }, [brand]);
      if (!brand) {
            return (
                  <div className="pp-page pp-page--pad">
                        <h1 className="pp-pagetitle">Brands</h1>
                        <div className="pp-brandgrid">
                              {BRANDS.map((entry) => <Link key={entry.slug} to={`/browse/${entry.slug}`} className="pp-brand"><BrandMark brand={entry} /></Link>)}
                        </div>
                  </div>
            );
      }
      return (
            <div className="pp-page pp-page--pad">
                  <header className="pp-brandhero"><BrandMark brand={brand} /></header>
                  <CatalogueRow title="Popular" spec={{ ...brand.spec, sort: "popular" }} />
                  <h2 className="pp-subtitle">All {brand.name}</h2>
                  <ParamountGrid spec={{ ...brand.spec, sort: "top", minVotes: 30 }} />
            </div>
      );
}

function ParamountSearch() {
      const [params] = useSearchParams();
      const navigate = useNavigate();
      const [draft, setDraft] = useState(params.get("q") || "");
      const debounced = useDebounced(draft, 350);
      const search = useServiceSearch("paramount", debounced);
      useEffect(() => {
            navigate(debounced ? `/search?q=${encodeURIComponent(debounced)}` : "/search", { replace: true });
            document.title = "Search | Paramont+";
      }, [debounced, navigate]);
      return (
            <div className="pp-page pp-page--pad">
                  <div className="pp-searchbar">
                        <Search size={24} />
                        <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Search for shows, movies, and more" autoFocus aria-label="Search" />
                        {draft && <button type="button" onClick={() => setDraft("")} aria-label="Clear"><X size={20} /></button>}
                  </div>
                  {debounced.trim().length >= 2 ? (
                        <>
                              <h2 className="pp-subtitle">{search.items.length ? "Results" : ""}</h2>
                              <ParamountGrid items={search.items} empty={search.loading ? "" : `We couldn't find a match for "${debounced}".`} />
                              {search.loading && <div className="pp-grid">{Array.from({ length: 7 }).map((_, index) => <span key={index} className="pp-poster xp-skeleton" />)}</div>}
                              {search.error && <div className="pp-error"><span>{search.error}</span><button type="button" onClick={search.retry}>TRY AGAIN</button></div>}
                              {search.hasMore && !search.loading && search.items.length > 0 && <button type="button" className="pp-loadmore" onClick={search.loadMore}>LOAD MORE</button>}
                        </>
                  ) : (
                        <CatalogueRow title="Popular Searches" spec={{ types: ["tv", "movie"], sort: "trending" }} />
                  )}
            </div>
      );
}

function ParamountMyList() {
      const { list } = useMyList("paramount");
      const history = useWatchHistory("paramount");
      useEffect(() => { document.title = "My List | Paramont+"; }, []);
      return (
            <div className="pp-page pp-page--pad">
                  <h1 className="pp-pagetitle">My List</h1>
                  {history.length > 0 && <ParamountRow title="Keep Watching" items={history} wide progress />}
                  <ParamountGrid items={list} empty="Add shows and movies to My List to watch them later." />
            </div>
      );
}

export default function ParamountExperience({ page }) {
      const { pathname } = useLocation();
      let content;
      switch (page) {
            case "movies": content = <ParamountBrowse type="movie" />; break;
            case "tv": content = <ParamountBrowse type="tv" />; break;
            case "search": content = <ParamountSearch />; break;
            case "list": content = <ParamountMyList />; break;
            case "collection": content = <ParamountBrand />; break;
            case "movie": content = <ParamountDetails mediaType="movie" />; break;
            case "tvdetail": content = <ParamountDetails mediaType="tv" />; break;
            default: content = <ParamountHome />;
      }
      return (
            <div className={`pp xp-root ${isImmersivePath(pathname) ? "is-immersive" : ""}`}>
                  <Header />
                  <main className="pp-main">{content}</main>
            </div>
      );
}
