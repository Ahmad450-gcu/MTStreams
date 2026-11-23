import { useLocation } from "react-router-dom";
import "./netflix.css";
import NetflixNavigation, { NetflixFooter } from "./NetflixNavigation";
import NetflixHome, { SubNav } from "./NetflixHome";
import NetflixSearch from "./NetflixSearch";
import NetflixDetails from "./NetflixDetails";
import NetflixCollections, { NetflixMyList } from "./NetflixCollections";

/**
 * Notflix — Netflix-inspired experience.
 * page: home | movies | tv | search | list | collection | movie | tvdetail
 */
export default function NetflixExperience({ page, modal }) {
      const { pathname } = useLocation();
      const immersive = /\/(watch|trailer)/.test(pathname);
      const isDetail = page === "movie" || page === "tvdetail";
      const mediaType = page === "tvdetail" ? "tv" : "movie";

      // Rendered by the second <Routes> as an overlay above the background page.
      if (modal) {
            return (
                  <div className="nfx nfx--modal-host">
                        <NetflixDetails mediaType={mediaType} asModal />
                  </div>
            );
      }

      let content;
      switch (page) {
            case "movies":
                  content = <NetflixHome mode="movies" />;
                  break;
            case "tv":
                  content = <NetflixHome mode="tv" />;
                  break;
            case "search":
                  content = <NetflixSearch />;
                  break;
            case "list":
                  content = <NetflixMyList />;
                  break;
            case "collection":
                  content = <NetflixCollections />;
                  break;
            default:
                  content = <NetflixHome mode="home" />;
      }

      return (
            <div className={`nfx xp-root ${immersive ? "is-immersive" : ""}`}>
                  <NetflixNavigation subnav={page === "movies" || page === "tv" ? <SubNav type={page === "tv" ? "tv" : "movie"} /> : null} />
                  <main className="nfx-main">{content}</main>
                  <NetflixFooter />
                  {/* Opened directly (no background page): show the title modal over Home. */}
                  {isDetail && <NetflixDetails mediaType={mediaType} />}
            </div>
      );
}
