import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, Compass, Star, UserCheck, UserPlus } from "lucide-react";
import { describeError, tmdbGet } from "../../experiences/shared/engine/tmdb";
import { toggleFollow, useFollowing } from "./following";
import "./people.css";

const today = () => new Date().toISOString().slice(0, 10);

/** Follow / unfollow, plus a Discover shortcut for this person's movies. */
export function PersonActions({ person }) {
      const following = useFollowing();
      const followed = following.some((entry) => entry.id === Number(person.id));
      const directing = person.known_for_department === "Directing" || person.known_for_department === "Writing";
      const discoverUrl = `/discover?${new URLSearchParams(directing ? { crew: String(person.id), crewName: person.name } : { cast: String(person.id), castName: person.name })}`;
      return (
            <div className="ppl-actions">
                  <button type="button" className={`ppl-follow ${followed ? "is-on" : ""}`} aria-pressed={followed} onClick={() => toggleFollow(person)}>
                        {followed ? <UserCheck size={16} /> : <UserPlus size={16} />} {followed ? "Following" : "Follow"}
                  </button>
                  <Link to={discoverUrl} className="ppl-discover"><Compass size={16} /> Filter movies</Link>
            </div>
      );
}

/**
 * Full filmography (movies and TV, acting and crew). Loaded only when the
 * section scrolls into view: one request, cached at the CDN and in memory.
 */
export function Filmography({ personId }) {
      const ref = useRef(null);
      const [visible, setVisible] = useState(false);
      const [state, setState] = useState({ status: "idle", data: null, error: "" });
      const [tab, setTab] = useState("cast");
      const [type, setType] = useState("all");
      const [attempt, setAttempt] = useState(0);

      useEffect(() => {
            if (visible || !ref.current) return undefined;
            const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setVisible(true), { rootMargin: "300px 0px" });
            observer.observe(ref.current);
            return () => observer.disconnect();
      }, [visible]);

      useEffect(() => {
            if (!visible) return undefined;
            let alive = true;
            setState({ status: "loading", data: null, error: "" });
            tmdbGet(`person/${personId}/combined_credits`, {})
                  .then((data) => alive && setState({ status: "ready", data, error: "" }))
                  .catch((error) => alive && setState({ status: "error", data: null, error: describeError(error) }));
            return () => {
                  alive = false;
            };
      }, [visible, personId, attempt]);

      const rows = useMemo(() => {
            const source = state.data?.[tab] || [];
            // Crew credits repeat a title once per job; merge them.
            const merged = new Map();
            source.forEach((credit) => {
                  if (credit.media_type !== "movie" && credit.media_type !== "tv") return;
                  const key = `${credit.media_type}:${credit.id}`;
                  const role = tab === "cast" ? credit.character : credit.job;
                  const existing = merged.get(key);
                  if (existing) {
                        if (role && !existing.roles.includes(role)) existing.roles.push(role);
                  } else {
                        merged.set(key, { ...credit, key, roles: role ? [role] : [], date: credit.release_date || credit.first_air_date || "" });
                  }
            });
            return [...merged.values()]
                  .filter((credit) => type === "all" || credit.media_type === type)
                  .sort((a, b) => (b.date || "9999").localeCompare(a.date || "9999"));
      }, [state.data, tab, type]);

      const knownFor = useMemo(() => {
            const all = [...(state.data?.cast || []), ...(state.data?.crew || [])].filter((credit) => credit.poster_path && (credit.media_type === "movie" || credit.media_type === "tv"));
            const seen = new Set();
            return all
                  .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
                  .filter((credit) => !seen.has(`${credit.media_type}:${credit.id}`) && seen.add(`${credit.media_type}:${credit.id}`))
                  .slice(0, 8);
      }, [state.data]);

      const counts = { cast: state.data?.cast?.length || 0, crew: state.data?.crew?.length || 0 };

      return (
            <section ref={ref} className="ppl-film" aria-label="Filmography">
                  <h2>Filmography</h2>
                  {state.status === "error" && (
                        <div className="ppl-error" role="alert"><span>{state.error}</span><button type="button" onClick={() => setAttempt((value) => value + 1)}>Try again</button></div>
                  )}
                  {(state.status === "idle" || state.status === "loading") && <div className="ppl-skeleton" aria-label="Loading filmography" />}
                  {state.status === "ready" && (
                        <>
                              {knownFor.length > 0 && (
                                    <>
                                          <h3 className="ppl-sub">Known for</h3>
                                          <div className="ppl-known">
                                                {knownFor.map((credit) => (
                                                      <Link key={`${credit.media_type}-${credit.id}`} to={`/${credit.media_type}/details/${credit.id}`} className="ppl-known__item">
                                                            <img src={`https://image.tmdb.org/t/p/w185${credit.poster_path}`} alt="" loading="lazy" decoding="async" />
                                                            <span>{credit.title || credit.name}</span>
                                                      </Link>
                                                ))}
                                          </div>
                                    </>
                              )}
                              <div className="ppl-toolbar">
                                    <div className="ppl-tabs" role="tablist">
                                          {[["cast", "Acting"], ["crew", "Directing & crew"]].map(([key, label]) => (
                                                <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? "is-on" : ""} onClick={() => setTab(key)} disabled={!counts[key]}>
                                                      {label} <span>{counts[key]}</span>
                                                </button>
                                          ))}
                                    </div>
                                    <select value={type} onChange={(event) => setType(event.target.value)} aria-label="Media type">
                                          <option value="all">Movies &amp; TV</option>
                                          <option value="movie">Movies</option>
                                          <option value="tv">TV</option>
                                    </select>
                              </div>
                              {rows.length ? (
                                    <ul className="ppl-list">
                                          {rows.map((credit) => {
                                                const upcoming = !credit.date || credit.date > today();
                                                return (
                                                      <li key={credit.key}>
                                                            <span className="ppl-list__year">{upcoming ? <Clock size={13} aria-label="Upcoming" /> : credit.date.slice(0, 4)}</span>
                                                            <Link to={`/${credit.media_type}/details/${credit.id}`} className="ppl-list__title">{credit.title || credit.name}</Link>
                                                            <span className="ppl-list__role">
                                                                  {credit.roles.slice(0, 3).join(", ")}
                                                                  {credit.media_type === "tv" && credit.episode_count ? ` · ${credit.episode_count} ep.` : ""}
                                                            </span>
                                                            <span className="ppl-list__meta">
                                                                  {upcoming && <em>Upcoming</em>}
                                                                  {credit.vote_average > 0 && credit.vote_count >= 20 && <><Star size={11} fill="currentColor" /> {credit.vote_average.toFixed(1)}</>}
                                                                  <small>{credit.media_type === "tv" ? "TV" : "Film"}</small>
                                                            </span>
                                                      </li>
                                                );
                                          })}
                                    </ul>
                              ) : (
                                    <p className="ppl-empty">No {tab === "cast" ? "acting" : "crew"} credits{type !== "all" ? ` for ${type === "tv" ? "TV" : "movies"}` : ""}.</p>
                              )}
                        </>
                  )}
            </section>
      );
}
