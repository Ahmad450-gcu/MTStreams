import { Suspense, lazy } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { Home, Stream, Trailer } from "../Components/pages/index";
import Privacy from "../Components/pages/Privacy";
import { Nav, NonExistingRoute } from "../Components/ui/index";
import ExperienceGate from "../experiences/ExperienceGate";
import { useExperience } from "../experiences/shared/ExperienceContext";
const MoviePage = lazy(() => import("../Components/pages/Movie/MoviePage"));
const TVPage = lazy(() => import("../Components/pages/TV/TVPage"));
const MovieDetails = lazy(() => import("../Components/pages/Movie/MovieDetails"));
const TvDetails = lazy(() => import("../Components/pages/TV/TvDetails"));
const PeopleDetails = lazy(() => import("../Components/pages/People/PeopleDetails"));
const Search = lazy(() => import("../Components/pages/Search"));
const ExperiencePicker = lazy(() => import("../experiences/ExperiencePicker"));
const LibraryPage = lazy(() => import("../features/library/LibraryPage"));
const DiscoverPage = lazy(() => import("../features/discover/DiscoverPage"));
const FranchiseExplorer = lazy(() => import("../features/franchise/FranchiseExplorer"));
const JournalPage = lazy(() => import("../features/journal/JournalPage"));
const ComparePage = lazy(() => import("../features/compare/ComparePage"));
const RadarPage = lazy(() => import("../features/radar/RadarPage"));

// With no OTT experience selected every route renders the original MTStreams
// page (the `fallback`). With one selected, ExperienceGate renders that
// experience's own page for the same URL, so playback routes are unchanged.
const Router = () => {
      const location = useLocation();
      const { experience } = useExperience();
      // Some experiences (e.g. the Netflix-style one) open titles as a modal
      // over the page the user came from, like the original service.
      const backgroundLocation = experience ? location.state?.backgroundLocation : null;

      return (
            <>
                  <Suspense fallback={<div>Loading...</div>}>
                                    <Routes location={backgroundLocation || location}>
                                          <Route path="/" element={<ExperienceGate page="home" fallback={<Home />} />} />
                                          <Route path="/privacy" element={<Privacy />} />
                                          <Route path="/experiences" element={<ExperiencePicker />} />
                                          <Route path="/library" element={<LibraryPage />} />
                                          <Route path="/discover" element={<DiscoverPage />} />
                                          <Route path="/franchises" element={<FranchiseExplorer />} />
                                          <Route path="/franchise/:id" element={<FranchiseExplorer />} />
                                          <Route path="/journal" element={<JournalPage />} />
                                          <Route path="/compare" element={<ComparePage />} />
                                          <Route path="/radar" element={<RadarPage />} />
                                          <Route path="/trending" element={<ExperienceGate page="movies" fallback={<MoviePage />} />} />
                                          <Route path="/tv" element={<ExperienceGate page="tv" fallback={<TVPage />} />} />
                                          <Route path="/search" element={<ExperienceGate page="search" fallback={<Search />} />} />
                                          <Route path="/my-list" element={<ExperienceGate page="list" />} />
                                          <Route path="/browse/:slug" element={<ExperienceGate page="collection" />} />
                                          <Route path="/movie/details/:id" element={<ExperienceGate page="movie" fallback={<MovieDetails />} />}>
                                                <Route path="trailer" element={<Trailer />} />
                                                <Route path="watch" element={<Stream category={"movie"} />} />
                                          </Route>
                                          <Route path="/tv/details/:id" element={<ExperienceGate page="tvdetail" fallback={<TvDetails />} />}>
                                                <Route path="trailer" element={<Trailer />} />
                                                <Route path="watch/:season/:seasonID" element={<Stream category={"tv"} />} />
                                          </Route>
                                          <Route path="/person/details/:id" element={<PeopleDetails />} />
                                          <Route path="*" element={<NonExistingRoute />} />
                                    </Routes>
                                    {backgroundLocation && (
                                          <Routes>
                                                <Route path="/movie/details/:id" element={<ExperienceGate page="movie" modal />}>
                                                      <Route path="trailer" element={<Trailer />} />
                                                      <Route path="watch" element={<Stream category={"movie"} />} />
                                                </Route>
                                                <Route path="/tv/details/:id" element={<ExperienceGate page="tvdetail" modal />}>
                                                      <Route path="trailer" element={<Trailer />} />
                                                      <Route path="watch/:season/:seasonID" element={<Stream category={"tv"} />} />
                                                </Route>
                                          </Routes>
                                    )}
                  </Suspense>
                  {!experience && <Nav />}
                  <div className="navigation-backdrop fixed inset-0 pointer-events-none"></div>
            </>
      );
};

export default Router;
