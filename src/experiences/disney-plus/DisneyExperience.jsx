import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Clapperboard, Home, LayoutGrid, LogOut, Plus, Search, Star, Tv } from "lucide-react";
import "./disney.css";
import Wordmark from "../shared/Wordmark";
import { useExperience } from "../shared/ExperienceContext";
import { isImmersivePath, useScrolled } from "../shared/navigation";
import { useDebounced, useMyList, useServiceSearch } from "../shared/hooks";
import { MOVIE_GENRES, TV_GENRES } from "../shared/services";
import { BRANDS, BrandWordmark, CatalogueRow, DisneyGrid, DisneyHome, Lazy } from "./DisneyHome";
import DisneyDetails from "./DisneyDetails";

const NAV = [
      { to: "/", label: "HOME", icon: Home, end: true },
      { to: "/search", label: "SEARCH", icon: Search },
      { to: "/my-list", label: "WATCHLIST", icon: Plus },
      { to: "/browse/originals", label: "ORIGINALS", icon: Star },
      { to: "/trending", label: "MOVIES", icon: Clapperboard },
      { to: "/tv", label: "SERIES", icon: Tv },
];

function Header() {
      const scrolled = useScrolled(10);
      const { setExperience } = useExperience();
      const navigate = useNavigate();
      const [open, setOpen] = useState(false);
      const ref = useRef(null);
      // A short grace period before the hover menu closes, so moving the mouse
      // from the avatar down into the menu doesn't dismiss it.
      const closeTimer = useRef(null);
      const openMenu = () => {
            clearTimeout(closeTimer.current);
            setOpen(true);
      };
      const closeSoon = () => {
            clearTimeout(closeTimer.current);
            closeTimer.current = setTimeout(() => setOpen(false), 220);
      };
      useEffect(() => {
            const close = (event) => !ref.current?.contains(event.target) && setOpen(false);
            document.addEventListener("mousedown", close);
            return () => {
                  document.removeEventListener("mousedown", close);
                  clearTimeout(closeTimer.current);
            };
      }, []);
      return (
            <>
                  <header className={`dp-header ${scrolled ? "is-solid" : ""}`}>
                        <NavLink to="/" className="dp-header__logo" aria-label="Dizney+ home"><Wordmark service="disney" height={52} /></NavLink>
                        <nav className="dp-header__nav" aria-label="Dizney+">
                              {NAV.map(({ to, label, icon: Icon, end }) => (
                                    <NavLink key={to} to={to} end={end}><Icon size={18} strokeWidth={2.4} /><span>{label}</span></NavLink>
                              ))}
                        </nav>
                        <div className="dp-header__profile" ref={ref} onMouseEnter={openMenu} onMouseLeave={closeSoon}>
                              <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
                                    <span className="dp-header__name">Viewer</span>
                                    <span className="dp-avatar">V</span>
                              </button>
                              {open && (
                                    <div className="dp-header__menu">
                                          <div className="dp-header__profiles"><span className="dp-avatar dp-avatar--kids">K</span> Kids</div>
                                          <hr />
                                          <button type="button" onClick={() => navigate("/experiences")}><LayoutGrid size={16} /> Switch Service</button>
                                          <button type="button" onClick={() => navigate("/my-list")}>Watchlist</button>
                                          <button type="button" onClick={() => { setExperience(null); navigate("/"); }}><LogOut size={16} /> Return to MTStreams</button>
                                    </div>
                              )}
                        </div>
                  </header>
                  <nav className="dp-tabbar" aria-label="Dizney+">
                        {NAV.filter((item) => ["/", "/search", "/my-list", "/trending", "/tv"].includes(item.to)).map(({ to, label, icon: Icon, end }) => (
                              <NavLink key={to} to={to} end={end} aria-label={label}><Icon size={24} /></NavLink>
                        ))}
                  </nav>
            </>
      );
}

