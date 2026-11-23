import { Suspense, lazy } from "react";
import { Navigate } from "react-router-dom";
import { useExperience } from "./shared/ExperienceContext";

// Each experience is an independent, lazily loaded module with its own
// navigation, pages, cards and styles. The gate only decides which module
// renders a route; with no experience selected the original MTStreams page
// (`fallback`) renders exactly as before.
const EXPERIENCES = {
      netflix: lazy(() => import("./netflix/NetflixExperience")),
      prime: lazy(() => import("./prime-video/PrimeExperience")),
      max: lazy(() => import("./max/MaxExperience")),
      disney: lazy(() => import("./disney-plus/DisneyExperience")),
      hulu: lazy(() => import("./hulu/HuluExperience")),
      paramount: lazy(() => import("./paramount-plus/ParamountExperience")),
      apple: lazy(() => import("./apple-tv/AppleExperience")),
      mgm: lazy(() => import("./mgm-plus/MgmExperience")),
      peacock: lazy(() => import("./peacock/PeacockExperience")),
      crunchyroll: lazy(() => import("./crunchyroll/CrunchyrollExperience")),
      hotstar: lazy(() => import("./jiohotstar/HotstarExperience")),
};

/**
 * page: "home" | "movies" | "tv" | "search" | "movie" | "tvdetail" | "list" | "collection"
 */
export default function ExperienceGate({ page, fallback = null, modal = false }) {
      const { experience, service } = useExperience();
      const Experience = experience ? EXPERIENCES[experience] : null;

      if (!Experience) {
            return fallback ?? <Navigate to="/" replace />;
      }

      return (
            <Suspense
                  fallback={
                        <div className="xp-loading" style={{ background: service.background, "--xp-accent": service.accent }}>
                              <span />
                        </div>
                  }
            >
                  <Experience page={page} modal={modal} />
            </Suspense>
      );
}
