import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, Search, Star, Trophy, X } from "lucide-react";
import { describeError, tmdbGet } from "../../experiences/shared/engine/tmdb";
import useLibrary from "../library/useLibrary";
import "./compare.css";

const MAX = 4;
const parseItems = (value) => [...new Set((value || "").split(",").filter((entry) => /^(movie|tv):\d+$/.test(entry)))].slice(0, MAX);
const LANGUAGE = typeof Intl.DisplayNames === "function" ? new Intl.DisplayNames(undefined, { type: "language" }) : null;
const languageName = (code) => {
      try {
            return (code && LANGUAGE?.of(code)) || code?.toUpperCase() || "—";
      } catch {
            return code || "—";
      }
};

/** Details + credits for one title: two requests, de-duplicated and cached by the shared client. */
function useTitleData(key) {
      const [state, setState] = useState({ status: "loading" });
      useEffect(() => {
            let alive = true;
            const [type, id] = key.split(":");
            setState({ status: "loading" });
            Promise.all([tmdbGet(`${type}/${id}`, {}, { priority: true }), tmdbGet(`${type}/${id}/credits`, {}).catch(() => ({ cast: [], crew: [] }))])
                  .then(([detail, credits]) => alive && setState({ status: "ready", type, detail, credits }))
                  .catch((error) => alive && setState({ status: "error", error: describeError(error) }));
            return () => {
                  alive = false;
            };
      }, [key]);
      return state;
}

function describe(state) {
      if (state.status !== "ready") return null;
      const { detail, credits, type } = state;
      const movie = type === "movie";
      const runtime = movie ? detail.runtime : detail.episode_run_time?.[0] || detail.last_episode_to_air?.runtime;
      return {
            title: detail.title || detail.name,
            poster: detail.poster_path,
            year: (detail.release_date || detail.first_air_date || "").slice(0, 4) || "—",
            type: movie ? "Movie" : "Series",
            genres: (detail.genres || []).map((genre) => genre.name).join(", ") || "—",
            runtime: runtime ? `${movie ? "" : "~"}${Math.floor(runtime / 60) ? `${Math.floor(runtime / 60)}h ` : ""}${runtime % 60}m${movie ? "" : " / episode"}` : "—",
            runtimeValue: runtime || 0,
            seasons: movie ? null : `${detail.number_of_seasons || 0} season${detail.number_of_seasons === 1 ? "" : "s"}, ${detail.number_of_episodes || 0} episodes`,
            rating: detail.vote_average || 0,
            votes: detail.vote_count || 0,
            popularity: detail.popularity || 0,
            language: languageName(detail.original_language),
            makers: movie
                  ? (credits.crew || []).filter((person) => person.job === "Director").map((person) => person.name).join(", ") || "—"
                  : (detail.created_by || []).map((person) => person.name).join(", ") || "—",
            cast: (credits.cast || []).slice(0, 4).map((person) => person.name).join(", ") || "—",
            status: detail.status || "—",
      };
}

function Column({ itemKey, onRemove, onReady }) {
      const state = useTitleData(itemKey);
      const info = describe(state);
      useEffect(() => onReady(itemKey, info), [itemKey, state.status]); // eslint-disable-line react-hooks/exhaustive-deps
      const [type, id] = itemKey.split(":");
      return (
            <div className="cmp-col__head">
                  <button type="button" className="cmp-remove" onClick={() => onRemove(itemKey)} aria-label="Remove from comparison"><X size={15} /></button>
                  {state.status === "error" ? <p className="cmp-error">{state.error}</p> : (
                        <Link to={`/${type}/details/${id}`}>
                              {info ? <img src={info.poster ? `https://image.tmdb.org/t/p/w342${info.poster}` : "/noImage.jpg"} alt="" /> : <span className="cmp-skeleton" />}
                              <strong>{info?.title || "Loading…"}</strong>
                        </Link>
                  )}
            </div>
      );
}

