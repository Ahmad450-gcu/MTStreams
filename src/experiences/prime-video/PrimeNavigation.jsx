import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Bookmark, Clapperboard, Home, LayoutGrid, LogOut, Search, Tv, UserRound, X } from "lucide-react";
import Wordmark from "../shared/Wordmark";
import { useExperience } from "../shared/ExperienceContext";
import { useScrolled } from "../shared/navigation";
import { MOVIE_GENRES } from "../shared/services";

const LINKS = [
      { to: "/", label: "Home", end: true },
      { to: "/trending", label: "Movies" },
      { to: "/tv", label: "TV Shows" },
      { to: "/browse/categories", label: "Categories" },
];

function SearchOverlay({ onClose }) {
      const navigate = useNavigate();
      const [value, setValue] = useState("");
      const input = useRef(null);
      useEffect(() => input.current?.focus(), []);
      return (
            <form
                  className="pv-searchbar"
                  onSubmit={(event) => {
                        event.preventDefault();
                        if (value.trim()) navigate(`/search?q=${encodeURIComponent(value.trim())}`);
                        onClose();
                  }}
            >
                  <Search size={22} />
                  <input ref={input} value={value} onChange={(event) => setValue(event.target.value)} placeholder="Search" aria-label="Search prima video" onKeyDown={(event) => event.key === "Escape" && onClose()} />
                  <button type="button" onClick={onClose} aria-label="Close search"><X size={22} /></button>
            </form>
      );
}

function ProfileMenu() {
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
            <div className="pv-profile" ref={ref}>
                  <button type="button" className="pv-profile__avatar" onClick={() => setOpen((value) => !value)} aria-label="Account and profiles" aria-expanded={open}>
                        <UserRound size={20} />
                  </button>
                  {open && (
                        <div className="pv-menu pv-menu--profile">
                              <div className="pv-menu__section">
                                    <h4>Your Account</h4>
                                    <button type="button" onClick={() => navigate("/my-list")}>Watchlist</button>
                                    <button type="button" onClick={() => navigate("/experiences")}>Switch service</button>
                                    <button type="button" onClick={() => { setExperience(null); navigate("/"); }}><LogOut size={14} /> Return to MTStreams</button>
                              </div>
                              <div className="pv-menu__section">
                                    <h4>Profiles</h4>
                                    <span className="pv-menu__profile is-active"><span>V</span> Viewer</span>
                                    <span className="pv-menu__profile"><span className="is-kids">K</span> Kids</span>
                              </div>
                        </div>
                  )}
            </div>
      );
}

export default function PrimeNavigation() {
      const scrolled = useScrolled(4);
      const [search, setSearch] = useState(false);
      const [categories, setCategories] = useState(false);
      const { pathname } = useLocation();
      useEffect(() => {
            setSearch(false);
            setCategories(false);
      }, [pathname]);

      return (
            <>
                  <header className={`pv-nav ${scrolled ? "is-solid" : ""}`}>
                        <div className="pv-nav__bar">
                              <Link to="/" className="pv-nav__logo" aria-label="prima video home"><Wordmark service="prime" height={30} /></Link>
                              {search ? (
                                    <SearchOverlay onClose={() => setSearch(false)} />
                              ) : (
                                    <>
                                          <nav className="pv-nav__links" aria-label="prima video">
                                                {LINKS.map((link) =>
                                                      link.to === "/browse/categories" ? (
                                                            <div key={link.to} className="pv-nav__cat" onMouseEnter={() => setCategories(true)} onMouseLeave={() => setCategories(false)}>
                                                                  <NavLink to={link.to}>{link.label}</NavLink>
                                                                  {categories && (
                                                                        <div className="pv-menu pv-menu--cats">
                                                                              <h4>Genres</h4>
                                                                              <div className="pv-menu__grid">
                                                                                    {Object.entries(MOVIE_GENRES).filter(([id]) => id !== "10770").map(([id, name]) => (
                                                                                          <Link key={id} to={`/trending?genre=${id}`}>{name}</Link>
                                                                                    ))}
                                                                              </div>
                                                                        </div>
                                                                  )}
                                                            </div>
                                                      ) : (
                                                            <NavLink key={link.to} to={link.to} end={link.end}>{link.label}</NavLink>
                                                      )
                                                )}
                                          </nav>
                                          <div className="pv-nav__tools">
                                                <button type="button" onClick={() => setSearch(true)} aria-label="Search"><Search size={24} /></button>
                                                <NavLink to="/my-list" aria-label="My Stuff" className="pv-nav__stuff"><Bookmark size={22} /></NavLink>
                                                <ProfileMenu />
                                          </div>
                                    </>
                              )}
                        </div>
                  </header>
                  <nav className="pv-tabbar" aria-label="prima video">
                        <NavLink to="/" end><Home size={22} /><span>Home</span></NavLink>
                        <NavLink to="/trending"><Clapperboard size={22} /><span>Movies</span></NavLink>
                        <NavLink to="/tv"><Tv size={22} /><span>TV</span></NavLink>
                        <NavLink to="/search"><Search size={22} /><span>Find</span></NavLink>
                        <NavLink to="/my-list"><LayoutGrid size={22} /><span>My Stuff</span></NavLink>
                  </nav>
            </>
      );
}
