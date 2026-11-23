import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, CalendarDays, Clapperboard, Compass, Flame, LoaderCircle, Search as SearchIcon, Star, X } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../utils/axios";
import { captureEvent } from "../../analytics/posthog.js";
import { playSound } from "../../utils/soundEffects.js";
import { tmdbGet } from "../../experiences/shared/engine/tmdb";
import "./search-v2.css";

const filters = [
      { id: "all", label: "Everything" },
      { id: "movie", label: "Movies" },
      { id: "tv", label: "Series" },
      { id: "person", label: "People" },
];

const getTitle = (item) => item?.title || item?.name || item?.original_title || item?.original_name || "Untitled";
const getDate = (item) => item?.release_date || item?.first_air_date || "";
const getYear = (item) => getDate(item).slice(0, 4);
const getTypeLabel = (type) => ({ movie: "Film", tv: "Series", person: "Person" })[type] || "Title";

const getImage = (item) => {
      const path = item?.media_type === "person"
            ? item.profile_path || item.poster_path
            : item.poster_path || item.backdrop_path;
      return path ? `https://image.tmdb.org/t/p/w500${path}` : "/noImage.jpg";
};

const getDetailPath = (item) => {
      const routeType = item.media_type === "person" ? "person" : item.media_type;
      return `/${routeType}/details/${item.id}`;
};

const SearchResultCard = ({ item, onOpen, index = 0 }) => {
      const title = getTitle(item);
      const year = getYear(item);
      const knownFor = item.media_type === "person"
            ? (item.known_for || []).map((entry) => entry.title || entry.name).filter(Boolean).slice(0, 2).join(" · ")
            : "";
      const description = item.media_type === "person"
            ? item.known_for_department || knownFor || "Cast and crew"
            : item.overview || "Explore the details, cast and story.";

      return (
            <Link to={getDetailPath(item)} className="search-card" style={{ "--i": Math.min(index, 14) }} onClick={() => onOpen(item)}>
                  <div className="search-card__poster">
                        <img
                              src={getImage(item)}
                              alt={`${title} poster`}
                              loading="lazy"
                              onError={(event) => {
                                    event.currentTarget.onerror = null;
                                    event.currentTarget.src = "/noImage.jpg";
                              }}
                        />
                        <span className="search-card__type">{getTypeLabel(item.media_type)}</span>
                        <span className="search-card__open"><ArrowUpRight size={18} /></span>
                        {item.vote_average > 0 && item.media_type !== "person" && (
                              <span className="search-card__rating"><Star size={12} fill="currentColor" /> {item.vote_average.toFixed(1)}</span>
                        )}
                  </div>
                  <div className="search-card__copy">
                        <h2>{title}</h2>
                        <div className="search-card__facts">
                              {year && <span><CalendarDays size={12} /> {year}</span>}
                              {item.media_type === "person" && item.known_for_department && <span>{item.known_for_department}</span>}
                        </div>
                        <p>{description}</p>
                  </div>
            </Link>
      );
};

const MOOD_LINKS = [
      ["😂", "Funny", "funny"], ["🕵️", "Suspenseful", "suspenseful"], ["💞", "Romantic", "romantic"],
      ["⚡", "Exciting", "exciting"], ["👻", "Scary", "scary"], ["🧠", "Thought-provoking", "thoughtful"],
];

/** Wide "top match" card shown above the grid for the best movie/series result. */
const SpotlightCard = ({ item, onOpen }) => {
      const title = getTitle(item);
      const backdrop = item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : getImage(item);
      return (
            <Link to={getDetailPath(item)} className="search-spot" onClick={() => onOpen(item)}>
                  <img className="search-spot__bg" src={backdrop} alt="" />
                  <span className="search-spot__shade" />
                  <img className="search-spot__poster" src={getImage(item)} alt="" />
                  <span className="search-spot__copy">
                        <span className="search-spot__eyebrow">Top match · {getTypeLabel(item.media_type)}</span>
                        <strong>{title}</strong>
                        <span className="search-spot__facts">
                              {getYear(item) && <span><CalendarDays size={13} /> {getYear(item)}</span>}
                              {item.vote_average > 0 && <span><Star size={13} fill="currentColor" /> {item.vote_average.toFixed(1)}</span>}
                        </span>
                        {item.overview && <span className="search-spot__overview">{item.overview}</span>}
                        <span className="search-spot__cta">View details <ArrowUpRight size={16} /></span>
                  </span>
            </Link>
      );
};

