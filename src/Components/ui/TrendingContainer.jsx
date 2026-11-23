import { useEffect, useState } from "react";
import api from "../../utils/axios";
import Slider from "./Slider";
import AnimatedDropdown from "./DropDown";

const TrendingContainer = () => {
      const [trendingMovie, setTrendingMovie] = useState([]);
      const [query, setQuery] = useState("tv");

      useEffect(() => {
            (async () => {
                  try {
                        const { data } = await api.get(`trending/${query}/day`);
                        setTrendingMovie(data.results);
                  } catch (error) {
                        console.log(error.message);
                  }
            })();
      }, [query]);

      return (
            <section className="home-row home-row--trending" aria-label="Trending now">
                  <div className="row-heading row-heading--controls">
                        <div>
                              <span className="row-kicker">WHAT EVERYONE&apos;S WATCHING</span>
                              <h2>Trending now</h2>
                        </div>
                        <AnimatedDropdown
                              items={[
                                    { name: "Movies", value: "movie" },
                                    { name: "TV Series", value: "tv" },
                              ]}
                              value={query}
                              className="trending-media-toggle"
                              label="Trending media type"
                              onSelect={(value) => setQuery(value)}
                        />
                  </div>
                  <Slider trendingMovie={trendingMovie} type={query} />
            </section>
      );
};

export default TrendingContainer;
