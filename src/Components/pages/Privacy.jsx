import { Link } from "react-router-dom";

const Privacy = () => {
      return (
            <main className="min-h-dvh bg-[#151618] px-5 py-12 text-gray-300 sm:px-8">
                  <article className="mx-auto max-w-4xl">
                        <Link to="/" className="mb-8 inline-block text-sm text-emerald-400 hover:text-emerald-300">
                              ? Back to MTStreams
                        </Link>

                        <h1 className="mb-3 text-3xl font-bold text-white sm:text-4xl">
                              Privacy Policy
                        </h1>
                        <p className="mb-10 text-sm text-gray-500">
                              Effective date: November 23, 2026
                        </p>

                        <div className="space-y-8 leading-7">
                              <section>
                                    <h2 className="mb-3 text-xl font-semibold text-white">1. Introduction</h2>
                                    <p>
                                          Welcome to MTStreams. This Privacy Policy explains how information may be
                                          processed when you use MTStreams through our website or Windows application.
                                          MTStreams is a movie and television discovery application that relies on
                                          third-party services for content information, trailers, and playback.
                                    </p>
                              </section>

                              <section>
                                    <h2 className="mb-3 text-xl font-semibold text-white">2. Information We Process</h2>
                                    <p className="mb-3">
                                          When you use MTStreams, information may be processed to provide the
                                          application's features.
                                    </p>
                                    <p className="mb-3">
                                          <strong className="text-white">Search and content information:</strong>{" "}
                                          Search terms may be sent to The Movie Database (TMDB) to retrieve matching
                                          titles. When the Internet Archive search feature is used, the relevant movie
                                          title is sent to the Internet Archive.
                                    </p>
                                    <p className="mb-3">
                                          <strong className="text-white">Technical information:</strong>{" "}
                                          Our hosting provider and third-party services may process information such as
                                          IP addresses, browser type, device information, request details, and
                                          connection timestamps to provide and maintain their services.
                                    </p>
                                    <p>
                                          <strong className="text-white">Playback information:</strong>{" "}
                                          When you open an external playback provider, the selected movie or episode
                                          information may be included in the provider URL. That provider may receive
                                          this information along with technical information about your connection.
                                    </p>
                              </section>

                              <section>
                                    <h2 className="mb-3 text-xl font-semibold text-white">3. Analytics and Tracking</h2>
                                    <p className="mb-4">
                                          MTStreams uses PostHog, a product analytics service, to understand how the
                                          app is used and to find problems. No account or sign-in is involved. PostHog
                                          gives your browser a random anonymous ID, and we do not know who you are.
                                    </p>
                                    <p className="mb-4">
                                          We collect the pages you open, which titles you view, when you open a trailer
                                          or a watch page, how far a trailer plays, clicks and taps, errors, and page
                                          speed. PostHog also records your approximate location (country and city,
                                          worked out from your IP address), your browser, device type, screen size, and
                                          the site that referred you. For searches we record only how long the search
                                          was and how many results it returned, never the words you typed.
                                    </p>
                                    <p className="mb-4">
                                          <strong className="text-white">Session replay.</strong> Visits may be
                                          recorded as a replay of the MTStreams interface (what was on screen, scrolling,
                                          clicks and taps) so we can see where the app is confusing or broken. Everything
                                          typed into text fields is hidden in replays, and we do not record network
                                          data or the browser console. Video players from other sites, including
                                          YouTube trailers and playback providers, are not recorded.
                                    </p>
                                    <p>
                                          Analytics data is stored by PostHog in the United States and is used only to
                                          improve MTStreams. We do not sell it or use it for advertising. You can block
                                          collection with a content or tracker blocker, or by clearing site data, which
                                          also resets your anonymous ID. See the{" "}
                                          <a className="text-emerald-400 hover:underline" href="https://posthog.com/privacy" target="_blank" rel="noreferrer">
                                                PostHog Privacy Policy
                                          </a>
                                          .
                                    </p>
                              </section>

                              <section>
                                    <h2 className="mb-3 text-xl font-semibold text-white">4. Third-Party Services</h2>
                                    <p className="mb-4">
                                          MTStreams relies on third-party services. These services operate
                                          independently and have their own privacy policies and data-handling
                                          practices.
                                    </p>
                                    <div className="space-y-4">
                                          <div>
                                                <h3 className="font-semibold text-white">The Movie Database (TMDB)</h3>
                                                <p>
                                                      We use TMDB for movie, television, cast, genre, and related
                                                      information. Images may also load from TMDB image servers.
                                                </p>
                                                <a className="text-emerald-400 hover:underline" href="https://www.themoviedb.org/privacy-policy" target="_blank" rel="noreferrer">
                                                      TMDB Privacy Policy
                                                </a>
                                          </div>
                                          <div>
                                                <h3 className="font-semibold text-white">YouTube</h3>
                                                <p>
                                                      Trailers may be displayed through YouTube's embedded player.
                                                      YouTube may process information when its player is loaded or used.
                                                </p>
                                                <a className="text-emerald-400 hover:underline" href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
                                                      Google Privacy Policy
                                                </a>
                                          </div>
                                          <div>
                                                <h3 className="font-semibold text-white">Internet Archive</h3>
                                                <p>
                                                      MTStreams may use Internet Archive to search for and retrieve
                                                      available media metadata and content information.
                                                </p>
                                                <a className="text-emerald-400 hover:underline" href="https://archive.org/about/terms.php" target="_blank" rel="noreferrer">
                                                      Internet Archive Terms
                                                </a>
                                          </div>
                                          <div>
                                                <h3 className="font-semibold text-white">External Playback Providers</h3>
                                                <p>
                                                      MTStreams offers embedded players from independent third-party
                                                      playback providers. These providers may process your IP address,
                                                      device and browser information, requested content identifiers,
                                                      cookies, and other technical information. MTStreams does not
                                                      control their privacy practices, data collection, or availability.
                                                      Please review their policies before using their players.
                                                </p>
                                          </div>
                                    </div>
                              </section>

                              <section>
                                    <h2 className="mb-3 text-xl font-semibold text-white">5. Cookies and Local Storage</h2>
                                    <p>
                                          PostHog stores your anonymous analytics ID and the current session in a
                                          first-party cookie and in your browser&apos;s local storage. MTStreams also keeps
                                          My List, your journal, and your preferences in local storage on your device;
                                          these stay on your device. MTStreams may use browser-managed caching
                                          and storage, including service worker and cache functionality, to support
                                          performance and offline access. Third-party services embedded in or
                                          accessed through MTStreams may independently use cookies or similar
                                          technologies.
                                    </p>
                              </section>

                              <section>
                                    <h2 className="mb-3 text-xl font-semibold text-white">6. How Information Is Used</h2>
                                    <p>
                                          Information processed through MTStreams and its service providers may be
                                          used to retrieve content information, provide search functionality, display
                                          trailers and media, load external playback services, maintain application
                                          functionality and security, and support offline access and caching.
                                    </p>
                              </section>

                              <section>
                                    <h2 className="mb-3 text-xl font-semibold text-white">7. Data Sharing</h2>
                                    <p>
                                          MTStreams does not sell users' personal information. Information may be
                                          processed by third-party services when their functionality is used,
                                          including TMDB, YouTube, Internet Archive, external playback providers,
                                          and our hosting infrastructure. Each service is responsible for its own
                                          privacy practices.
                                    </p>
                              </section>

                              <section>
                                    <h2 className="mb-3 text-xl font-semibold text-white">8. Data Retention and Security</h2>
                                    <p>
                                          Technical information may be retained by hosting providers and third-party
                                          services according to their own retention policies. We take reasonable
                                          steps to maintain the security of the application and its infrastructure.
                                          However, no internet transmission or electronic storage method can be
                                          guaranteed to be completely secure.
                                    </p>
                              </section>

                              <section>
                                    <h2 className="mb-3 text-xl font-semibold text-white">9. Children's Privacy</h2>
                                    <p>
                                          MTStreams does not intentionally request personal information from children
                                          through an account registration process. Parents and guardians should
                                          supervise children's use of third-party services and embedded media.
                                    </p>
                              </section>

                              <section>
                                    <h2 className="mb-3 text-xl font-semibold text-white">10. External Websites and Services</h2>
                                    <p>
                                          MTStreams may contain links to external websites or embedded services.
                                          Once you interact with these services, their own privacy policies and
                                          terms apply. We are not responsible for the content, security, or privacy
                                          practices of third-party websites and services.
                                    </p>
                              </section>

                              <section>
                                    <h2 className="mb-3 text-xl font-semibold text-white">11. Changes to This Policy</h2>
                                    <p>
                                          We may update this Privacy Policy when application functionality,
                                          third-party integrations, or data-handling practices change. Updates
                                          will be published on this page with a revised effective date.
                                    </p>
                              </section>

                              <section>
                                    <h2 className="mb-3 text-xl font-semibold text-white">12. Contact Us</h2>
                                    <p>
                                          If you have questions or concerns about this Privacy Policy or MTStreams'
                                          data practices, contact us at{" "}
                                          <a className="text-emerald-400 hover:underline" href="mailto:mtstreams450@gmail.com">
                                                mtstreams450@gmail.com
                                          </a>.
                                    </p>
                              </section>
                        </div>

                        <footer className="mt-12 border-t border-white/10 pt-6 text-sm text-gray-500">
                              © {new Date().getFullYear()} MTStreams
                        </footer>
                  </article>
            </main>
      );
};

export default Privacy;
