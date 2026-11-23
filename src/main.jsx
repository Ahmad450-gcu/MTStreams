import { createRoot } from "react-dom/client";
import "./index.css";
import "glisse/styles.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store/store.jsx";
import AnalyticsTracker from "./analytics/AnalyticsTracker.jsx";
import { initializeAnalytics } from "./analytics/posthog.js";
import { ExperienceProvider } from "./experiences/shared/ExperienceContext.jsx";
import "./experiences/shared/experiences.css";
import "./theme/theme.css";

initializeAnalytics();

createRoot(document.getElementById("root")).render(
      <Provider store={store}>
            <BrowserRouter>
                  <ExperienceProvider>
                        <AnalyticsTracker />
                        <App />
                  </ExperienceProvider>
            </BrowserRouter>
      </Provider>
);

// Register the offline app shell only for production builds. In development,
// remove any older MTStreams worker so it cannot serve stale Vite assets.
if ("serviceWorker" in navigator) {
      if (import.meta.env.PROD) {
            window.addEventListener("load", () => {
                  navigator.serviceWorker
                        .register("/serviceworker.js")
                        .catch((error) => console.warn("MTStreams offline support could not start:", error.message));
            });
      } else {
            navigator.serviceWorker.getRegistrations()
                  .then((registrations) => {
                        registrations
                              .filter((registration) => {
                                    const workers = [registration.active, registration.waiting, registration.installing];
                                    return workers.some((worker) => worker?.scriptURL === `${window.location.origin}/serviceworker.js`);
                              })
                              .forEach((registration) => registration.unregister());
                  })
                  .catch(() => {
                        // Development can continue even if a stale worker cannot be removed.
                  });
      }
}
