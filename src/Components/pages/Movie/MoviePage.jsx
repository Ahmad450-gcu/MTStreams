import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CastLoader, PageSkeleton } from "../../ui/index";
import api from "../../../utils/axios";
import InfiniteScroll from "react-infinite-scroll-component";

const MoviePage = () => {
      document.title = "Films | MTStreams";
      const [trendingMovie, setTrendingMovie] = useState([]);
      const [hasMore, setHasMore] = useState(true);
      const pageRef = useRef(1);
      const isFetchingRef = useRef(false);

      const getTrendingData = useCallback(async () => {
            if (isFetchingRef.current || !hasMore) return;

            isFetchingRef.current = true;
            const requestedPage = pageRef.current;

            try {
                  const { data } = await api.get(`trending/movie/day?page=${requestedPage}`);
                  const results = Array.isArray(data?.results) ? data.results : [];

                  setTrendingMovie((prevData) => [...prevData, ...results]);
                  pageRef.current = requestedPage + 1;
                  setHasMore(requestedPage < Number(data?.total_pages ?? requestedPage));
            } catch (error) {
                  console.error("Could not load trending movies:", error);
            } finally {
                  isFetchingRef.current = false;
            }
      }, [hasMore]);

      useEffect(() => {
            getTrendingData();
      }, [getTrendingData]);

      return (
            <>
                  <div className="catalog-page overflow-x-hidden w-full min-h-dvh pb-28 [background-image:var(--bg-gradient)]">
                        <header className="catalog-page__header">
                              <span className="catalog-page__eyebrow">THE MOVIE COLLECTION</span>
                              <h1>Trending Movies</h1>
                              <p>Popular films people are watching right now.</p>
                        </header>
                        {trendingMovie.length > 0 ? (
                              <InfiniteScroll hasMore={hasMore} next={getTrendingData} loader={<CastLoader />} dataLength={trendingMovie.length}>
                                    <div className="catalog-grid media-grid px-3 w-full gap-3 md:gap-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">{trendingMovie.map((eachMovie) => <Card type="movie" key={eachMovie.id} eachMovie={eachMovie} />)}</div>
                              </InfiniteScroll>
                        ) : (
                              <PageSkeleton />
                        )}
                  </div>
            </>
      );
};

export default MoviePage;
