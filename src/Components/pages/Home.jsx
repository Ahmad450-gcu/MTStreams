import { Suspense, lazy } from "react";
import { Header, CastLoader } from "../ui/index";
import { describeSection, useHomeLayout } from "../../features/home/homeLayout";

const TrendingContainer = lazy(() => import("../ui/TrendingContainer"));
const HomeSections = lazy(() => import("../ui/HomeSections"));
const ForYouRow = lazy(() => import("../../features/recommend/ForYouRow"));
const HomeCustomizer = lazy(() => import("../../features/home/HomeCustomizer"));

// Data sources for the built-in rows (unchanged from the original home page).
const ROW_SOURCES = {
      upcoming: { url: "movie/upcoming?page=1", type: "movie" },
      popularTv: { url: "discover/tv?include_adult=false&include_video=true&language=en-US&page=1&sort_by=popularity.desc", type: "tv" },
      topRated: { url: "movie/top_rated", type: "movie" },
      animation: { url: "/search/multi?query=animated", type: "movie" },
};

function HomeRow({ sectionKey }) {
      if (sectionKey === "trending") return <Suspense fallback={<CastLoader />}><TrendingContainer /></Suspense>;
      if (sectionKey === "foryou") return <Suspense fallback={null}><ForYouRow /></Suspense>;
      const section = describeSection(sectionKey);
      const source = ROW_SOURCES[sectionKey] || (section?.genre
            ? { url: `discover/${section.type}?with_genres=${section.genre}&sort_by=popularity.desc&vote_count.gte=100`, type: section.type }
            : null);
      if (!section || !source) return null;
      return (
            <Suspense fallback={<CastLoader />}>
                  <HomeSections url={source.url} sectionName={section.label} type={source.type} />
            </Suspense>
      );
}

const Home = () => {
      document.title = "MTStreams | Discover Movies and Series";
      const layout = useHomeLayout();
      const visible = layout.order.filter((key) => !layout.hidden.includes(key));

      return (
            <div className="home-page w-full relative min-h-dvh overflow-hidden font-primary pb-28">
                  <Header />
                  <main className={`home-catalog ${layout.density === "compact" ? "home-catalog--compact" : ""}`}>
                        <div className="hc-bar">
                              <Suspense fallback={null}><HomeCustomizer /></Suspense>
                        </div>
                        {visible.map((key) => <HomeRow key={key} sectionKey={key} />)}
                  </main>
            </div>
      );
};

export default Home;
