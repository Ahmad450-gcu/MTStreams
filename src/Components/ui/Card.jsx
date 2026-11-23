import { playSound } from "../../utils/soundEffects.js";
import { memo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Star } from "lucide-react";

const Card = ({ eachMovie, type = "all" }) => {
      const navigate = useNavigate();
      const isDragging = useRef(false);
      const mediaType = eachMovie.media_type || type;
      const tmdbPath = mediaType === "person"
            ? eachMovie.profile_path || eachMovie.poster_path
            : eachMovie.poster_path || eachMovie.backdrop_path;
      const displaySrc = tmdbPath ? `https://image.tmdb.org/t/p/w500${tmdbPath}` : "/noImage.jpg";
      const title = eachMovie.name || eachMovie.title || eachMovie.original_title || eachMovie.original_name || "Untitled";
      const year = (eachMovie.release_date || eachMovie.first_air_date || "").split("-")[0];

      const handleClick = () => {
            if (isDragging.current) return;
            playSound("poster-select");
            navigate(`/${mediaType}/details/${eachMovie.id}`);
      };

      return (
            <article
                  role="button"
                  tabIndex={0}
                  aria-label={`View ${title}`}
                  onMouseEnter={() => playSound("poster-hover", { volume: 0.6 })}
                  onClick={handleClick}
                  onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              handleClick();
                        }
                  }}
                  onMouseDown={() => (isDragging.current = false)}
                  onMouseMove={() => (isDragging.current = true)}
                  onMouseUp={() => setTimeout(() => (isDragging.current = false), 100)}
                  className="media-card"
            >
                  <div className="media-card__artwork">
                        <img
                              loading="lazy"
                              decoding="async"
                              src={displaySrc}
                              srcSet={tmdbPath ? `https://image.tmdb.org/t/p/w342${tmdbPath} 342w, ${displaySrc} 500w` : undefined}
                              sizes="(max-width: 767px) 45vw, 260px"
                              alt={title}
                        />
                        <div className="media-card__hover" aria-hidden="true">
                              <span className="media-card__play"><Play size={20} fill="currentColor" /></span>
                              <span>View details</span>
                        </div>
                        {eachMovie.vote_average > 0 && (
                              <span className="media-card__rating"><Star size={12} fill="currentColor" /> {eachMovie.vote_average.toFixed(1)}</span>
                        )}
                  </div>
                  <div className="media-card__info">
                        <h3>{title}</h3>
                        <div className="media-card__subline">
                              <span>{year || (mediaType === "person" ? eachMovie.known_for_department : "New release")}</span>
                              {mediaType !== "all" && <span className="media-card__type">{mediaType === "tv" ? "SERIES" : mediaType === "person" ? "PERSON" : "MOVIE"}</span>}
                        </div>
                  </div>
            </article>
      );
};

export default memo(Card);
