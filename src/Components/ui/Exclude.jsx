import { useState, memo } from "react";
import { Link } from "react-router-dom";
import { playSound } from "../../utils/soundEffects.js";
import { motion } from "motion/react";

const Exclude = ({ eachActor }) => {
      const name = eachActor?.name || eachActor?.original_name || "Unknown contributor";
      const credit = eachActor?.character || eachActor?.job || eachActor?.known_for_department || "Cast & crew";
      const profilePath = eachActor?.profile_path;

      const [imageLoaded, setImageLoaded] = useState(false);
      const [imageFailed, setImageFailed] = useState(false);

      return (
            <Link
                  to={`/person/details/${eachActor.id}`}
                  onClick={() => playSound("cast-select")}
                  className="person-credit-link"
                  aria-label={`View ${name}, ${credit}`}
            >
                  <motion.div
                        className="person-credit"
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.985 }}
                  >
                        <div className="person-credit__portrait">
                              {profilePath && !imageFailed && (
                                    <img
                                          src={`https://image.tmdb.org/t/p/w342${profilePath}`}
                                          alt=""
                                          loading="lazy"
                                          decoding="async"
                                          className={`person-credit__image ${imageLoaded ? "is-loaded" : ""}`}
                                          onLoad={() => setImageLoaded(true)}
                                          onError={() => setImageFailed(true)}
                                    />
                              )}

                              {(!profilePath || imageFailed || !imageLoaded) && (
                                    <span className="person-credit__fallback" aria-hidden="true">
                                          {name.charAt(0).toUpperCase()}
                                    </span>
                              )}

                              <span className="person-credit__portrait-line" />
                        </div>

                        <div className="person-credit__info">
                              <span className="person-credit__eyebrow">MTSTREAMS CREDIT</span>
                              <h2 className="person-credit__name">{name}</h2>
                              <p className="person-credit__role">{credit}</p>
                        </div>

                        <span className="person-credit__arrow" aria-hidden="true">↗</span>
                  </motion.div>
            </Link>
      );
};

export default memo(Exclude);