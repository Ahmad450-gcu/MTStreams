import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Clock, ListPlus, Search, Star } from "lucide-react";
import { describeError, tmdbGet } from "../../experiences/shared/engine/tmdb";
import useLibrary from "../library/useLibrary";
import { keyOf, saveItem, updateItem } from "../library/store";
import { FEATURED_FRANCHISES } from "./franchises";
import "./franchise.css";

const img = (path, size) => (path ? `https://image.tmdb.org/t/p/${size}${path}` : "/noImage.jpg");
const today = () => new Date().toISOString().slice(0, 10);

function FranchiseIndex() {
      const [query, setQuery] = useState("");
      useEffect(() => {
            document.title = "Franchises | MTStreams";
      }, []);
      const list = FEATURED_FRANCHISES.filter((entry) => entry.name.toLowerCase().includes(query.trim().toLowerCase()));
      return (
            <div className="catalog-page frn-page overflow-x-hidden w-full min-h-dvh pb-28 [background-image:var(--bg-gradient)]">
                  <header className="catalog-page__header">
                        <span className="catalog-page__eyebrow">CONNECTED STORIES</span>
                        <h1>Franchises</h1>
                        <p>Explore film series in release order and track how much of each you’ve seen.</p>
                  </header>
                  <label className="frn-search">
                        <Search size={17} aria-hidden="true" />
                        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter franchises" aria-label="Filter franchises" />
                  </label>
                  {list.length ? (
                        <div className="frn-grid">
                              {list.map((entry) => (
                                    <Link key={entry.id} to={`/franchise/${entry.id}`} className="frn-tile">
                                          <img src={img(entry.poster, "w342")} alt="" loading="lazy" decoding="async" />
                                          <span>{entry.name.replace(/ Collection$/, "")}</span>
                                    </Link>
                              ))}
                        </div>
                  ) : (
                        <p className="frn-empty">No featured franchise matches “{query}”. Any movie that belongs to a series also links to it from its details page.</p>
                  )}
            </div>
      );
}