function Picker({ selected, onAdd }) {
      const library = useLibrary();
      const [query, setQuery] = useState("");
      const [results, setResults] = useState([]);
      const ticket = useRef(0);
      useEffect(() => {
            const term = query.trim();
            if (term.length < 2) {
                  setResults([]);
                  return undefined;
            }
            const mine = ++ticket.current;
            const timer = setTimeout(() => {
                  tmdbGet("search/multi", { query: term, include_adult: "false" })
                        .then((data) => mine === ticket.current && setResults((data?.results || []).filter((entry) => entry.media_type === "movie" || entry.media_type === "tv").slice(0, 8)))
                        .catch(() => mine === ticket.current && setResults([]));
            }, 350);
            return () => clearTimeout(timer);
      }, [query]);
      const suggestions = [...library.items.values()].filter((item) => item.status !== "dismissed" && !selected.includes(item.key)).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 10);
      const full = selected.length >= MAX;
      return (
            <div className="cmp-picker">
                  <label className="cmp-search">
                        <Search size={17} aria-hidden="true" />
                        <input value={query} disabled={full} onChange={(event) => setQuery(event.target.value)} placeholder={full ? `Up to ${MAX} titles` : "Add a movie or series to compare"} aria-label="Search titles to compare" />
                  </label>
                  {results.length > 0 && (
                        <ul className="cmp-results">
                              {results.map((entry) => {
                                    const key = `${entry.media_type}:${entry.id}`;
                                    const added = selected.includes(key);
                                    return (
                                          <li key={key}>
                                                <button type="button" disabled={added || full} onClick={() => { onAdd(key); setQuery(""); }}>
                                                      <img src={entry.poster_path ? `https://image.tmdb.org/t/p/w92${entry.poster_path}` : "/noImage.jpg"} alt="" />
                                                      <span>{entry.title || entry.name}<small>{(entry.release_date || entry.first_air_date || "").slice(0, 4)} · {entry.media_type === "tv" ? "Series" : "Movie"}</small></span>
                                                      {added ? <em>Added</em> : <Plus size={16} />}
                                                </button>
                                          </li>
                                    );
                              })}
                        </ul>
                  )}
                  {suggestions.length > 0 && !full && (
                        <div className="cmp-suggest">
                              <span>From My List</span>
                              {suggestions.map((item) => <button key={item.key} type="button" onClick={() => onAdd(item.key)}><Plus size={13} /> {item.title}</button>)}
                        </div>
                  )}
            </div>
      );
}

const ROWS = [
      ["year", "Released"], ["type", "Type"], ["genres", "Genres"], ["runtime", "Runtime"], ["seasons", "Seasons"],
      ["rating", "TMDB rating"], ["votes", "Votes"], ["popularity", "Popularity"], ["language", "Original language"],
      ["makers", "Director / creator"], ["cast", "Top cast"], ["status", "Status"],
];
const BEST = { rating: "max", votes: "max", popularity: "max" };

export default function ComparePage() {
      const [params, setParams] = useSearchParams();
      const selected = useMemo(() => parseItems(params.get("items")), [params]);
      const [infos, setInfos] = useState({});
      useEffect(() => {
            document.title = "Compare | MTStreams";
      }, []);
      const setSelected = (next) => setParams(next.length ? { items: next.join(",") } : {}, { replace: true });
      const ready = selected.map((key) => infos[key]).filter(Boolean);
      const best = (field) => {
            if (!BEST[field] || ready.length < 2) return null;
            return Math.max(...ready.map((info) => info[field]));
      };
      const format = (field, info) => {
            if (!info) return "…";
            if (field === "rating") return info.rating ? <><Star size={13} fill="currentColor" /> {info.rating.toFixed(1)}</> : "—";
            if (field === "votes") return info.votes.toLocaleString();
            if (field === "popularity") return Math.round(info.popularity).toLocaleString();
            return info[field] ?? "—";
      };
      const rows = ROWS.filter(([field]) => field !== "seasons" || selected.some((key) => key.startsWith("tv:")));

      return (
            <div className="catalog-page cmp-page overflow-x-hidden w-full min-h-dvh pb-28 [background-image:var(--bg-gradient)]">
                  <header className="catalog-page__header">
                        <span className="catalog-page__eyebrow">SIDE BY SIDE</span>
                        <h1>Compare</h1>
                        <p>Pick up to {MAX} movies or series to compare their details.</p>
                  </header>
                  <Picker selected={selected} onAdd={(key) => setSelected([...selected, key].slice(0, MAX))} />
                  {selected.length === 0 ? (
                        <div className="cmp-empty"><h3>Nothing to compare yet</h3><p>Search above or add titles from My List.</p></div>
                  ) : (
                        <div className="cmp-table-wrap" data-lenis-prevent>
                              <table className="cmp-table" style={{ "--cols": selected.length }}>
                                    <thead>
                                          <tr>
                                                <th scope="col" className="cmp-label" />
                                                {selected.map((key) => (
                                                      <th key={key} scope="col" className="cmp-col">
                                                            <Column itemKey={key} onRemove={(removed) => setSelected(selected.filter((entry) => entry !== removed))} onReady={(itemKey, info) => setInfos((current) => (current[itemKey] === info ? current : { ...current, [itemKey]: info }))} />
                                                      </th>
                                                ))}
                                          </tr>
                                    </thead>
                                    <tbody>
                                          {rows.map(([field, label]) => {
                                                const top = best(field);
                                                return (
                                                      <tr key={field}>
                                                            <th scope="row" className="cmp-label">{label}</th>
                                                            {selected.map((key) => {
                                                                  const info = infos[key];
                                                                  const winner = top != null && info && info[field] === top && top > 0;
                                                                  return <td key={key} className={winner ? "is-best" : ""}>{winner && <Trophy size={12} aria-label="Highest" />} {format(field, info)}</td>;
                                                            })}
                                                      </tr>
                                                );
                                          })}
                                    </tbody>
                              </table>
                        </div>
                  )}
            </div>
      );
}