/** Slowly drifting wall of today's trending posters behind the search hero. */
const PosterWall = ({ posters }) => {
      if (posters.length < 6) return <div className="search-wall search-wall--empty" aria-hidden="true" />;
      const rows = [0, 1, 2].map((row) => {
            const slice = posters.slice(row * 6, row * 6 + 6);
            return slice.length >= 4 ? slice : posters.slice(0, 6);
      });
      return (
            <div className="search-wall" aria-hidden="true">
                  {rows.map((row, index) => (
                        <div key={index} className={`search-wall__row search-wall__row--${index}`}>
                              {[...row, ...row].map((path, posterIndex) => <img key={`${path}-${posterIndex}`} src={`https://image.tmdb.org/t/p/w185${path}`} alt="" loading="lazy" decoding="async" />)}
                        </div>
                  ))}
            </div>
      );
};

const Search = () => {
      const [query, setQuery] = useState("");
      const [debouncedQuery, setDebouncedQuery] = useState("");
      const [movieData, setMovieData] = useState([]);
      const [totalResults, setTotalResults] = useState(0);
      const [page, setPage] = useState(1);
      const [totalPages, setTotalPages] = useState(0);
      const [isLoadingMore, setIsLoadingMore] = useState(false);
      const [activeFilter, setActiveFilter] = useState("all");
      const [searchError, setSearchError] = useState("");
      const [isLoading, setIsLoading] = useState(false);
      const [hasSearched, setHasSearched] = useState(false);
      const [trending, setTrending] = useState([]);
      const [searchHistory, setSearchHistory] = useState(() => {
            try {
                  const savedHistory = JSON.parse(window.localStorage.getItem("mtstreams-search-history") || "[]");
                  return Array.isArray(savedHistory)
                        ? savedHistory.filter((term) => typeof term === "string" && term.trim()).slice(0, 5)
                        : [];
            } catch {
                  return [];
            }
      });
      const requestId = useRef(0);
      const inputRef = useRef(null);

      document.title = "Search | MTStreams";

      useEffect(() => () => {
            requestId.current += 1;
      }, []);

      // One shared, CDN-cached request feeds the poster wall and trending shortcuts.
      useEffect(() => {
            let alive = true;
            tmdbGet("trending/all/day", {})
                  .then((data) => alive && setTrending((data?.results || []).filter((item) => (item.media_type === "movie" || item.media_type === "tv") && item.poster_path)))
                  .catch(() => {});
            return () => {
                  alive = false;
            };
      }, []);

      // "/" focuses the search box from anywhere on the page.
      useEffect(() => {
            const onKey = (event) => {
                  if (event.key !== "/" || event.metaKey || event.ctrlKey) return;
                  const tag = document.activeElement?.tagName;
                  if (tag === "INPUT" || tag === "TEXTAREA" || document.activeElement?.isContentEditable) return;
                  event.preventDefault();
                  inputRef.current?.focus();
            };
            window.addEventListener("keydown", onKey);
            return () => window.removeEventListener("keydown", onKey);
      }, []);

      const rememberSearch = useCallback((term) => {
            const normalizedTerm = term.trim();
            if (!normalizedTerm) return;

            setSearchHistory((current) => {
                  const next = [
                        normalizedTerm,
                        ...current.filter((entry) => entry.toLowerCase() !== normalizedTerm.toLowerCase()),
                  ].slice(0, 5);

                  try {
                        window.localStorage.setItem("mtstreams-search-history", JSON.stringify(next));
                  } catch {
                        // Keep the current session usable if local storage is unavailable.
                  }

                  return next;
            });
      }, []);

      useEffect(() => {
            const normalizedTerm = query.trim();
            if (normalizedTerm === debouncedQuery) return undefined;

            // Invalidate any in-flight response as soon as the input changes.
            requestId.current += 1;

            if (!normalizedTerm) {
                  setDebouncedQuery("");
                  setMovieData([]);
                  setTotalResults(0);
                  setTotalPages(0);
                  setSearchError("");
                  setIsLoading(false);
                  setHasSearched(false);
                  setActiveFilter("all");
                  return undefined;
            }

            setIsLoading(true);
            setHasSearched(true);
            setSearchError("");
            setMovieData([]);
            setTotalResults(0);

            const timer = window.setTimeout(() => {
                  setDebouncedQuery(normalizedTerm);
            }, 350);

            return () => window.clearTimeout(timer);
      }, [query, debouncedQuery]);

      const searchMovies = useCallback(async (searchTerm, nextPage = 1) => {
            const normalizedTerm = searchTerm.trim();
            if (!normalizedTerm) return;

            const currentRequest = ++requestId.current;
            if (nextPage === 1) {
                  setIsLoading(true);
                  setHasSearched(true);
                  setSearchError("");
                  setMovieData([]);
                  setTotalResults(0);
                  setActiveFilter("all");
            } else {
                  setIsLoadingMore(true);
                  setSearchError("");
            }

            try {
                  const { data } = await api.get(`/search/multi?query=${encodeURIComponent(normalizedTerm)}&page=${nextPage}`);
                  const results = (data.results || []).filter((item) => ["movie", "tv", "person"].includes(item.media_type));

                  if (currentRequest === requestId.current) {
                        setMovieData((current) => {
                              if (nextPage === 1) return results;
                              const seen = new Set(current.map((item) => `${item.media_type}-${item.id}`));
                              return [...current, ...results.filter((item) => !seen.has(`${item.media_type}-${item.id}`))];
                        });
                        setPage(nextPage);
                        setTotalPages(Math.min(500, data.total_pages ?? 1));
                        setTotalResults(data.total_results ?? results.length);
                        if (nextPage === 1) {
                              captureEvent("search_performed", {
                                    query_length: normalizedTerm.length,
                                    result_count: data.total_results ?? results.length,
                                    has_results: results.length > 0,
                              });
                        }
                  }
            } catch {
                  if (currentRequest === requestId.current) {
                        if (nextPage === 1) setMovieData([]);
                        setSearchError("We couldn't load results right now. Please try again.");
                        captureEvent("search_failed", { query_length: normalizedTerm.length });
                  }
            } finally {
                  if (currentRequest === requestId.current) {
                        setIsLoading(false);
                        setIsLoadingMore(false);
                  }
            }
      }, []);

      useEffect(() => {
            if (debouncedQuery.length >= 1) searchMovies(debouncedQuery);
      }, [debouncedQuery, searchMovies]);

      const handleSubmit = (event) => {
            event?.preventDefault?.();
            const normalizedTerm = query.trim();
            if (!normalizedTerm) return;
            rememberSearch(normalizedTerm);

            if (normalizedTerm === debouncedQuery) {
                  searchMovies(normalizedTerm);
            } else {
                  setDebouncedQuery(normalizedTerm);
            }
      };

      const handleClear = () => {
            requestId.current += 1;
            setQuery("");
            setDebouncedQuery("");
            setMovieData([]);
            setTotalResults(0);
            setTotalPages(0);
            setSearchError("");
            setIsLoading(false);
            setIsLoadingMore(false);
            setHasSearched(false);
            setActiveFilter("all");
            inputRef.current?.focus();
      };

      const clearSearchHistory = () => {
            setSearchHistory([]);
            try {
                  window.localStorage.removeItem("mtstreams-search-history");
            } catch {
                  // Ignore unavailable local storage.
            }
      };

      const handleHistorySelect = (term) => {
            rememberSearch(term);
            setQuery(term);

            if (term === debouncedQuery) {
                  searchMovies(term);
            } else {
                  setDebouncedQuery(term);
            }
      };
      const handleOpen = useCallback((item) => {
            playSound("result-select");
            captureEvent("search_result_selected", {
                  content_id: String(item.id),
                  content_type: item.media_type,
                  content_title: getTitle(item),
            });
      }, []);

      const visibleResults = useMemo(
            () => activeFilter === "all" ? movieData : movieData.filter((item) => item.media_type === activeFilter),
            [activeFilter, movieData],
      );
      // The first movie/series with artwork becomes the spotlight; it isn't repeated in the grid.
      const spotlight = activeFilter !== "person" ? visibleResults.slice(0, 3).find((item) => item.media_type !== "person" && item.backdrop_path) : null;
      const gridResults = spotlight ? visibleResults.filter((item) => item !== spotlight) : visibleResults;

      const filterCount = (filterId) => filterId === "all"
            ? movieData.length
            : movieData.filter((item) => item.media_type === filterId).length;

      const posters = useMemo(() => trending.map((item) => item.poster_path).slice(0, 18), [trending]);

      return (
            <main className={`search-page search-v2 ${hasSearched ? "has-results" : ""}`}>
                  <section className="search-hero">
                        <PosterWall posters={posters} />
                        <div className="search-hero__veil" aria-hidden="true" />
                        <div className="search-hero__content">
                              <span className="search-page__eyebrow"><Clapperboard size={14} /> THE MTSTREAMS LIBRARY</span>
                              <h1>Find your <span>next story.</span></h1>
                              <p>Search across films, series and the people behind them.</p>

                              <form className="discover-search search-v2__bar" onSubmit={handleSubmit} role="search">
                                    <SearchIcon className="discover-search__icon" size={22} aria-hidden="true" />
                                    <input
                                          ref={inputRef}
                                          type="search"
                                          value={query}
                                          onChange={(event) => setQuery(event.target.value)}
                                          onKeyDown={(event) => {
                                                if (event.key === "Escape" && query) {
                                                      event.preventDefault();
                                                      handleClear();
                                                }
                                          }}
                                          placeholder="Search a title, series or person..."
                                          aria-label="Search movies, series and people"
                                          autoComplete="off"
                                    />
                                    {!query && <kbd className="search-v2__kbd" aria-hidden="true">/</kbd>}
                                    {query && (
                                          <button type="button" className="discover-search__clear" onClick={handleClear} aria-label="Clear search">
                                                <X size={18} />
                                          </button>
                                    )}
                                    <button type="submit" className="discover-search__submit" disabled={!query.trim() || isLoading}>
                                          {isLoading ? <LoaderCircle className="search-spin" size={18} /> : <span>Search</span>}
                                    </button>
                              </form>

                              {!query.trim() && (
                                    <div className="search-v2__quick">
                                          {searchHistory.length > 0 && (
                                                <div className="search-v2__chips" aria-label="Recent searches">
                                                      <span className="search-v2__label">Recent</span>
                                                      {searchHistory.map((term) => (
                                                            <button key={term.toLowerCase()} type="button" onClick={() => handleHistorySelect(term)}>
                                                                  <SearchIcon size={13} aria-hidden="true" /> {term}
                                                            </button>
                                                      ))}
                                                      <button type="button" className="search-v2__clear-history" onClick={clearSearchHistory}>Clear</button>
                                                </div>
                                          )}
                                          {trending.length > 0 && (
                                                <div className="search-v2__chips" aria-label="Trending now">
                                                      <span className="search-v2__label"><Flame size={13} aria-hidden="true" /> Trending</span>
                                                      {trending.slice(0, 7).map((item) => (
                                                            <Link key={`${item.media_type}-${item.id}`} to={getDetailPath(item)} onClick={() => handleOpen(item)}>{getTitle(item)}</Link>
                                                      ))}
                                                </div>
                                          )}
                                          <div className="search-v2__chips" aria-label="Browse by mood">
                                                <span className="search-v2__label"><Compass size={13} aria-hidden="true" /> In the mood for</span>
                                                {MOOD_LINKS.map(([emoji, label, key]) => (
                                                      <Link key={key} to={`/discover?mood=${key}`} className="search-v2__mood">{emoji} {label}</Link>
                                                ))}
                                          </div>
                                    </div>
                              )}
                        </div>
                  </section>

                  {hasSearched && (
                        <div className="search-page__inner">
                              <section className="search-results" aria-live="polite" aria-busy={isLoading}>
                                    <div className="search-results__heading">
                                          <div>
                                                <span className="search-results__eyebrow">YOUR RESULTS</span>
                                                <h2>{searchError && !movieData.length ? "Search unavailable" : `Results for “${query.trim()}”`}</h2>
                                                {!isLoading && movieData.length > 0 && <p>{totalResults.toLocaleString()} matches found</p>}
                                          </div>
                                          {!isLoading && movieData.length > 0 && (
                                                <div className="search-filters" aria-label="Filter search results">
                                                      {filters.map((filter) => (
                                                            <button
                                                                  key={filter.id}
                                                                  type="button"
                                                                  className={activeFilter === filter.id ? "is-active" : ""}
                                                                  onClick={() => setActiveFilter(filter.id)}
                                                                  aria-pressed={activeFilter === filter.id}
                                                            >
                                                                  {filter.label}<span>{filterCount(filter.id)}</span>
                                                            </button>
                                                      ))}
                                                </div>
                                          )}
                                    </div>

                                    {searchError && !movieData.length ? (
                                          <div className="search-state"><p>{searchError}</p><button type="button" onClick={handleSubmit}>Try again</button></div>
                                    ) : isLoading ? (
                                          <div className="search-results-grid">
                                                {Array.from({ length: 8 }, (_, index) => <div className="search-card-skeleton" key={index} />)}
                                          </div>
                                    ) : visibleResults.length > 0 ? (
                                          <>
                                                {spotlight && <SpotlightCard key={`${spotlight.media_type}-${spotlight.id}`} item={spotlight} onOpen={handleOpen} />}
                                                <div className="search-results-grid" key={`${debouncedQuery}-${activeFilter}`}>
                                                      {gridResults.map((item, index) => <SearchResultCard key={`${item.media_type}-${item.id}`} item={item} index={index} onOpen={handleOpen} />)}
                                                </div>
                                                {searchError && <p className="search-v2__inline-error" role="alert">{searchError}</p>}
                                                {page < totalPages && (
                                                      <button type="button" className="search-v2__more" disabled={isLoadingMore} onClick={() => searchMovies(debouncedQuery || query, page + 1)}>
                                                            {isLoadingMore ? <><LoaderCircle className="search-spin" size={16} /> Loading</> : "Load more results"}
                                                      </button>
                                                )}
                                          </>
                                    ) : (
                                          <div className="search-state">
                                                <div className="search-state__icon"><SearchIcon size={26} /></div>
                                                <h3>{movieData.length ? "Nothing in this category" : "No titles found"}</h3>
                                                <p>{movieData.length ? "Try another filter to explore the rest of your results." : "Try another title, spelling or name."}</p>
                                          </div>
                                    )}
                              </section>
                        </div>
                  )}
            </main>
      );
};

export default Search;
