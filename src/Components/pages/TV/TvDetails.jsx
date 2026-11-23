import { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { asyncTvLoader, removeTv } from "../../../store/actions/tvAction";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { MdClose } from "react-icons/md";
import { Card, Review, DetailLoader, DetailError, Exclude } from "../../ui/index";
import { CiCircleChevRight, CiCircleChevLeft } from "react-icons/ci";
import TVSeasonModal from "./TVSeasonModal";
import MediaActions from "../../ui/MediaActions";
import LibraryControl from "../../../features/library/LibraryControl";
import DetailHero from "../../ui/DetailHero";
import { Button } from "glisse";
import GlisseSurface from "../../ui/GlisseSurface";
import { playSound } from "../../../utils/soundEffects.js";
const TvDetails = () => {
      const [selectedSeason, setSelectedSeason] = useState(null);
      const closeSeason = useCallback(() => setSelectedSeason(null), []);
      const dispatch = useDispatch();
      const navigate = useNavigate();
      const { info, error } = useSelector((state) => state.tv);
      const availableSeasons = info?.detail?.seasons?.filter((season) => season.episode_count > 0) || [];
      const firstSeason = availableSeasons.find((season) => season.season_number > 0) || availableSeasons[0];
      const handleSeasonSelect = useCallback((seasonNumber) => {
            const nextSeason = info?.detail?.seasons?.find((season) => season.season_number === Number(seasonNumber));

            if (nextSeason) {
                  playSound("season-select");
                  setSelectedSeason(nextSeason);
            }
      }, [info?.detail?.seasons]);
      useEffect(() => {
            const title = info?.detail?.name || info?.detail?.original_name || "Hang On ! Getting Details for The Requested TV Series";
            if (title) document.title = `${title} | MTStreams`;
      }, [info?.detail?.name, info?.detail?.original_name]);
      const { id } = useParams();
      const containerRef = useRef(null);
      const rafRef = useRef(null);
      const [isEnd, setIsEnd] = useState(false);
      const [isStart, setIsStart] = useState(true);
      const [showAllReviews, setShowAllReviews] = useState(false);
      const [showAllRecommendations, setShowAllRecommendations] = useState(false);
      const [retryCount, setRetryCount] = useState(0);
      const updateScrollState = useCallback(() => {
            const el = containerRef.current;
            if (!el) return;
            const { scrollLeft, clientWidth, scrollWidth } = el;
            setIsStart(scrollLeft <= 0);
            setIsEnd(scrollLeft + clientWidth >= scrollWidth - 1);
      }, []);
      const scrollLeft = useCallback(() => {
            if (!containerRef.current) return;
            containerRef.current.scrollBy({ left: -600, behavior: "smooth" });
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(updateScrollState);
      }, [updateScrollState]);

      const scrollRight = useCallback(() => {
            if (!containerRef.current) return;
            containerRef.current.scrollBy({ left: 600, behavior: "smooth" });
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(updateScrollState);
      }, [updateScrollState]);

      useEffect(() => {
            const el = containerRef.current;
            if (!el) return;
            const onScroll = () => {
                  if (rafRef.current) cancelAnimationFrame(rafRef.current);
                  rafRef.current = requestAnimationFrame(updateScrollState);
            };
            el.addEventListener("scroll", onScroll, { passive: true });
            window.addEventListener("resize", onScroll);
            updateScrollState();
            return () => {
                  el.removeEventListener("scroll", onScroll);
                  window.removeEventListener("resize", onScroll);
                  if (rafRef.current) cancelAnimationFrame(rafRef.current);
            };
      }, [updateScrollState, info?.reviews, showAllReviews]);
      useEffect(() => {
            const request = dispatch(asyncTvLoader(id));
            return () => {
                  request.abort();
                  dispatch(removeTv());
            };
      }, [id, dispatch, retryCount]);
      return (
            <>
                  {info ? (
                        <section className="w-full overflow-x-hidden bg-bottom [background-image:var(--bg-gradient)]">
                              {selectedSeason && <TVSeasonModal onClick={closeSeason} season={selectedSeason} seasons={availableSeasons} onSeasonChange={handleSeasonSelect} mediaId={id} title={info.detail.name || info.detail.original_name} />}
                              <Button type="button" onClick={() => navigate(-1)} aria-label="Go back" className="detail-close" icon={<MdClose size="1.5rem" />} tint="#ffffff" />
                              <section className="overflow-x-hidden relative overflow-hidden w-full min-h-screen">
                                    <DetailHero detail={info.detail} mediaType="tv" videoLink={info.videoLink}>
                                          <MediaActions mediaId={id} mediaType="tv" title={info.detail.name || info.detail.original_name} showWatch={Boolean(firstSeason)} onWatch={() => setSelectedSeason(firstSeason)} season={firstSeason?.season_number ?? 1} />
                                          <LibraryControl media={info.detail} mediaType="tv" />
                                    </DetailHero>
                                    <section className="px-5 pb-28 text-white mt-3 w-full font-primary">
                                          <div className="detail-storyline">
                                                <div className="detail-storyline__heading">
                                                      <h1 className="text-2xl min-[961px]:text-5xl  md:text-3xl  font-astralga font-semibold">Storyline</h1>
                                                      <GlisseSurface className="glass-year-pill px-3 md:text-lg text-xs py-1 font-astralga font-semibold rounded-full" style={{ "--lg-glass": "#fdfdfde", "--lg-glass-active": "#ff956e" }}>{info.detail.first_air_date ? info.detail.first_air_date.split("-")[0] : info.detail.last_air_date ? info.detail.last_air_date.split("-")[0] : "Not Released"}</GlisseSurface>
                                                </div>
                                                <p className="detail-storyline__overview">{info?.detail?.overview || "No Storyline available"}</p>
                                          </div>
                                          {availableSeasons.length > 0 && (
                                                <section className="tv-season-section" aria-labelledby="tv-season-heading">
                                                      <div className="tv-season-section__toolbar">
                                                            <div>
                                                                  <span className="tv-season-section__eyebrow">EXPLORE THE SERIES</span>
                                                                  <h2 id="tv-season-heading">The Season Library</h2>
                                                                  <p>Explore each chapter of the series and choose where to begin.</p>
                                                            </div>
                                                            {availableSeasons.length > 1 && (
                                                                  <label className="tv-season-select">
                                                                        <span>Jump to season</span>
                                                                        <select
                                                                              value={selectedSeason?.season_number ?? ""}
                                                                              onChange={(event) => handleSeasonSelect(event.target.value)}
                                                                              aria-label="Choose a TV season"
                                                                        >
                                                                              <option value="">Select a season</option>
                                                                              {availableSeasons.map((season) => (
                                                                                    <option key={season.id || season.season_number} value={season.season_number}>
                                                                                          {season.season_number === 0 ? "Specials" : `Season ${season.season_number}`}
                                                                                    </option>
                                                                              ))}
                                                                        </select>
                                                                  </label>
                                                            )}
                                                      </div>
                                                      <div
                                                            className="mt-season-carousel"
                                                            role="region"
                                                            aria-label="Browse available seasons horizontally"
                                                            tabIndex={0}
                                                            onWheel={(event) => {
                                                                  const rail = event.currentTarget;
                                                                  const maxScroll = rail.scrollWidth - rail.clientWidth;
                                                                  const isVerticalWheel = Math.abs(event.deltaY) > Math.abs(event.deltaX);
                                                                  const canScroll = event.deltaY > 0
                                                                        ? rail.scrollLeft < maxScroll - 1
                                                                        : rail.scrollLeft > 0;
                                                                  if (isVerticalWheel && maxScroll > 0 && canScroll) {
                                                                        event.preventDefault();
                                                                        rail.scrollLeft += event.deltaY;
                                                                  }
                                                            }}
                                                      >
                                                            {availableSeasons.map((season) => {
                                                                  const seasonYear = season.air_date?.split("-")[0];
                                                                  const seasonLabel = season.season_number === 0 ? "SPECIALS" : `SEASON ${String(season.season_number).padStart(2, "0")}`;
                                                                  return (
                                                                        <button
                                                                              type="button"
                                                                              key={season.id || season.season_number}
                                                                              className="mt-season-card"
                                                                              onClick={() => handleSeasonSelect(season.season_number)}
                                                                              aria-haspopup="dialog"
                                                                              aria-label={`Browse ${season.name || seasonLabel}, ${season.episode_count} episodes`}
                                                                        >
                                                                              <img
                                                                                    src={season.poster_path ? `https://image.tmdb.org/t/p/w500${season.poster_path}` : "/noImage.jpg"}
                                                                                    alt=""
                                                                                    loading="lazy"
                                                                                    decoding="async"
                                                                                    onError={(event) => { event.currentTarget.src = "/noImage.jpg"; }}
                                                                              />
                                                                              <span className="mt-season-card__shade" />
                                                                              <span className="mt-season-card__content">
                                                                                    <span className="mt-season-card__eyebrow">{seasonLabel}</span>
                                                                                    <span className="mt-season-card__title">{season.name || seasonLabel}</span>
                                                                                    <span className="mt-season-card__meta">
                                                                                          <span>{season.episode_count} episodes</span>
                                                                                          {seasonYear && <span>{seasonYear}</span>}
                                                                                    </span>
                                                                                    <span className="mt-season-card__action">Browse episodes <span aria-hidden="true">↗</span></span>
                                                                              </span>
                                                                        </button>
                                                                  );
                                                            })}
                                                      </div>
                                                </section>
                                          )}
                                          {info.castBy.cast.length != 0 && (
                                                <div className="w-full mt-10">
                                                      <h1 className="text-white text-2xl md:text-center min-[961px]:text-5xl md:text-4xl font-bold font-primary leading-none">Cast</h1>
                                                      <div className="detail-people">
                                                            {info.castBy.cast.slice(0, 12).map((eachActor, index) => (
                                                                  <Exclude key={index} eachActor={eachActor} />
                                                            ))}
                                                      </div>
                                                </div>
                                          )}
                                          {info.castBy.crew.length != 0 && (
                                                <div className="mt-2 border-b-[0.5px] border-zinc-300/70 pb-5 w-full">
                                                      <h1 className="text-white text-2xl md:text-center md:text-4xl min-[961px]:text-5xl font-bold font-primary leading-none">Crew</h1>
                                                      <div className="detail-people">{info.castBy.crew.map((eachActor, index) => <Exclude key={index} eachActor={eachActor} />).slice(0, 9)}</div>
                                                </div>
                                          )}
                                          {info.reviews.length !== 0 && (
                                                <div className="mt-2 border-b-[0.5px] relative border-zinc-300/70 pb-5 w-full">
                                                      <div className="detail-reviews__header">
                                                            <h1 className="text-white text-2xl md:text-4xl min-[961px]:text-5xl font-bold font-primary">Reviews</h1>
                                                            <div className="detail-reviews__tools">
                                                                  <p className="text-white text-sm md:text-lg">{info.reviews.length} comments</p>
                                                                  <button type="button" onClick={scrollLeft} disabled={isStart} aria-label="Previous reviews" className="detail-reviews__arrow">
                                                                        <CiCircleChevLeft size="2rem" />
                                                                  </button>
                                                                  <button type="button" onClick={scrollRight} disabled={isEnd} aria-label="Next reviews" className="detail-reviews__arrow">
                                                                        <CiCircleChevRight size="2rem" />
                                                                  </button>
                                                            </div>
                                                      </div>
                                                      <div ref={containerRef} className="detail-reviews__rail">
                                                            {info.reviews && (showAllReviews ? info.reviews : info.reviews.slice(0, 8)).map((eachReview) => <Review review={eachReview} key={eachReview.id} />)}
                                                      </div>
                                                      {info.reviews.length > 8 && (
                                                            <div className="mt-3 flex justify-center">
                                                                  <button onClick={() => setShowAllReviews((s) => !s)} className="px-4 py-2 rounded-md bg-white/10 text-white">
                                                                        {showAllReviews ? "Show fewer reviews" : `Show all ${info.reviews.length} reviews`}
                                                                  </button>
                                                            </div>
                                                      )}
                                                </div>
                                          )}
                                          {/* Recommend TV List */}
                                          {info.recommendedTv.length != 0 && (
                                                <div className="mt-2 overflow-x-hidden mb-20 w-full">
                                                      <h1 className="text-white text-2xl md:text-3xl min-[961px]:text-5xl  md:my-10 font-bold font-primary leading-none">Similar TV Series</h1>
                                                      <div className="media-grid recommendations-grid mt-5 sm:mt-3 w-full grid grid-cols-2 lg:grid-cols-3 min-[1250px]:grid-cols-4 gap-3 md:gap-6 items-stretch">
                                                            {(showAllRecommendations ? info.recommendedTv : info.recommendedTv.slice(0, 12)).map((eachTv, index) => (
                                                                  <Card key={index} type="tv" eachMovie={eachTv} />
                                                            ))}
                                                      </div>
                                                      {info.recommendedTv.length > 12 && (
                                                            <div className="mt-3 flex justify-center">
                                                                  <Button onClick={() => setShowAllRecommendations((s) => !s)} className="glass-action">
                                                                        {showAllRecommendations ? "Show fewer" : `Show all ${info.recommendedTv.length}`}
                                                                  </Button>
                                                            </div>
                                                      )}
                                                </div>
                                          )}
                                    </section>
                                    <Outlet />
                              </section>
                        </section>
                  ) : error ? (
                        <DetailError
                              title="Unable to load series"
                              message={error}
                              onRetry={() => setRetryCount((count) => count + 1)}
                              onBack={() => navigate(-1)}
                        />
                  ) : (
                        <DetailLoader />
                  )}
            </>
      );
};

export default TvDetails;
