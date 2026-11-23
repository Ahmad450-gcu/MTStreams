import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, ChevronLeft, ChevronRight, Play, Plus, ThumbsUp } from "lucide-react";
import Img from "../../shared/Img";
import { genreNames } from "../../shared/services";
import { isRecent, progressOf, runtimeLabel, titleOf, useCertification, useInView, useMediaQuery, useMyList, useTmdb } from "../../shared/hooks";
import { useOpenTitle } from "../useOpenTitle";

// Hover intent: a short pause before the first preview opens (so sweeping the
// pointer across a row doesn't pop cards), then instant switching while one
// is already open.
const HOVER_INTENT_MS = 150;

const perPageFor = (width) => (width >= 1400 ? 6 : width >= 1100 ? 5 : width >= 800 ? 4 : width >= 500 ? 3 : 2);

function RankNumber({ rank }) {
      return (
            <svg className="nfx-rank" viewBox="0 0 100 150" preserveAspectRatio="xMaxYMax meet" aria-hidden="true">
                  <text x={rank === 10 ? "104" : "100"} y="146" textAnchor="end" letterSpacing={rank === 10 ? "-18" : "0"}>{rank}</text>
            </svg>
      );
}

function CardArt({ item, variant, entry }) {
      const title = titleOf(item);
      if (variant === "top10") {
            return (
                  <div className="nfx-card__top10">
                        <RankNumber rank={item.__rank} />
                        <div className="nfx-card__poster">
                              <Img path={item.poster_path} size="w342" alt={title} fallbackTitle={title} />
                              {isRecent(item, 60) && <span className="nfx-badge nfx-badge--poster">Recently Added</span>}
                        </div>
                  </div>
            );
      }
      return (
            <div className="nfx-card__box">
                  <Img path={item.backdrop_path || item.poster_path} size="w500" alt={title} fallbackTitle={title} />
                  <span className="nfx-card__boxtitle" aria-hidden="true">{title}</span>
                  {variant === "continue" ? (
                        <>
                              <span className="nfx-card__playhint"><Play size={28} fill="currentColor" /></span>
                              <span className="nfx-progress"><span style={{ width: `${progressOf(entry) * 100}%` }} /></span>
                        </>
                  ) : (
                        isRecent(item, 60) && <span className="nfx-badge">{item.media_type === "tv" ? "New Episodes" : "Recently Added"}</span>
                  )}
            </div>
      );
}

function MobileCard({ item, variant, onOpen }) {
      const title = titleOf(item);
      if (variant === "continue") {
            return (
                  <button type="button" className="nfx-mcard nfx-mcard--continue" onClick={onOpen} aria-label={title}>
                        <Img path={item.poster_path} size="w342" alt={title} fallbackTitle={title} />
                        <span className="nfx-mcard__play"><Play size={22} fill="currentColor" /></span>
                        <span className="nfx-progress"><span style={{ width: `${progressOf(item) * 100}%` }} /></span>
                  </button>
            );
      }
      return (
            <button type="button" className={`nfx-mcard ${variant === "top10" ? "nfx-mcard--top10" : ""}`} onClick={onOpen} aria-label={title}>
                  {variant === "top10" && <RankNumber rank={item.__rank} />}
                  <span className="nfx-mcard__poster">
                        <Img path={item.poster_path} size="w342" alt={title} fallbackTitle={title} />
                        {isRecent(item, 60) && <span className="nfx-badge nfx-badge--poster">New</span>}
                  </span>
            </button>
      );
}

