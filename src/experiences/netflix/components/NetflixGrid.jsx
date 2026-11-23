import { Play } from "lucide-react";
import Img from "../../shared/Img";
import { isRecent, titleOf, useInfiniteSentinel, usePagedCatalogue, useMediaQuery } from "../../shared/hooks";
import { genreNames } from "../../shared/services";
import { useOpenTitle } from "../useOpenTitle";

export function GridCard({ item }) {
      const openTitle = useOpenTitle();
      const isMobile = useMediaQuery("(max-width: 740px)");
      const title = titleOf(item);
      return (
            <button type="button" className="nfx-gcard" onClick={() => openTitle(item)} aria-label={title}>
                  <span className="nfx-gcard__art">
                        <Img path={isMobile ? item.poster_path || item.backdrop_path : item.backdrop_path || item.poster_path} size={isMobile ? "w342" : "w500"} alt={title} fallbackTitle={title} />
                        {!isMobile && <span className="nfx-card__boxtitle">{title}</span>}
                        {isRecent(item, 60) && <span className="nfx-badge">{isMobile ? "New" : "Recently Added"}</span>}
                  </span>
                  {!isMobile && (
                        <span className="nfx-gcard__hover" aria-hidden="true">
                              <span className="nfx-circle nfx-circle--play"><Play size={14} fill="currentColor" /></span>
                              <span className="nfx-gcard__tags">{genreNames(item, 2).join(" • ")}</span>
                        </span>
                  )}
            </button>
      );
}

/** Presentational infinite grid with skeletons, errors, empty state and Load More. */
export function GridView({ items, loading, error, hasMore, loadMore, retry, empty = "No titles found." }) {
      const sentinel = useInfiniteSentinel(() => !loading && hasMore && loadMore(), hasMore && !error);
      return (
            <>
                  <div className="nfx-grid">
                        {items.map((item) => <GridCard key={`${item.media_type}-${item.id}`} item={item} />)}
                        {loading && Array.from({ length: items.length ? 6 : 18 }).map((_, index) => <span key={`s${index}`} className="nfx-gcard nfx-gcard--skeleton xp-skeleton" />)}
                  </div>
                  {!loading && !error && !items.length && <p className="nfx-empty">{empty}</p>}
                  {error && (
                        <div className="nfx-row__error nfx-row__error--center">
                              <span>{error}</span>
                              <button type="button" onClick={retry}>Try Again</button>
                        </div>
                  )}
                  <div ref={sentinel} className="nfx-grid__sentinel" />
                  {hasMore && !loading && !error && items.length > 0 && (
                        <button type="button" className="nfx-loadmore" onClick={loadMore}>Load More</button>
                  )}
            </>
      );
}

export default function NetflixGrid({ spec, pageSize = 30 }) {
      const catalogue = usePagedCatalogue("netflix", spec, { pageSize });
      return <GridView {...catalogue} />;
}
