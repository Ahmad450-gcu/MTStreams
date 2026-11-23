import { useEffect, useState } from "react";
import api from "../../utils/axios";
import Slider from "./Slider";

const HomeSections = ({ url, sectionName, type = "movie" }) => {
      const [data, setData] = useState([]);

      useEffect(() => {
            (async () => {
                  try {
                        const { data } = await api.get(url);
                        setData(data.results);
                  } catch (error) {
                        console.log(error.message);
                  }
            })();
      }, [url]);

      return (
            <section className="home-row" aria-label={sectionName}>
                  <div className="row-heading">
                        <h2>{sectionName}</h2>
                        <span className="row-heading__accent" aria-hidden="true" />
                  </div>
                  <Slider trendingMovie={data} type={type} />
            </section>
      );
};

export default HomeSections;