function PreviewPopup({ hover, onEnter, onLeave, onClose }) {
      const { item, rect, align } = hover;
      const openTitle = useOpenTitle();
      const { has, toggle } = useMyList("netflix");
      const details = useTmdb(`${item.media_type}/${item.id}`, {}, true);
      const cert = useCertification(item.media_type, item.id);
      const [liked, setLiked] = useState(false);
      const title = titleOf(item);
      const width = rect.width * 1.5;
      const imageHeight = (width * 9) / 16;
      const left = align === "left" ? rect.left : align === "right" ? rect.left + rect.width - width : rect.left - (width - rect.width) / 2;
      const top = rect.top + rect.height / 2 - imageHeight / 2 - 8;
      const origin = align === "left" ? "left center" : align === "right" ? "right center" : "center center";
      const detail = details.data;
      const length = item.media_type === "tv"
            ? detail?.number_of_seasons ? `${detail.number_of_seasons} Season${detail.number_of_seasons > 1 ? "s" : ""}` : detail?.number_of_episodes ? `${detail.number_of_episodes} Episodes` : ""
            : runtimeLabel(detail?.runtime);
      const tags = (detail?.genres || []).map((genre) => genre.name).slice(0, 3);

      return (
            <motion.div
                  className="nfx-preview"
                  style={{ left, top, width, transformOrigin: origin }}
                  initial={{ scale: 1 / 1.5, opacity: 0.85 }}
                  animate={{ scale: 1, opacity: 1, transition: { duration: 0.22, ease: [0.25, 0.8, 0.25, 1] } }}
                  exit={{ scale: 1 / 1.5, opacity: 0, transition: { duration: 0.16, ease: [0.4, 0, 1, 1] } }}
                  onMouseEnter={onEnter}
                  onMouseLeave={onLeave}
            >
                  <button type="button" className="nfx-preview__media" onClick={() => { onClose(); openTitle(item); }} aria-label={`More info on ${title}`}>
                        <Img path={item.backdrop_path || item.poster_path} size="w500" alt={title} fallbackTitle={title} eager />
                        <span className="nfx-card__boxtitle nfx-card__boxtitle--large">{title}</span>
                  </button>
                  <div className="nfx-preview__info">
                        <div className="nfx-preview__buttons">
                              <button type="button" className="nfx-circle nfx-circle--play" aria-label="Play" onClick={() => { onClose(); openTitle(item, { play: true }); }}>
                                    <Play size={18} fill="currentColor" />
                              </button>
                              <button type="button" className="nfx-circle" aria-label={has(item) ? "Remove from My List" : "Add to My List"} onClick={() => toggle(item)}>
                                    {has(item) ? <Check size={18} /> : <Plus size={18} />}
                              </button>
                              <button type="button" className={`nfx-circle ${liked ? "is-on" : ""}`} aria-label="I like this" onClick={() => setLiked((value) => !value)}>
                                    <ThumbsUp size={16} fill={liked ? "currentColor" : "none"} />
                              </button>
                              <button type="button" className="nfx-circle nfx-circle--more" aria-label="Episodes and info" onClick={() => { onClose(); openTitle(item); }}>
                                    <ChevronDown size={20} />
                              </button>
                        </div>
                        <div className="nfx-preview__meta">
                              {isRecent(item, 90) && <span className="nfx-new">New</span>}
                              {cert && <span className="nfx-boxed">{cert}</span>}
                              {length && <span>{length}</span>}
                              <span className="nfx-boxed nfx-boxed--hd">HD</span>
                        </div>
                        <ul className="nfx-preview__tags">
                              {(tags.length ? tags : genreNames(item, 3)).map((tag) => <li key={tag}>{tag}</li>)}
                        </ul>
                  </div>
            </motion.div>
      );
}

/**
 * The Notflix "row": paged slider with edge handles, page indicator, hover
 * preview cards (desktop) and a native swipe rail on phones.
 */
