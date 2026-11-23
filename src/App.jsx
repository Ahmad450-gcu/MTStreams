import { useEffect } from "react";
import RouterHandler from "../src/routes/RouterHandler";
import { ReactLenis, useLenis } from "lenis/react";
import OfflineOverlay from "./Components/ui/OfflineOverlay.jsx";
import SplashHost from "./experiences/shared/splash/SplashHost.jsx";

const App = () => {
      useLenis();

      // Release Radar alerts (opt-in): check at launch and when the app returns to
      // the foreground. The radar code only loads if alerts are switched on.
      useEffect(() => {
            const maybeCheck = () => {
                  let enabled = false;
                  try {
                        enabled = localStorage.getItem("mtstreams:radar:notify") === "1";
                  } catch {
                        enabled = false;
                  }
                  if (enabled && document.visibilityState === "visible") {
                        import("./features/radar/radar.js").then((radar) => radar.backgroundCheck()).catch(() => {});
                  }
            };
            const timer = setTimeout(maybeCheck, 4000);
            document.addEventListener("visibilitychange", maybeCheck);
            return () => {
                  clearTimeout(timer);
                  document.removeEventListener("visibilitychange", maybeCheck);
            };
      }, []);

      // Tell the launch intro in index.html that the app has painted, so the
      // intro can finish as soon as its minimum duration has passed.
      // Animation frames don't run in a background window, so a short timer is
      // a fallback; whichever comes first wins.
      useEffect(() => {
            let sent = false;
            const ready = () => {
                  if (sent) return;
                  sent = true;
                  window.dispatchEvent(new Event("mtstreams:app-ready"));
            };
            const frame = requestAnimationFrame(() => requestAnimationFrame(ready));
            const timer = setTimeout(ready, 150);
            return () => {
                  cancelAnimationFrame(frame);
                  clearTimeout(timer);
            };
      }, []);

      return (
            <section className="app-shell min-h-dvh bg-[#151618] text-white">
                  {/* smoothWheel off: wheel and touchpad scrolling stay native, so the
                      browser scrolls on its compositor thread and stays smooth even
                      when the page is busy. Lenis still handles programmatic
                      scrolling and pausing the page behind overlays.
                      allowNestedScroll: a sideways touchpad swipe over a row scrolls
                      that row instead of being turned into page scroll. */}
                  <ReactLenis root options={{ smoothWheel: false, allowNestedScroll: true }} />
                  <RouterHandler />
                  <OfflineOverlay />
                  <SplashHost />
            </section>
      );
};

export default App;

