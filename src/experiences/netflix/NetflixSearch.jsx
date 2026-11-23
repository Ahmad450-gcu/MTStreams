import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PlayCircle, Search, X } from "lucide-react";
import Img from "../shared/Img";
import { GridView } from "./components/NetflixGrid";
import { titleOf, useCatalogue, useDebounced, useMediaQuery, useServiceSearch } from "../shared/hooks";
import { useOpenTitle } from "./useOpenTitle";

function TopSearches() {
      const { items, loading } = useCatalogue("netflix", { types: ["movie", "tv"], sort: "trending" }, { target: 20 });
      const openTitle = useOpenTitle();
      return (
            <section className="nfx-topsearch">
                  <h2>Top Searches</h2>
                  <ul>
                        {items.slice(0, 18).map((item) => (
                              <li key={`${item.media_type}-${item.id}`}>
                                    <button type="button" onClick={() => openTitle(item)}>
                                          <span className="nfx-topsearch__art"><Img path={item.backdrop_path || item.poster_path} size="w300" alt="" fallbackTitle={titleOf(item)} /></span>
                                          <span className="nfx-topsearch__title">{titleOf(item)}</span>
                                          <PlayCircle size={34} strokeWidth={1.3} className="nfx-topsearch__play" />
                                    </button>
                              </li>
                        ))}
                        {loading && Array.from({ length: 6 }).map((_, index) => <li key={index} className="nfx-topsearch__skeleton xp-skeleton" />)}
                  </ul>
            </section>
      );
}

export default function NetflixSearch() {
      const [params] = useSearchParams();
      const navigate = useNavigate();
      const isMobile = useMediaQuery("(max-width: 740px)");
      const query = params.get("q") || "";
      const [draft, setDraft] = useState(query);
      const debounced = useDebounced(query, 300);
      const search = useServiceSearch("netflix", debounced);

      useEffect(() => setDraft(query), [query]);
      useEffect(() => {
            document.title = query ? `${query} - Search - Notflix` : "Search - Notflix";
      }, [query]);

      const suggestions = search.items.slice(0, 6).map(titleOf);

      return (
            <div className="nfx-page nfx-page--search">
                  {isMobile && (
                        <label className="nfx-msearch">
                              <Search size={20} />
                              <input
                                    autoFocus
                                    value={draft}
                                    placeholder="Search shows, movies…"
                                    onChange={(event) => {
                                          setDraft(event.target.value);
                                          navigate(`/search${event.target.value ? `?q=${encodeURIComponent(event.target.value)}` : ""}`, { replace: true });
                                    }}
                              />
                              {draft && <button type="button" aria-label="Clear" onClick={() => navigate("/search", { replace: true })}><X size={18} /></button>}
                        </label>
                  )}

                  {!query.trim() ? (
                        <TopSearches />
                  ) : (
                        <>
                              {suggestions.length > 0 && (
                                    <div className="nfx-suggest">
                                          <span>Explore titles related to:</span>
                                          <ul>
                                                {suggestions.map((title, index) => (
                                                      <li key={`${title}-${index}`}>
                                                            <button type="button" onClick={() => navigate(`/search?q=${encodeURIComponent(title)}`, { replace: true })}>{title}</button>
                                                      </li>
                                                ))}
                                          </ul>
                                    </div>
                              )}
                              <GridView
                                    {...search}
                                    loading={search.loading || query !== debounced}
                                    empty={`Your search for "${query}" did not have any matches on Notflix. Try different keywords, or a movie or show title.`}
                              />
                        </>
                  )}
            </div>
      );
}
