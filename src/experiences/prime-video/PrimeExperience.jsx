import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import "./prime.css";
import PrimeNavigation from "./PrimeNavigation";
import PrimeDetails from "./PrimeDetails";
import { PrimeBrowse, PrimeCategories, PrimeGrid, PrimeHome, PrimeMyStuff, PrimeRail } from "./PrimeHome";
import { isImmersivePath } from "../shared/navigation";
import { useCatalogue, useDebounced, useServiceSearch } from "../shared/hooks";

function PrimeSearch() {
      const [params] = useSearchParams();
      const navigate = useNavigate();
      const query = params.get("q") || "";
      const [draft, setDraft] = useState(query);
      const [filter, setFilter] = useState("all");
      const debounced = useDebounced(draft, 350);
      const search = useServiceSearch("prime", debounced);
      const trending = useCatalogue("prime", { types: ["movie", "tv"], sort: "trending" }, { target: 20, enabled: !debounced.trim() });

      useEffect(() => setDraft(query), [query]);
      useEffect(() => {
            if (debounced !== query) navigate(debounced ? `/search?q=${encodeURIComponent(debounced)}` : "/search", { replace: true });
            document.title = debounced ? `prima video: ${debounced}` : "prima video: Search";
      }, [debounced, query, navigate]);

      const items = search.items.filter((item) => filter === "all" || item.media_type === filter);
      return (
            <div className="pv-page pv-page--padded">
                  <label className="pv-findbar">
                        <Search size={22} />
                        <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Search by actor, title…" aria-label="Search" autoFocus />
                  </label>
                  {debounced.trim().length >= 2 ? (
                        <>
                              <h1 className="pv-results">Results for &ldquo;{debounced}&rdquo;</h1>
                              <div className="pv-chips">
                                    {[["all", "All"], ["movie", "Movies"], ["tv", "TV shows"]].map(([value, label]) => (
                                          <button key={value} type="button" className={filter === value ? "is-active" : ""} onClick={() => setFilter(value)}>{label}</button>
                                    ))}
                              </div>
                              <PrimeGrid items={items} emptyText={search.loading ? "" : `No results for "${debounced}" on prima video.`} />
                              {search.loading && <div className="pv-grid">{Array.from({ length: 8 }).map((_, index) => <span key={index} className="pv-skel pv-skel--card xp-skeleton" />)}</div>}
                              {search.error && <div className="pv-error"><span>{search.error}</span><button type="button" onClick={search.retry}>Retry</button></div>}
                              {search.hasMore && !search.loading && search.items.length > 0 && <button type="button" className="pv-loadmore" onClick={search.loadMore}>Show more results</button>}
                        </>
                  ) : (
                        <PrimeRail title="Trending searches" items={trending.items} loading={trending.loading} kind="card" />
                  )}
            </div>
      );
}

export default function PrimeExperience({ page }) {
      const { pathname } = useLocation();
      let content;
      switch (page) {
            case "movies": content = <PrimeBrowse type="movie" />; break;
            case "tv": content = <PrimeBrowse type="tv" />; break;
            case "search": content = <PrimeSearch />; break;
            case "list": content = <PrimeMyStuff />; break;
            case "collection": content = <PrimeCategories />; break;
            case "movie": content = <PrimeDetails mediaType="movie" />; break;
            case "tvdetail": content = <PrimeDetails mediaType="tv" />; break;
            default: content = <PrimeHome />;
      }
      return (
            <div className={`pv xp-root ${isImmersivePath(pathname) ? "is-immersive" : ""}`}>
                  <PrimeNavigation />
                  <main>{content}</main>
                  <footer className="pv-footer">
                        <span>prima video is a fan-made interface inside MTStreams.</span>
                        <span>Terms and Privacy Notice · Send us feedback · Help</span>
                  </footer>
            </div>
      );
}
