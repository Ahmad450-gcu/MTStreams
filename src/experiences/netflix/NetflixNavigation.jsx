import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Bell, ChevronDown, Download, Home, LayoutGrid, LogOut, PlaySquare, Search, Smile, UserRound, X } from "lucide-react";
import Wordmark, { NetflixMark } from "../shared/Wordmark";
import { useExperience } from "../shared/ExperienceContext";

const LINKS = [
      { to: "/", label: "Home", end: true },
      { to: "/tv", label: "Shows" },
      { to: "/trending", label: "Movies" },
      { to: "/browse/new-popular", label: "New & Popular" },
      { to: "/my-list", label: "My List" },
      { to: "/browse/languages", label: "Browse by Languages" },
];

const PROFILES = [
      { name: "Viewer", color: "#e50914" },
      { name: "Family", color: "#2b7de9" },
      { name: "Guest", color: "#f5c518" },
];

function Avatar({ color = "#e50914", size = 32 }) {
      return (
            <span className="nfx-avatar" style={{ background: color, width: size, height: size }} aria-hidden="true">
                  <Smile size={size * 0.7} strokeWidth={2.4} />
            </span>
      );
}

function SearchBox() {
      const navigate = useNavigate();
      const location = useLocation();
      const [params] = useSearchParams();
      const isSearch = location.pathname === "/search";
      const [open, setOpen] = useState(isSearch);
      const [value, setValue] = useState(isSearch ? params.get("q") || "" : "");
      const inputRef = useRef(null);
      const returnTo = useRef("/");

      useEffect(() => {
            if (!isSearch) {
                  setValue("");
                  returnTo.current = location.pathname + location.search;
            }
      }, [isSearch, location.pathname, location.search]);

      const update = (next) => {
            setValue(next);
            if (next.trim()) navigate(`/search?q=${encodeURIComponent(next)}`, { replace: isSearch });
            else if (isSearch) navigate(returnTo.current || "/", { replace: true });
      };

      return (
            <div className={`nfx-search ${open || value ? "is-open" : ""}`}>
                  <button
                        type="button"
                        className="nfx-search__icon"
                        aria-label="Search"
                        onClick={() => {
                              setOpen(true);
                              requestAnimationFrame(() => inputRef.current?.focus());
                        }}
                  >
                        <Search size={22} strokeWidth={2.2} />
                  </button>
                  <input
                        ref={inputRef}
                        value={value}
                        onChange={(event) => update(event.target.value)}
                        onBlur={() => !value && setOpen(false)}
                        onKeyDown={(event) => event.key === "Escape" && update("")}
                        placeholder="Titles, people, genres"
                        aria-label="Search titles"
                  />
                  {value && (
                        <button type="button" className="nfx-search__clear" aria-label="Clear search" onClick={() => update("")}>
                              <X size={18} />
                        </button>
                  )}
            </div>
      );
}

function ProfileMenu() {
      const [open, setOpen] = useState(false);
      const { setExperience } = useExperience();
      const navigate = useNavigate();
      const timer = useRef(null);

      const show = () => {
            clearTimeout(timer.current);
            setOpen(true);
      };
      const hide = () => {
            timer.current = setTimeout(() => setOpen(false), 250);
      };

      return (
            <div className="nfx-profile" onMouseEnter={show} onMouseLeave={hide}>
                  <button type="button" className="nfx-profile__button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
                        <Avatar />
                        <ChevronDown size={16} className={`nfx-caret ${open ? "is-open" : ""}`} />
                  </button>
                  {open && (
                        <div className="nfx-dropdown" role="menu">
                              <span className="nfx-dropdown__arrow" />
                              <ul className="nfx-dropdown__profiles">
                                    {PROFILES.slice(1).map((profile) => (
                                          <li key={profile.name}>
                                                <Avatar color={profile.color} size={32} />
                                                <span>{profile.name}</span>
                                          </li>
                                    ))}
                              </ul>
                              <ul className="nfx-dropdown__links">
                                    <li><button type="button" onClick={() => navigate("/experiences")}><LayoutGrid size={20} /> Switch Service</button></li>
                                    <li><button type="button" onClick={() => navigate("/my-list")}><PlaySquare size={20} /> My List</button></li>
                                    <li><button type="button" onClick={() => navigate("/experiences")}><UserRound size={20} /> Account</button></li>
                              </ul>
                              <button
                                    type="button"
                                    className="nfx-dropdown__signout"
                                    onClick={() => {
                                          setExperience(null);
                                          navigate("/");
                                    }}
                              >
                                    <LogOut size={16} /> Return to MTStreams
                              </button>
                        </div>
                  )}
            </div>
      );
}

