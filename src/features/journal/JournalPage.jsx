import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, BookOpen, Clock, Film, Star, Tag, Tv, Users } from "lucide-react";
import { tmdbGet } from "../../experiences/shared/engine/tmdb";
import useLibrary from "../library/useLibrary";
import { updateItem } from "../library/store";
import { readCache, writeCache } from "../shared/localCache";
import { GENRES } from "../discover/discoverConfig";
import "./journal.css";

const GENRE_NAMES = new Map([...GENRES.movie, ...GENRES.tv]);
const MONTH = new Intl.DateTimeFormat(undefined, { month: "short" });
const DATE = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" });
const CREDIT_TTL = 30 * 24 * 60 * 60 * 1000;
const PEOPLE_LIMIT = 30;

const toInputDate = (ms) => (ms ? new Date(ms - new Date(ms).getTimezoneOffset() * 60000).toISOString().slice(0, 10) : "");
const fromInputDate = (value) => (value ? new Date(`${value}T12:00:00`).getTime() : null);

function Stat({ icon: Icon, label, value, note }) {
      return (
            <div className="jr-stat">
                  <Icon size={18} aria-hidden="true" />
                  <strong>{value}</strong>
                  <span>{label}</span>
                  {note && <small>{note}</small>}
            </div>
      );
}

/** Opt-in: count actors/directors across recently watched titles (cached credits). */
function TopPeople({ watched }) {
      const [state, setState] = useState({ status: "idle", done: 0, actors: [], directors: [] });
      const targets = watched.slice(0, PEOPLE_LIMIT);
      const cachedCount = targets.filter((item) => readCache(`credits:${item.key}`, CREDIT_TTL)).length;

      const run = async () => {
            setState({ status: "loading", done: 0, actors: [], directors: [] });
            const actors = new Map();
            const directors = new Map();
            let done = 0;
            await Promise.all(targets.map(async (item) => {
                  let credits = readCache(`credits:${item.key}`, CREDIT_TTL);
                  if (!credits) {
                        try {
                              const data = await tmdbGet(`${item.media_type}/${item.id}/credits`, {});
                              credits = {
                                    cast: (data?.cast || []).slice(0, 6).map((person) => ({ id: person.id, name: person.name, profile_path: person.profile_path })),
                                    directors: (data?.crew || []).filter((person) => person.job === "Director").map((person) => ({ id: person.id, name: person.name, profile_path: person.profile_path })),
                              };
                              writeCache(`credits:${item.key}`, credits);
                        } catch {
                              credits = { cast: [], directors: [] };
                        }
                  }
                  credits.cast.forEach((person) => actors.set(person.id, { ...person, count: (actors.get(person.id)?.count || 0) + 1 }));
                  credits.directors.forEach((person) => directors.set(person.id, { ...person, count: (directors.get(person.id)?.count || 0) + 1 }));
                  done += 1;
                  setState((current) => ({ ...current, done }));
            }));
            const top = (map, n) => [...map.values()].filter((person) => person.count > 1).sort((a, b) => b.count - a.count).slice(0, n);
            setState({ status: "ready", done, actors: top(actors, 8), directors: top(directors, 6) });
      };

      if (!targets.length) return <p className="jr-muted">Mark a few titles as watched to see who appears most in what you watch.</p>;
      if (state.status === "idle") {
            const needed = targets.length - cachedCount;
            return (
                  <div className="jr-people-cta">
                        <p>Based on the {targets.length} most recently watched title{targets.length === 1 ? "" : "s"}. {needed ? `Needs ${needed} cast list${needed === 1 ? "" : "s"} from TMDB (cached for 30 days afterwards).` : "Everything needed is already cached."}</p>
                        <button type="button" className="jr-btn" onClick={run}><Users size={16} /> Work it out</button>
                  </div>
            );
      }
      if (state.status === "loading") return <p className="jr-muted">Reading cast lists… {state.done}/{targets.length}</p>;
      const list = (people, empty) => (people.length ? (
            <ul className="jr-people">
                  {people.map((person) => (
                        <li key={person.id}>
                              <Link to={`/person/details/${person.id}`}>
                                    {person.profile_path ? <img src={`https://image.tmdb.org/t/p/w92${person.profile_path}`} alt="" loading="lazy" /> : <span className="jr-people__blank" />}
                                    <span>{person.name}<small>in {person.count} titles</small></span>
                              </Link>
                        </li>
                  ))}
            </ul>
      ) : <p className="jr-muted">{empty}</p>);
      return (
            <div className="jr-people-grid">
                  <div><h4>Actors</h4>{list(state.actors, "No actor appears in more than one watched title yet.")}</div>
                  <div><h4>Directors</h4>{list(state.directors, "No director appears in more than one watched movie yet.")}</div>
            </div>
      );
}