function DisneyBrowse({ type }) {
      const [params, setParams] = useSearchParams();
      const genres = type === "tv" ? TV_GENRES : MOVIE_GENRES;
      const genre = params.get("genre") || "";
      const label = type === "tv" ? "Series" : "Movies";
      useEffect(() => { document.title = `${label} | Dizney+`; }, [label]);
      return (
            <div className="dp-page dp-page--pad">
                  <div className="dp-browsebar">
                        <h1>{label}</h1>
                        <select value={genre} onChange={(event) => setParams(event.target.value ? { genre: event.target.value } : {})} aria-label="Genre">
                              <option value="">All {label}</option>
                              {Object.entries(genres).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                        </select>
                  </div>
                  <DisneyGrid key={`${type}-${genre}`} spec={{ types: [type], sort: "popular", ...(genre ? { genres: genre } : {}) }} portrait={type === "movie"} />
            </div>
      );
}

function DisneyCollection() {
      const { slug } = useParams();
      const brand = BRANDS.find((entry) => entry.slug === slug);
      useEffect(() => { document.title = `${brand?.name || "Originals"} | Dizney+`; }, [brand]);
      if (!brand) {
            return (
                  <div className="dp-page dp-page--pad">
                        <h1 className="dp-pagetitle">Originals</h1>
                        <CatalogueRow title="Series" spec={{ types: ["tv"], sort: "new", windowDays: 1200, minVotes: 30 }} portrait />
                        <CatalogueRow title="Movies" spec={{ types: ["movie"], sort: "new", windowDays: 1200, minVotes: 30 }} />
                        <Lazy><CatalogueRow title="Documentaries" spec={{ types: ["movie", "tv"], sort: "popular", genres: "99" }} /></Lazy>
                  </div>
            );
      }
      const spec = { types: ["movie", "tv"], companies: brand.companies };
      return (
            <div className="dp-page">
                  <header className="dp-brandhero" style={{ background: brand.bg }}>
                        <BrandWordmark brand={brand} large />
                  </header>
                  <div className="dp-rows dp-rows--flat">
                        <CatalogueRow title="Popular" spec={{ ...spec, sort: "popular" }} />
                        <CatalogueRow title="Movies" spec={{ ...spec, types: ["movie"], sort: "top", minVotes: 50 }} portrait />
                        <Lazy><CatalogueRow title="Series" spec={{ ...spec, types: ["tv"], sort: "popular" }} /></Lazy>
                        <h2 className="dp-row__title dp-row__title--pad">All {brand.name}</h2>
                        <DisneyGrid spec={{ ...spec, sort: "popular" }} />
                  </div>
            </div>
      );
}

function DisneySearch() {
      const [params] = useSearchParams();
      const navigate = useNavigate();
      const [draft, setDraft] = useState(params.get("q") || "");
      const debounced = useDebounced(draft, 350);
      const search = useServiceSearch("disney", debounced);
      useEffect(() => {
            navigate(debounced ? `/search?q=${encodeURIComponent(debounced)}` : "/search", { replace: true });
            document.title = "Search | Dizney+";
      }, [debounced, navigate]);
      return (
            <div className="dp-search">
                  <input className="dp-search__input" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Search by title, character, or genre" autoFocus aria-label="Search" />
                  <div className="dp-page dp-page--search">
                        {debounced.trim().length >= 2 ? (
                              <>
                                    <DisneyGrid items={search.items} empty={search.loading ? "" : `No results found for "${debounced}".`} />
                                    {search.loading && <div className="dp-grid">{Array.from({ length: 5 }).map((_, index) => <span key={index} className="dp-tile dp-tile--skel xp-skeleton" />)}</div>}
                                    {search.error && <div className="dp-error"><span>{search.error}</span><button type="button" onClick={search.retry}>RETRY</button></div>}
                                    {search.hasMore && !search.loading && search.items.length > 0 && <button type="button" className="dp-loadmore" onClick={search.loadMore}>LOAD MORE</button>}
                              </>
                        ) : (
                              <>
                                    <h2 className="dp-row__title dp-row__title--pad">Explore</h2>
                                    <div className="dp-explore">
                                          {[...BRANDS.map((brand) => ({ to: `/browse/${brand.slug}`, label: brand.name, bg: brand.bg })),
                                                { to: "/trending?genre=16", label: "Animation", bg: "linear-gradient(135deg,#1d4ed8,#0b1d5a)" },
                                                { to: "/trending?genre=10751", label: "Family", bg: "linear-gradient(135deg,#047857,#022c22)" },
                                                { to: "/tv?genre=10759", label: "Action & Adventure", bg: "linear-gradient(135deg,#b91c1c,#3f0b0b)" },
                                                { to: "/trending?genre=35", label: "Comedy", bg: "linear-gradient(135deg,#d97706,#3f1d02)" },
                                                { to: "/tv?genre=99", label: "Docuseries", bg: "linear-gradient(135deg,#334155,#0f172a)" },
                                          ].map((tile) => (
                                                <button key={tile.to} type="button" className="dp-explore__tile" style={{ background: tile.bg }} onClick={() => navigate(tile.to)}>{tile.label}</button>
                                          ))}
                                    </div>
                              </>
                        )}
                  </div>
            </div>
      );
}

function DisneyWatchlist() {
      const { list } = useMyList("disney");
      useEffect(() => { document.title = "Watchlist | Dizney+"; }, []);
      return (
            <div className="dp-page dp-page--pad">
                  <h1 className="dp-pagetitle">Watchlist</h1>
                  <DisneyGrid items={list} empty="Your watchlist is empty. Add titles with the + button on any details page." />
            </div>
      );
}

export default function DisneyExperience({ page }) {
      const { pathname } = useLocation();
      let content;
      switch (page) {
            case "movies": content = <DisneyBrowse type="movie" />; break;
            case "tv": content = <DisneyBrowse type="tv" />; break;
            case "search": content = <DisneySearch />; break;
            case "list": content = <DisneyWatchlist />; break;
            case "collection": content = <DisneyCollection />; break;
            case "movie": content = <DisneyDetails mediaType="movie" />; break;
            case "tvdetail": content = <DisneyDetails mediaType="tv" />; break;
            default: content = <DisneyHome />;
      }
      return (
            <div className={`dp xp-root ${isImmersivePath(pathname) ? "is-immersive" : ""}`}>
                  <Header />
                  <main className="dp-main">{content}</main>
            </div>
      );
}
