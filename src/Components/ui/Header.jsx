import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../utils/axios";
import { Clapperboard, Info, Play, Star } from "lucide-react";

const getTitle = (item) => item?.title || item?.name || item?.original_title || item?.original_name || "Featured title";

const Header = () => {
      const [nowPlaying, setNowPlaying] = useState([]);
      const [activeIndex, setActiveIndex] = useState(0);

      useEffect(() => {
            let active = true;
            (async () => {
                  try {
                        const { data } = await api.get("trending/all/day");
                        if (!active) return;
                        const featured = (data.results || [])
                              .filter((item) => ["movie", "tv"].includes(item.media_type) && (item.backdrop_path || item.poster_path))
                              .slice(0, 8);
                        setNowPlaying(featured);
                        setActiveIndex(0);
                  } catch (error) {
                        console.warn("Unable to load featured titles:", error.message);
                  }
            })();
            return () => { active = false; };
      }, []);

      useEffect(() => {
            if (nowPlaying.length < 2) return undefined;
            const timer = window.setInterval(() => {
                  setActiveIndex((current) => (current + 1) % nowPlaying.length);
            }, 7500);
            return () => window.clearInterval(timer);
      }, [nowPlaying.length]);

      const current = nowPlaying[activeIndex];
      const title = useMemo(() => current ? getTitle(current) : "Discover your next favourite", [current]);

      if (!current) {
            return <header className="home-featured" aria-label="Featured titles"><div className="home-hero-fallback" /></header>;
      }

      const mediaType = current.media_type;
      const detailPath = `/${mediaType}/details/${current.id}`;
      const watchPath = `${detailPath}/${mediaType === "tv" ? "watch/1/1" : "watch"}`;
      const releaseYear = (current.release_date || current.first_air_date || "").split("-")[0];
      const imagePath = current.backdrop_path || current.poster_path;

      return (
            <header className="home-featured" aria-label="Featured titles">
                  <article key={`${mediaType}-${current.id}`} className="home-hero-slide">
                        <div className="hero-artwork">
                              <img
                                    loading="eager"
                                    decoding="async"
                                    className="home-hero-image"
                                    src={`https://image.tmdb.org/t/p/original${imagePath}`}
                                    srcSet={`https://image.tmdb.org/t/p/w780${imagePath} 780w, https://image.tmdb.org/t/p/w1280${imagePath} 1280w, https://image.tmdb.org/t/p/original${imagePath} 1920w`}
                                    sizes="100vw"
                                    onError={(event) => { event.currentTarget.removeAttribute("srcset"); event.currentTarget.src = "/noImage.jpg"; }}
                                    alt={`${title} featured backdrop`}
                              />
                        </div>
                        <div className="home-hero-content">
                              <div className="hero-copy">
                                    <span className="hero-eyebrow">MTSTREAMS SPOTLIGHT</span>
                                    <h1 className="hero-title" data-length={title?.length > 24 ? "long" : title?.length > 14 ? "medium" : undefined}>{title}</h1>
                                    <div className="hero-facts">
                                          {releaseYear && <span>{releaseYear}</span>}
                                          <span>{mediaType === "tv" ? "Series" : "Movie"}</span>
                                          {current.vote_average > 0 && (
                                                <span className="hero-rating"><Star size={14} fill="currentColor" /> {current.vote_average.toFixed(1)} / 10</span>
                                          )}
                                    </div>
                                    {current.overview && <p className="hero-overview">{current.overview}</p>}
                                    <div className="hero-actions">
                                          <Link className="hero-button hero-button--primary" to={watchPath}>
                                                <Play size={18} fill="currentColor" /> Watch now
                                          </Link>
                                          <Link className="hero-button hero-button--secondary" to={detailPath}>
                                                <Info size={18} /> More info
                                          </Link>
                                          <Link className="hero-button hero-button--quiet" to={`${detailPath}/trailer`} aria-label={`Watch trailer for ${title}`}>
                                                <Clapperboard size={18} /> <span>Trailer</span>
                                          </Link>
                                    </div>
                              </div>
                        </div>
                  </article>

            </header>
      );
};

export default Header;
