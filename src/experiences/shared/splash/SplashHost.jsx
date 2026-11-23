import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { useExperience } from "../ExperienceContext";

const ExperienceSplash = lazy(() => import("./ExperienceSplash"));

// Same background colours as the launch cover in index.html, used while the
// splash code loads so the new experience's UI never flashes first.
const COVER = { netflix: "#000", prime: "#00050d", max: "#000", disney: "#0b0f24", hulu: "#0b0c0f", paramount: "#050a1c", apple: "#000", mgm: "#000", peacock: "#000", crunchyroll: "#000", hotstar: "#0f1014" };

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Plays an intro when the app opens into an OTT experience (handed over by the
 * launch script in index.html) and whenever the user switches experience,
 * including switching back to MTStreams.
 */
export default function SplashHost() {
      const { experience } = useExperience();
      const [splash, setSplash] = useState(() => (typeof window !== "undefined" && window.__mtLaunchSplash ? { key: window.__mtLaunchSplash, id: 0 } : null));
      const previous = useRef(experience);

      useEffect(() => {
            if (previous.current === experience) return;
            previous.current = experience;
            if (reducedMotion() || document.visibilityState === "hidden") return;
            setSplash({ key: experience, id: Date.now() });
      }, [experience]);

      const done = useCallback(() => setSplash(null), []);
      if (!splash) return null;
      const cover = <div style={{ position: "fixed", inset: 0, zIndex: 2147483000, background: splash.key ? COVER[splash.key] || "#000" : "#06080b" }} aria-hidden="true" />;
      return (
            <Suspense fallback={cover}>
                  <ExperienceSplash key={splash.id} experience={splash.key} onDone={done} />
            </Suspense>
      );
}
