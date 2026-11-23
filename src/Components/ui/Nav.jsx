
import { motion, useReducedMotion } from "framer-motion";
import { Bookmark, Compass, Film, House, LayoutGrid, Search, Tv } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { playSound } from "../../utils/soundEffects.js";

const navItems = [
      { to: "/", icon: House, label: "Home" },
      { to: "/trending", icon: Film, label: "Movies" },
      { to: "/tv", icon: Tv, label: "TV Shows" },
      { to: "/search", icon: Search, label: "Search" },
      { to: "/discover", icon: Compass, label: "Discover" },
      { to: "/library", icon: Bookmark, label: "My List" },
      { to: "/experiences", icon: LayoutGrid, label: "Services" },
];

const NavBar = () => {
      const { pathname } = useLocation();
      const navigate = useNavigate();
      const reducedMotion = useReducedMotion();
      const activeIndex = pathname.startsWith("/experiences") ? 6
            : pathname.startsWith("/library") || pathname.startsWith("/journal") || pathname.startsWith("/radar") ? 5
            : pathname.startsWith("/discover") || pathname.startsWith("/franchise") || pathname.startsWith("/compare") ? 4
            : pathname.startsWith("/tv") ? 2
            : pathname.startsWith("/search") ? 3
            : pathname.startsWith("/person/") ? -1
            : pathname.startsWith("/trending") || pathname.startsWith("/movie/") ? 1
            : 0;

      const isImmersiveRoute = pathname.includes("/watch") || pathname.endsWith("/trailer");


      if (isImmersiveRoute) return null;

      return (
            <header className="bottom-navigation-glass bottom-navigation-glass--sticky">
                  <div className="site-nav__inner">
                        <button type="button" className="site-brand" onClick={() => navigate("/")} aria-label="MTStreams home">
                              <img src="/logo-512.png" alt="" aria-hidden="true" className="site-brand__icon" />
                              <span className="site-brand__word">STREAMS</span>
                        </button>
                        <motion.nav
                              initial={reducedMotion ? false : { y: -8, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              transition={{ duration: 0.3, ease: "easeOut" }}
                              aria-label="Main navigation"
                              className="bottom-navigation"
                        >
                              {navItems.map((item, index) => {
                                    const Icon = item.icon;
                                    const isActive = activeIndex === index;

                                    return (
                                          <motion.button
                                                key={item.to}
                                                type="button"
                                                whileTap={reducedMotion ? undefined : { scale: 0.96 }}
                                                onMouseEnter={() => playSound("nav-hover")}
                                                onClick={() => {
                                                      playSound("nav-select");
                                                      navigate(item.to);
                                                }}
                                                className={`site-nav__link ${isActive ? "is-active" : ""}`}
                                                aria-label={item.label}
                                                aria-current={isActive ? "page" : undefined}
                                          >
                                                <Icon size={18} strokeWidth={isActive ? 2.4 : 1.9} aria-hidden="true" />
                                                <span>{item.label}</span>
                                          </motion.button>
                                    );
                              })}
                        </motion.nav>
                  </div>
            </header>
      );
};

export default NavBar;