function FranchiseDetail({ id }) {
      const navigate = useNavigate();
      const library = useLibrary();
      const [state, setState] = useState({ status: "loading", data: null, error: "" });
      const [adding, setAdding] = useState(false);
      const [flash, setFlash] = useState("");
      const [attempt, setAttempt] = useState(0);

      useEffect(() => {
            let alive = true;
            setState({ status: "loading", data: null, error: "" });
            tmdbGet(`collection/${id}`, {}, { priority: true })
                  .then((data) => alive && setState({ status: "ready", data, error: "" }))
                  .catch((error) => alive && setState({ status: "error", data: null, error: describeError(error) }));
            return () => {
                  alive = false;
            };
      }, [id, attempt]);

      const data = state.data;
      useEffect(() => {
            if (data?.name) document.title = `${data.name} | MTStreams`;
      }, [data?.name]);

      // Release order only: TMDB publishes no official in-story chronology.
      const parts = useMemo(() => [...(data?.parts || [])]
            .filter((part) => part.media_type !== "tv")
            .sort((a, b) => (a.release_date || "9999").localeCompare(b.release_date || "9999")), [data]);
      const released = parts.filter((part) => part.release_date && part.release_date <= today());
      const watched = released.filter((part) => library.items.get(keyOf("movie", part.id))?.status === "watched");
      const missing = parts.filter((part) => !library.items.has(keyOf("movie", part.id)));
      const progress = released.length ? Math.round((watched.length / released.length) * 100) : 0;

      const addAll = async () => {
            setAdding(true);
            try {
                  for (const part of missing) await saveItem(part, "movie", { status: "want" });
                  setFlash(`Added ${missing.length} film${missing.length === 1 ? "" : "s"} to My List.`);
            } catch {
                  setFlash("Some films couldn’t be saved.");
            } finally {
                  setAdding(false);
            }
      };
      const toggleWatched = (part) => {
            const item = library.items.get(keyOf("movie", part.id));
            if (item) updateItem(item.key, { status: item.status === "watched" ? "want" : "watched" });
            else saveItem(part, "movie", { status: "watched" });
      };

      if (state.status === "loading") return <div className="frn-page min-h-dvh"><div className="frn-hero frn-hero--skeleton" /></div>;
      if (state.status === "error") {
            return (
                  <div className="frn-page frn-page--pad min-h-dvh">
                        <div className="frn-error" role="alert"><span>{state.error}</span><button type="button" onClick={() => setAttempt((value) => value + 1)}>Try again</button></div>
                  </div>
            );
      }

      return (
            <div className="frn-page overflow-x-hidden w-full min-h-dvh pb-28">
                  <section className="frn-hero">
                        <img src={img(data.backdrop_path, "w1280")} alt="" className="frn-hero__img" />
                        <div className="frn-hero__shade" />
                        <div className="frn-hero__content">
                              <button type="button" className="frn-back" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/franchises"))}><ArrowLeft size={16} /> Back</button>
                              <span className="catalog-page__eyebrow">FRANCHISE</span>
                              <h1>{data.name}</h1>
                              {data.overview && <p className="frn-hero__overview">{data.overview}</p>}
                              <div className="frn-stats">
                                    <span><strong>{parts.length}</strong> film{parts.length === 1 ? "" : "s"}</span>
                                    {parts.length > released.length && <span><strong>{parts.length - released.length}</strong> upcoming</span>}
                                    <span><strong>{watched.length}/{released.length}</strong> watched</span>
                              </div>
                              <div className="frn-progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Franchise progress"><span style={{ width: `${progress}%` }} /></div>
                              <div className="frn-actions">
                                    <button type="button" className="frn-btn frn-btn--primary" onClick={addAll} disabled={adding || !missing.length}>
                                          <ListPlus size={17} /> {missing.length ? `Add ${missing.length === parts.length ? "all" : `${missing.length} remaining`} to My List` : "All in My List"}
                                    </button>
                                    <Link to="/franchises" className="frn-btn">All franchises</Link>
                              </div>
                              {flash && <p className="frn-flash" role="status">{flash}</p>}
                        </div>
                  </section>

                  <section className="frn-list" aria-label="Films in release order">
                        <p className="frn-note">Shown in release order. TMDB doesn’t publish an official story (chronological) order, so none is shown.</p>
                        <ol>
                              {parts.map((part, index) => {
                                    const item = library.items.get(keyOf("movie", part.id));
                                    const upcoming = !part.release_date || part.release_date > today();
                                    return (
                                          <li key={part.id} className={`frn-part ${item?.status === "watched" ? "is-watched" : ""}`}>
                                                <span className="frn-part__num">{index + 1}</span>
                                                <Link to={`/movie/details/${part.id}`} className="frn-part__poster"><img src={img(part.poster_path, "w185")} alt="" loading="lazy" decoding="async" /></Link>
                                                <div className="frn-part__info">
                                                      <Link to={`/movie/details/${part.id}`}><h3>{part.title}</h3></Link>
                                                      <p>
                                                            {upcoming ? <span className="frn-tag"><Clock size={12} /> {part.release_date ? `Coming ${part.release_date}` : "Date to be announced"}</span> : part.release_date.slice(0, 4)}
                                                            {part.vote_average > 0 && !upcoming && <span className="frn-rating"><Star size={12} fill="currentColor" /> {part.vote_average.toFixed(1)}</span>}
                                                            {item && item.status !== "watched" && <span className="frn-tag frn-tag--saved">In My List</span>}
                                                      </p>
                                                      {part.overview && <p className="frn-part__overview">{part.overview}</p>}
                                                </div>
                                                {!upcoming && (
                                                      <button type="button" className={`frn-watch ${item?.status === "watched" ? "is-on" : ""}`} onClick={() => toggleWatched(part)} aria-pressed={item?.status === "watched"}>
                                                            <Check size={15} /> {item?.status === "watched" ? "Watched" : "Mark watched"}
                                                      </button>
                                                )}
                                          </li>
                                    );
                              })}
                        </ol>
                  </section>
            </div>
      );
}

export default function FranchiseExplorer() {
      const { id } = useParams();
      return id && /^\d+$/.test(id) ? <FranchiseDetail id={id} /> : <FranchiseIndex />;
}