export default function Row({ title, items = [], loading, error, onRetry, variant = "standard", exploreTo, onNeedMore, hasMore }) {
      const isMobile = useMediaQuery("(max-width: 740px)");
      const canHover = useMediaQuery("(hover: hover) and (pointer: fine)");
      const openTitle = useOpenTitle();
      const rowRef = useRef(null);
      const sliderRef = useRef(null);
      const [width, setWidth] = useState(1200);
      const [offset, setOffset] = useState(0);
      const [moved, setMoved] = useState(false);
      const [hover, setHover] = useState(null);
      const enterTimer = useRef(null);
      const leaveTimer = useRef(null);
      const hoverOpen = useRef(false);
      hoverOpen.current = Boolean(hover);

      useLayoutEffect(() => {
            const node = sliderRef.current;
            if (!node) return undefined;
            const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
            observer.observe(node);
            return () => observer.disconnect();
      }, [isMobile]);

      const perPage = perPageFor(width);
      const pages = Math.max(1, Math.ceil(items.length / perPage));
      const maxOffset = Math.max(0, items.length - perPage);
      const page = Math.min(pages - 1, Math.ceil(offset / perPage));

      useEffect(() => {
            if (offset > maxOffset) setOffset(maxOffset);
      }, [offset, maxOffset]);

      const go = (direction) => {
            setHover(null);
            setMoved(true);
            setOffset((current) => {
                  const next = Math.max(0, Math.min(maxOffset, current + direction * perPage));
                  if (direction > 0 && next + perPage * 2 >= items.length && hasMore) onNeedMore?.();
                  return next;
            });
      };

      const cancelTimers = () => {
            clearTimeout(enterTimer.current);
            clearTimeout(leaveTimer.current);
      };

      const scheduleHover = useCallback((event, item, index) => {
            if (!canHover) return;
            cancelTimers();
            const card = event.currentTarget;
            const show = () => {
                  const rowBox = rowRef.current.getBoundingClientRect();
                  const box = (variant === "top10" ? card : card.querySelector(".nfx-card__box") || card).getBoundingClientRect();
                  const position = index - offset;
                  const align = position <= 0 ? "left" : position >= perPage - 1 ? "right" : "center";
                  setHover({
                        item,
                        align,
                        rect: { left: box.left - rowBox.left, top: box.top - rowBox.top, width: box.width, height: box.height },
                  });
            };
            if (hoverOpen.current) show();
            else enterTimer.current = setTimeout(show, HOVER_INTENT_MS);
      }, [canHover, offset, perPage, variant]);

      const leaveSoon = () => {
            clearTimeout(enterTimer.current);
            leaveTimer.current = setTimeout(() => setHover(null), 120);
      };

      useEffect(() => () => cancelTimers(), []);

      if (!loading && !error && !items.length) return null;

      return (
            <section className={`nfx-row nfx-row--${variant} ${hover ? "is-hovering" : ""}`} ref={rowRef} aria-label={title}>
                  <h2 className="nfx-row__header">
                        {exploreTo ? (
                              <Link to={exploreTo} className="nfx-row__title">
                                    <span>{title}</span>
                                    <span className="nfx-row__explore">Explore All <ChevronRight size={14} /></span>
                              </Link>
                        ) : (
                              <span className="nfx-row__title"><span>{title}</span></span>
                        )}
                        {!isMobile && pages > 1 && (
                              <ul className="nfx-row__pages" aria-hidden="true">
                                    {Array.from({ length: pages }).map((_, index) => <li key={index} className={index === page ? "is-active" : ""} />)}
                              </ul>
                        )}
                  </h2>

                  {error && !items.length ? (
                        <div className="nfx-row__error">
                              <span>{error}</span>
                              <button type="button" onClick={onRetry}>Try Again</button>
                        </div>
                  ) : isMobile ? (
                        <div className="nfx-mrow xp-scroll-x" data-lenis-prevent>
                              {items.map((item, index) => (
                                    <MobileCard key={`${item.media_type}-${item.id}`} item={{ ...item, __rank: index + 1 }} variant={variant} onOpen={() => openTitle(item, variant === "continue" ? { play: true } : {})} />
                              ))}
                              {loading && Array.from({ length: items.length ? 2 : 5 }).map((_, index) => <span key={`s${index}`} className="nfx-mcard nfx-mcard--skeleton xp-skeleton" />)}
                        </div>
                  ) : (
                        <div className="nfx-slider" ref={sliderRef}>
                              {moved && offset > 0 && (
                                    <button type="button" className="nfx-handle nfx-handle--prev" onClick={() => go(-1)} aria-label="See previous titles">
                                          <ChevronLeft size={40} />
                                    </button>
                              )}
                              <div className="nfx-slider__mask">
                                    <div className="nfx-slider__track" style={{ transform: `translate3d(${-(offset * 100) / perPage}%,0,0)` }}>
                                          {items.map((item, index) => (
                                                <div
                                                      key={`${item.media_type}-${item.id}`}
                                                      className="nfx-slider__item"
                                                      style={{ width: `${100 / perPage}%` }}
                                                >
                                                      <div
                                                            className="nfx-card"
                                                            role="button"
                                                            tabIndex={0}
                                                            aria-label={titleOf(item)}
                                                            onMouseEnter={(event) => scheduleHover(event, item, index)}
                                                            onMouseLeave={leaveSoon}
                                                            onClick={() => openTitle(item, variant === "continue" ? { play: true } : {})}
                                                            onKeyDown={(event) => event.key === "Enter" && openTitle(item)}
                                                      >
                                                            <CardArt item={{ ...item, __rank: index + 1 }} variant={variant} entry={item} />
                                                      </div>
                                                </div>
                                          ))}
                                          {loading && Array.from({ length: Math.max(perPage - (items.length - offset), items.length ? 1 : perPage) }).map((_, index) => (
                                                <div key={`sk${index}`} className="nfx-slider__item" style={{ width: `${100 / perPage}%` }}>
                                                      <div className={`nfx-card nfx-card--skeleton xp-skeleton ${variant === "top10" ? "is-top10" : ""}`} />
                                                </div>
                                          ))}
                                    </div>
                              </div>
                              {offset < maxOffset && (
                                    <button type="button" className="nfx-handle nfx-handle--next" onClick={() => go(1)} aria-label="See more titles">
                                          <ChevronRight size={40} />
                                    </button>
                              )}
                        </div>
                  )}

                  <AnimatePresence>
                        {hover && (
                              <PreviewPopup
                                    key={`${hover.item.media_type}-${hover.item.id}`}
                                    hover={hover}
                                    onEnter={cancelTimers}
                                    onLeave={leaveSoon}
                                    onClose={() => setHover(null)}
                              />
                        )}
                  </AnimatePresence>
            </section>
      );
}

/** Lazily mounts a row's data source once it nears the viewport. */
export function LazyRow({ children, minHeight = 220 }) {
      const [ref, inView] = useInView({ rootMargin: "600px 0px" });
      return (
            <div ref={ref} style={inView ? undefined : { minHeight }}>
                  {inView ? children : null}
            </div>
      );
}