function JournalEntry({ item }) {
      const [open, setOpen] = useState(false);
      const [draft, setDraft] = useState({ review: item.review || "", moments: item.moments || "", tags: (item.tags || []).join(", ") });
      const [saved, setSaved] = useState(false);
      useEffect(() => setDraft({ review: item.review || "", moments: item.moments || "", tags: (item.tags || []).join(", ") }), [item.review, item.moments, item.tags]);
      const save = async () => {
            await updateItem(item.key, { review: draft.review, moments: draft.moments, tags: draft.tags });
            setSaved(true);
            setTimeout(() => setSaved(false), 1500);
      };
      return (
            <li className={`jr-entry ${open ? "is-open" : ""}`}>
                  <div className="jr-entry__head">
                        <Link to={`/${item.media_type}/details/${item.id}`} className="jr-entry__poster">
                              <img src={item.poster_path ? `https://image.tmdb.org/t/p/w154${item.poster_path}` : "/noImage.jpg"} alt="" loading="lazy" />
                        </Link>
                        <div className="jr-entry__info">
                              <Link to={`/${item.media_type}/details/${item.id}`}><h3>{item.title}</h3></Link>
                              <p>
                                    {item.media_type === "tv" ? "Series" : "Movie"}{item.release_date ? ` · ${item.release_date.slice(0, 4)}` : ""}
                                    {item.rating ? <span className="jr-entry__rating"><Star size={12} fill="currentColor" /> {item.rating}/10</span> : null}
                              </p>
                              <label className="jr-entry__date">
                                    Watched on
                                    <input type="date" value={toInputDate(item.watchedAt)} max={toInputDate(Date.now())} onChange={(event) => updateItem(item.key, { watchedAt: fromInputDate(event.target.value) })} />
                              </label>
                              {item.tags?.length ? <p className="jr-tags">{item.tags.map((tag) => <span key={tag}>#{tag}</span>)}</p> : null}
                              {!open && item.review ? <p className="jr-entry__review">“{item.review}”</p> : null}
                        </div>
                        <button type="button" className="jr-btn jr-btn--ghost" onClick={() => setOpen((value) => !value)} aria-expanded={open}>{open ? "Close" : item.review || item.moments ? "Edit entry" : "Write entry"}</button>
                  </div>
                  {open && (
                        <div className="jr-entry__editor">
                              <label>Review<textarea rows={4} maxLength={4000} value={draft.review} onChange={(event) => setDraft({ ...draft, review: event.target.value })} placeholder="What did you think?" /></label>
                              <label>Favourite moments<textarea rows={2} maxLength={2000} value={draft.moments} onChange={(event) => setDraft({ ...draft, moments: event.target.value })} placeholder="Scenes or lines you loved" /></label>
                              <label>Tags<input value={draft.tags} onChange={(event) => setDraft({ ...draft, tags: event.target.value })} placeholder="comma, separated, tags" maxLength={400} /></label>
                              <div className="jr-entry__actions">
                                    <button type="button" className="jr-btn" onClick={save}>{saved ? "Saved" : "Save entry"}</button>
                                    <span className="jr-muted">Your rating is set from the title’s Add to My List menu.</span>
                              </div>
                        </div>
                  )}
            </li>
      );
}

export default function JournalPage() {
      const library = useLibrary();
      const [tag, setTag] = useState("");
      const [text, setText] = useState("");
      useEffect(() => {
            document.title = "Journal & Stats | MTStreams";
      }, []);

      const items = useMemo(() => [...library.items.values()], [library.items]);
      const watched = useMemo(() => items.filter((item) => item.status === "watched").sort((a, b) => (b.watchedAt || b.updatedAt) - (a.watchedAt || a.updatedAt)), [items]);

      const stats = useMemo(() => {
            const movies = watched.filter((item) => item.media_type === "movie");
            const series = watched.filter((item) => item.media_type === "tv");
            const tracking = items.filter((item) => item.media_type === "tv" && item.status === "watching").length;
            const rated = items.filter((item) => item.rating);
            const average = rated.length ? rated.reduce((sum, item) => sum + item.rating, 0) / rated.length : null;
            const withRuntime = movies.filter((item) => item.runtime > 0);
            const minutes = withRuntime.reduce((sum, item) => sum + item.runtime, 0);
            const genres = new Map();
            watched.forEach((item) => (item.genre_ids || []).forEach((id) => genres.set(id, (genres.get(id) || 0) + 1)));
            const topGenres = [...genres.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([id, count]) => ({ name: GENRE_NAMES.get(id) || "Other", count }));
            const now = new Date();
            const months = Array.from({ length: 12 }, (_, index) => {
                  const date = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
                  return { key: `${date.getFullYear()}-${date.getMonth()}`, label: MONTH.format(date), count: 0 };
            });
            const years = new Map();
            watched.forEach((item) => {
                  if (!item.watchedAt) return;
                  const date = new Date(item.watchedAt);
                  const month = months.find((entry) => entry.key === `${date.getFullYear()}-${date.getMonth()}`);
                  if (month) month.count += 1;
                  years.set(date.getFullYear(), (years.get(date.getFullYear()) || 0) + 1);
            });
            return { movies: movies.length, series: series.length, tracking, average, minutes, runtimeCoverage: withRuntime.length, topGenres, months, years: [...years.entries()].sort((a, b) => b[0] - a[0]) };
      }, [items, watched]);

      const allTags = useMemo(() => [...new Set(watched.flatMap((item) => item.tags || []))].sort(), [watched]);
      const entries = watched.filter((item) => (!tag || item.tags?.includes(tag)) && (!text || `${item.title} ${item.review || ""} ${item.moments || ""}`.toLowerCase().includes(text.toLowerCase())));
      const maxMonth = Math.max(1, ...stats.months.map((month) => month.count));
      const maxGenre = Math.max(1, ...stats.topGenres.map((genre) => genre.count));

      return (
            <div className="catalog-page jr-page overflow-x-hidden w-full min-h-dvh pb-28 [background-image:var(--bg-gradient)]">
                  <header className="catalog-page__header">
                        <span className="catalog-page__eyebrow">YOUR VIEWING</span>
                        <h1>Journal &amp; Stats</h1>
                        <p>Built from what you mark as Watched in My List. Everything stays on this device.</p>
                  </header>

                  {!library.ready ? <div className="jr-skeleton" /> : (
                        <>
                              <section className="jr-stats" aria-label="Statistics">
                                    <Stat icon={Film} label="Movies watched" value={stats.movies} />
                                    <Stat icon={Tv} label="Series watched" value={stats.series} note={stats.tracking ? `${stats.tracking} in progress` : null} />
                                    <Stat icon={Star} label="Average rating" value={stats.average ? stats.average.toFixed(1) : "—"} note="your ratings, out of 10" />
                                    <Stat icon={Clock} label="Movie time" value={stats.minutes ? `${Math.floor(stats.minutes / 60)}h ${stats.minutes % 60}m` : "—"} note={stats.runtimeCoverage ? `estimated from ${stats.runtimeCoverage} movie runtime${stats.runtimeCoverage === 1 ? "" : "s"}; series not included` : "needs watched movies with a known runtime"} />
                              </section>

                              <div className="jr-panels">
                                    <section className="jr-panel" aria-label="Monthly activity">
                                          <h2><BarChart3 size={17} /> Last 12 months</h2>
                                          <div className="jr-bars">
                                                {stats.months.map((month) => (
                                                      <div key={month.key} className="jr-bar" title={`${month.count} watched`}>
                                                            <span style={{ height: `${(month.count / maxMonth) * 100}%` }}>{month.count ? <em>{month.count}</em> : null}</span>
                                                            <small>{month.label}</small>
                                                      </div>
                                                ))}
                                          </div>
                                          {stats.years.length > 0 && <p className="jr-years">{stats.years.map(([year, count]) => <span key={year}><strong>{count}</strong> in {year}</span>)}</p>}
                                          <p className="jr-muted">Dates come from when you marked a title as Watched (editable below). MTStreams can’t see how long you actually watched.</p>
                                    </section>
                                    <section className="jr-panel" aria-label="Favourite genres">
                                          <h2><Tag size={17} /> Favourite genres</h2>
                                          {stats.topGenres.length ? (
                                                <ul className="jr-genres">
                                                      {stats.topGenres.map((genre) => (
                                                            <li key={genre.name}><span>{genre.name}</span><span className="jr-genres__bar"><i style={{ width: `${(genre.count / maxGenre) * 100}%` }} /></span><strong>{genre.count}</strong></li>
                                                      ))}
                                                </ul>
                                          ) : <p className="jr-muted">Watch and mark a few titles to see your genres.</p>}
                                    </section>
                              </div>

                              <section className="jr-panel jr-panel--wide" aria-label="Top actors and directors">
                                    <h2><Users size={17} /> Who you watch most</h2>
                                    <TopPeople watched={watched} />
                              </section>

                              <section className="jr-journal" aria-label="Journal">
                                    <div className="jr-journal__head">
                                          <h2><BookOpen size={18} /> Journal <span>{watched.length}</span></h2>
                                          <div className="jr-journal__filters">
                                                <input value={text} onChange={(event) => setText(event.target.value)} placeholder="Search your journal" aria-label="Search your journal" />
                                                {allTags.length > 0 && (
                                                      <select value={tag} onChange={(event) => setTag(event.target.value)} aria-label="Filter by tag">
                                                            <option value="">All tags</option>
                                                            {allTags.map((entry) => <option key={entry} value={entry}>#{entry}</option>)}
                                                      </select>
                                                )}
                                          </div>
                                    </div>
                                    {watched.length === 0 ? (
                                          <div className="jr-empty">
                                                <h3>No watched titles yet</h3>
                                                <p>Open a movie or series, choose <strong>Add to My List → Watched</strong>, and it will appear here with a date you can edit.</p>
                                                <Link to="/library" className="jr-btn">Go to My List</Link>
                                          </div>
                                    ) : entries.length ? (
                                          <ul className="jr-entries">{entries.map((item) => <JournalEntry key={item.key} item={item} />)}</ul>
                                    ) : <p className="jr-muted">No entries match.</p>}
                                    {watched.length > 0 && <p className="jr-muted">{watched.length} watched · last on {DATE.format(new Date(watched[0].watchedAt || watched[0].updatedAt))}</p>}
                              </section>
                        </>
                  )}
            </div>
      );
}