function BrowseMenu() {
      const [open, setOpen] = useState(false);
      const { pathname } = useLocation();
      useEffect(() => setOpen(false), [pathname]);
      return (
            <div className="nfx-browse" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
                  <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
                        Browse <ChevronDown size={14} />
                  </button>
                  {open && (
                        <ul className="nfx-browse__menu">
                              <span className="nfx-dropdown__arrow" />
                              {LINKS.map((link) => (
                                    <li key={link.to}>
                                          <NavLink to={link.to} end={link.end}>{link.label}</NavLink>
                                    </li>
                              ))}
                        </ul>
                  )}
            </div>
      );
}

export default function NetflixNavigation({ subnav }) {
      const [scrolled, setScrolled] = useState(false);

      useEffect(() => {
            const onScroll = () => setScrolled(window.scrollY > 8);
            onScroll();
            window.addEventListener("scroll", onScroll, { passive: true });
            return () => window.removeEventListener("scroll", onScroll);
      }, []);

      return (
            <>
                  <header className={`nfx-header ${scrolled ? "is-scrolled" : ""}`}>
                        <div className="nfx-header__main">
                              <Link to="/" className="nfx-logo" aria-label="Notflix home">
                                    <span className="nfx-logo__full"><Wordmark service="netflix" height={30} /></span>
                                    <span className="nfx-logo__mark"><NetflixMark height={34} /></span>
                              </Link>
                              <BrowseMenu />
                              <ul className="nfx-primary">
                                    {LINKS.map((link) => (
                                          <li key={link.to}>
                                                <NavLink to={link.to} end={link.end}>{link.label}</NavLink>
                                          </li>
                                    ))}
                              </ul>
                              <div className="nfx-secondary">
                                    <SearchBox />
                                    <Link to="/browse/kids" className="nfx-kids">Kids</Link>
                                    <button type="button" className="nfx-bell" aria-label="Notifications">
                                          <Bell size={22} />
                                          <span className="nfx-bell__count">3</span>
                                    </button>
                                    <ProfileMenu />
                              </div>
                        </div>
                        <MobileChips />
                        {subnav}
                  </header>
                  <MobileTabBar />
            </>
      );
}

function MobileChips() {
      const { pathname } = useLocation();
      if (!["/", "/tv", "/trending"].includes(pathname)) return null;
      return (
            <nav className="nfx-mchips" aria-label="Browse">
                  {pathname !== "/" && <NavLink to="/" className="nfx-mchips__close" aria-label="Back to Home"><X size={16} /></NavLink>}
                  {pathname !== "/trending" && <NavLink to="/tv">Shows</NavLink>}
                  {pathname !== "/tv" && <NavLink to="/trending">Movies</NavLink>}
                  <NavLink to="/browse/languages">Categories <ChevronDown size={14} /></NavLink>
            </nav>
      );
}

function MobileTabBar() {
      return (
            <nav className="nfx-tabbar" aria-label="Notflix">
                  <NavLink to="/" end><Home size={22} /><span>Home</span></NavLink>
                  <NavLink to="/browse/new-popular"><PlaySquare size={22} /><span>New &amp; Hot</span></NavLink>
                  <NavLink to="/search"><Search size={22} /><span>Search</span></NavLink>
                  <NavLink to="/my-list"><Download size={22} /><span>My Notflix</span></NavLink>
            </nav>
      );
}

export function NetflixFooter() {
      const groups = [
            ["Audio Description", "Investor Relations", "Legal Notices"],
            ["Help Center", "Jobs", "Cookie Preferences"],
            ["Gift Cards", "Terms of Use", "Corporate Information"],
            ["Media Center", "Privacy", "Contact Us"],
      ];
      return (
            <footer className="nfx-footer">
                  <div className="nfx-footer__links">
                        {groups.map((group) => (
                              <ul key={group[0]}>
                                    {group.map((label) => (
                                          <li key={label}>{label === "Privacy" ? <Link to="/privacy">{label}</Link> : <span>{label}</span>}</li>
                                    ))}
                              </ul>
                        ))}
                  </div>
                  <span className="nfx-footer__code">Service Code</span>
                  <p className="nfx-footer__copy">Notflix is a fan-made interface inside MTStreams. Not affiliated with any streaming service.</p>
            </footer>
      );
}
