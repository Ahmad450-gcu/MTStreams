import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Columns3, Dices, Gem, Library, RotateCcw, SlidersHorizontal, Sparkles, Star, X } from "lucide-react";
import Card from "../../Components/ui/Card";
import { describeError, tmdbGet } from "../../experiences/shared/engine/tmdb";
import useLibrary from "../library/useLibrary";
import { saveItem } from "../library/store";
import { DEFAULT_FILTERS, GENRES, HIDDEN_GEMS, LANGUAGES, MOODS, SORTS, toDiscoverParams } from "./discoverConfig";
import "./discover.css";

const LIST_KEYS = ["genres", "without"];
const thisYear = new Date().getFullYear();
const today = () => new Date().toISOString().slice(0, 10);

/* ------------------------------------------------ URL <-> filter state */
function readFilters(params) {
      const filters = { ...DEFAULT_FILTERS };
      Object.keys(DEFAULT_FILTERS).forEach((key) => {
            const value = params.get(key);
            if (value == null) return;
            filters[key] = LIST_KEYS.includes(key) ? value.split(",").map(Number).filter(Boolean) : value;
      });
      if (filters.type !== "tv") filters.type = "movie";
      if (!SORTS[filters.type].some(([key]) => key === filters.sort)) filters.sort = "popularity.desc";
      return filters;
}
function writeFilters(filters) {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
            const text = Array.isArray(value) ? value.join(",") : String(value ?? "");
            if (text !== String(Array.isArray(DEFAULT_FILTERS[key]) ? DEFAULT_FILTERS[key].join(",") : DEFAULT_FILTERS[key])) params.set(key, text);
      });
      return params;
}

/** Library-derived taste: top genres from what you've rated or watched (local only). */
function useTaste(items, type) {
      return useMemo(() => {
            const weights = new Map();
            items.forEach((item) => {
                  if (item.media_type !== type || item.status === "dismissed") return;
                  const weight = (item.rating ? item.rating / 5 : 1) + (item.status === "watched" ? 0.5 : 0);
                  (item.genre_ids || []).forEach((id) => weights.set(id, (weights.get(id) || 0) + weight));
            });
            return [...weights.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => id);
      }, [items, type]);
}

/* ------------------------------------------------------- person picker */
function PersonPicker({ label, value, name, onPick, disabled }) {
      const [text, setText] = useState(name || "");
      const [results, setResults] = useState([]);
      const [open, setOpen] = useState(false);
      const [active, setActive] = useState(0);
      const latest = useRef(0);
      useEffect(() => setText(name || ""), [name]);

      useEffect(() => {
            const query = text.trim();
            if (!open || query.length < 2 || (value && query === name)) {
                  setResults([]);
                  return undefined;
            }
            // Debounced: one request after typing pauses, never one per keystroke.
            const ticket = ++latest.current;
            const timer = setTimeout(() => {
                  tmdbGet("search/person", { query, include_adult: "false" })
                        .then((data) => {
                              if (ticket === latest.current) setResults((data?.results || []).slice(0, 6));
                        })
                        .catch(() => ticket === latest.current && setResults([]));
            }, 350);
            return () => clearTimeout(timer);
      }, [text, open, value, name]);

      const choose = (person) => {
            onPick(person ? String(person.id) : "", person ? person.name : "");
            setText(person ? person.name : "");
            setOpen(false);
      };

      return (
            <label className="dsc-field dsc-person">
                  <span>{label}</span>
                  <div className="dsc-person__box">
                        <input
                              value={text}
                              disabled={disabled}
                              placeholder={disabled ? "Movies only" : "Type a name"}
                              onChange={(event) => { setText(event.target.value); setOpen(true); setActive(0); if (value) onPick("", ""); }}
                              onFocus={() => setOpen(true)}
                              onBlur={() => setTimeout(() => setOpen(false), 150)}
                              onKeyDown={(event) => {
                                    if (!results.length) return;
                                    if (event.key === "ArrowDown") { event.preventDefault(); setActive((index) => (index + 1) % results.length); }
                                    if (event.key === "ArrowUp") { event.preventDefault(); setActive((index) => (index - 1 + results.length) % results.length); }
                                    if (event.key === "Enter") { event.preventDefault(); choose(results[active]); }
                                    if (event.key === "Escape") setOpen(false);
                              }}
                              role="combobox"
                              aria-expanded={open && results.length > 0}
                              aria-autocomplete="list"
                        />
                        {value && <button type="button" onClick={() => choose(null)} aria-label={`Clear ${label}`}><X size={14} /></button>}
                  </div>
                  {open && results.length > 0 && (
                        <ul className="dsc-person__list" role="listbox">
                              {results.map((person, index) => (
                                    <li key={person.id} role="option" aria-selected={index === active}>
                                          <button type="button" className={index === active ? "is-active" : ""} onMouseDown={(event) => event.preventDefault()} onClick={() => choose(person)}>
                                                {person.profile_path ? <img src={`https://image.tmdb.org/t/p/w45${person.profile_path}`} alt="" loading="lazy" /> : <span className="dsc-person__blank" />}
                                                <span>{person.name}<small>{person.known_for_department}</small></span>
                                          </button>
                                    </li>
                              ))}
                        </ul>
                  )}
            </label>
      );
}

/* --------------------------------------------------------- surprise me */
function SurpriseReveal({ pick, reel, onClose, onAgain, spinning }) {
      const navigate = useNavigate();
      const [saved, setSaved] = useState(false);
      useEffect(() => setSaved(false), [pick?.id]);
      useEffect(() => {
            const onKey = (event) => event.key === "Escape" && onClose();
            window.addEventListener("keydown", onKey);
            return () => window.removeEventListener("keydown", onKey);
      }, [onClose]);
      const type = pick?.media_type;
      const title = pick ? pick.title || pick.name : "";
      return (
            <div className="dsc-reveal" role="dialog" aria-modal="true" aria-label="Surprise pick" onClick={onClose}>
                  <div className="dsc-reveal__card" onClick={(event) => event.stopPropagation()}>
                        <button type="button" className="dsc-reveal__close" onClick={onClose} aria-label="Close"><X size={18} /></button>
                        {spinning || !pick ? (
                              <div className="dsc-reel" aria-live="polite">
                                    <div className="dsc-reel__strip">
                                          {reel.concat(reel).map((item, index) => (
                                                <img key={`${item.id}-${index}`} src={item.poster_path ? `https://image.tmdb.org/t/p/w185${item.poster_path}` : "/noImage.jpg"} alt="" />
                                          ))}
                                    </div>
                                    <p>Picking something for you…</p>
                              </div>
                        ) : (
                              <div className="dsc-reveal__body">
                                    <img className="dsc-reveal__poster" src={pick.poster_path ? `https://image.tmdb.org/t/p/w342${pick.poster_path}` : "/noImage.jpg"} alt="" />
                                    <div className="dsc-reveal__info">
                                          <span className="dsc-reveal__eyebrow">Tonight’s pick</span>
                                          <h2>{title}</h2>
                                          <p className="dsc-reveal__meta">
                                                {(pick.release_date || pick.first_air_date || "").slice(0, 4)} · {type === "tv" ? "Series" : "Movie"}
                                                {pick.vote_average > 0 && <> · <Star size={13} fill="currentColor" /> {pick.vote_average.toFixed(1)}</>}
                                          </p>
                                          <p className="dsc-reveal__overview">{pick.overview || "No synopsis available."}</p>
                                          <div className="dsc-reveal__actions">
                                                <button type="button" className="dsc-btn dsc-btn--primary" onClick={() => navigate(`/${type}/details/${pick.id}`)}>View details</button>
                                                <button type="button" className="dsc-btn" disabled={saved} onClick={() => saveItem(pick, type).then(() => setSaved(true))}>{saved ? "Saved" : "Add to My List"}</button>
                                                <button type="button" className="dsc-btn" onClick={onAgain}><Dices size={16} /> Spin again</button>
                                          </div>
                                    </div>
                              </div>
                        )}
                  </div>
            </div>
      );
}

/* --------------------------------------------------------------- page */
export default function DiscoverPage() {
      const [searchParams, setSearchParams] = useSearchParams();
      const filters = useMemo(() => readFilters(searchParams), [searchParams]);
      const library = useLibrary();
      const libraryItems = useMemo(() => [...library.items.values()], [library.items]);
      const taste = useTaste(libraryItems, filters.type);
      const [showFilters, setShowFilters] = useState(false);
      const [state, setState] = useState({ status: "idle", results: [], page: 0, totalPages: 0, totalResults: 0, error: "" });
      const [surprise, setSurprise] = useState(null);
      const ticket = useRef(0);
      const recentPicks = useRef([]);

      useEffect(() => {
            document.title = "Discover | MTStreams";
      }, []);

      const update = useCallback((patch, { replace = false } = {}) => {
            setSearchParams(writeFilters({ ...filters, ...patch }), { replace });
      }, [filters, setSearchParams]);

      const params = useMemo(() => {
            const next = toDiscoverParams(filters);
            const dateKey = filters.type === "tv" ? "first_air_date" : "primary_release_date";
            // "Newest" should mean released, not announced for years ahead.
            if (next.sort_by.endsWith("date.desc") && !next[`${dateKey}.lte`]) next[`${dateKey}.lte`] = today();
            return next;
      }, [filters]);
      const path = `discover/${filters.type}`;

      const hidden = useMemo(() => {
            if (filters.hideSeen !== "1") return new Set();
            return new Set(libraryItems.filter((item) => item.status === "watched" || item.status === "dismissed").map((item) => item.key));
      }, [libraryItems, filters.hideSeen]);

      const load = useCallback((page) => {
            const mine = ++ticket.current;
            setState((current) => ({ ...current, status: page === 1 ? "loading" : "more", error: "", ...(page === 1 ? { results: [] } : {}) }));
            tmdbGet(path, { ...params, page })
                  .then((data) => {
                        // A newer filter change wins; stale responses are ignored.
                        if (mine !== ticket.current) return;
                        const results = (data?.results || []).filter((item) => item.poster_path).map((item) => ({ ...item, media_type: filters.type }));
                        setState((current) => {
                              const seen = new Set(page === 1 ? [] : current.results.map((item) => item.id));
                              return {
                                    status: "ready",
                                    results: [...(page === 1 ? [] : current.results), ...results.filter((item) => !seen.has(item.id))],
                                    page,
                                    totalPages: Math.min(500, data?.total_pages || 0),
                                    totalResults: data?.total_results || 0,
                                    error: "",
                              };
                        });
                  })
                  .catch((error) => mine === ticket.current && setState((current) => ({ ...current, status: "error", error: describeError(error) })));
      }, [path, params, filters.type]);

      useEffect(() => {
            load(1);
      }, [load]);

      const visible = state.results.filter((item) => !hidden.has(`${filters.type}:${item.id}`));

      const applyMood = (mood) => {
            if (filters.mood === mood.key) {
                  update({ mood: "", genres: [], without: [], rating: "" });
                  return;
            }
            const map = mood[filters.type];
            update({ mood: mood.key, genres: map.with, without: map.without, match: "any", rating: mood.minRating ? String(mood.minRating) : filters.rating });
      };

      const applyGems = () => update({
            mood: "",
            rating: String(HIDDEN_GEMS.minRating),
            votes: String(HIDDEN_GEMS.minVotes),
            maxVotes: String(HIDDEN_GEMS.maxVotes),
            sort: HIDDEN_GEMS.sort,
            ...(taste.length && !filters.genres.length ? { genres: taste, match: "any" } : {}),
      });
      const gemsOn = filters.maxVotes === String(HIDDEN_GEMS.maxVotes) && filters.rating === String(HIDDEN_GEMS.minRating);

      const spin = async () => {
            setSurprise({ spinning: true, pick: null, reel: visible.slice(0, 12) });
            const started = Date.now();
            try {
                  const first = await tmdbGet(path, { ...params, page: 1 });
                  const pages = Math.max(1, Math.min(first?.total_pages || 1, 20));
                  let pick = null;
                  for (let attempt = 0; attempt < 3 && !pick; attempt += 1) {
                        const page = attempt === 0 && pages > 1 ? 1 + Math.floor(Math.random() * pages) : Math.max(1, Math.ceil(Math.random() * pages));
                        const data = page === 1 ? first : await tmdbGet(path, { ...params, page });
                        const pool = (data?.results || []).filter((item) => item.poster_path && !hidden.has(`${filters.type}:${item.id}`) && !recentPicks.current.includes(item.id));
                        if (pool.length) pick = pool[Math.floor(Math.random() * pool.length)];
                  }
                  const minimum = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 900;
                  await new Promise((resolve) => setTimeout(resolve, Math.max(0, minimum - (Date.now() - started))));
                  if (!pick) {
                        setSurprise(null);
                        setState((current) => ({ ...current, error: "Nothing new matches these filters. Try loosening them." }));
                        return;
                  }
                  recentPicks.current = [pick.id, ...recentPicks.current].slice(0, 30);
                  setSurprise({ spinning: false, pick: { ...pick, media_type: filters.type }, reel: [] });
            } catch (error) {
                  setSurprise(null);
                  setState((current) => ({ ...current, error: describeError(error) }));
            }
      };

      const genreList = GENRES[filters.type];
      const activeMood = MOODS.find((mood) => mood.key === filters.mood);
      const toggleGenre = (id) => update({ mood: "", genres: filters.genres.includes(id) ? filters.genres.filter((genre) => genre !== id) : [...filters.genres, id] });
      const clearGems = () => update({ rating: "", votes: "", maxVotes: "", sort: "popularity.desc" });

      // Filters that are set but not visible while the panel is closed, shown
      // as small removable chips so nothing is hidden from the user.
      const applied = [];
      if (!activeMood && !gemsOn) {
            filters.genres.forEach((id) => {
                  const name = genreList.find(([genreId]) => genreId === id)?.[1];
                  if (name) applied.push({ key: `g${id}`, label: name, clear: () => toggleGenre(id) });
            });
      }
      if (filters.from || filters.to) applied.push({ key: "years", label: `${filters.from || "Any"}–${filters.to || "now"}`, clear: () => update({ from: "", to: "" }) });
      if (filters.rating && !gemsOn) applied.push({ key: "rating", label: `${filters.rating}+ rating`, clear: () => update({ rating: "" }) });
      if (filters.votes && !gemsOn) applied.push({ key: "votes", label: `${Number(filters.votes).toLocaleString()}+ votes`, clear: () => update({ votes: "" }) });
      if (filters.lang) applied.push({ key: "lang", label: LANGUAGES.find(([code]) => code === filters.lang)?.[1] || filters.lang, clear: () => update({ lang: "" }) });
      if (filters.runMin || filters.runMax) applied.push({ key: "run", label: filters.runMin && filters.runMax ? `${filters.runMin}–${filters.runMax} min` : filters.runMax ? `Under ${filters.runMax} min` : `Over ${filters.runMin} min`, clear: () => update({ runMin: "", runMax: "" }) });
      if (filters.castName) applied.push({ key: "cast", label: filters.castName, clear: () => update({ cast: "", castName: "" }) });
      if (filters.crewName) applied.push({ key: "crew", label: filters.crewName, clear: () => update({ crew: "", crewName: "" }) });
      const filterCount = applied.length + (filters.hideSeen === "1" ? 0 : 1);
      const anythingSet = filterCount > 0 || Boolean(activeMood) || gemsOn || filters.sort !== "popularity.desc";

      return (
            <div className="catalog-page dsc-page overflow-x-hidden w-full min-h-dvh pb-28 [background-image:var(--bg-gradient)]">
                  <header className="dsc-head">
                        <div className="dsc-head__copy">
                              <h1>Discover</h1>
                              <p>Pick a mood, narrow it down, or let MTStreams choose for you.</p>
                        </div>
                        <div className="dsc-head__actions">
                              <Link to="/franchises" className="dsc-quiet"><Library size={16} /> Franchises</Link>
                              <Link to="/compare" className="dsc-quiet"><Columns3 size={16} /> Compare</Link>
                              <button type="button" className="dsc-btn dsc-btn--primary" onClick={spin} disabled={surprise?.spinning}>
                                    <Sparkles size={16} /> Surprise me
                              </button>
                        </div>
                  </header>

                  <div className="dsc-bar">
                        <div className="dsc-type" role="radiogroup" aria-label="Movies or series">
                              {[["movie", "Movies"], ["tv", "Series"]].map(([key, label]) => (
                                    <button key={key} type="button" role="radio" aria-checked={filters.type === key} className={filters.type === key ? "is-on" : ""} onClick={() => {
                                          const mood = MOODS.find((entry) => entry.key === filters.mood);
                                          update({ type: key, sort: "popularity.desc", cast: "", castName: "", crew: "", crewName: "", ...(mood ? { genres: mood[key].with, without: mood[key].without } : { genres: [], without: [] }) });
                                    }}>{label}</button>
                              ))}
                        </div>
                        <section className="dsc-moods" aria-label="Moods">
                              <button type="button" className={`dsc-mood dsc-mood--gems ${gemsOn ? "is-on" : ""}`} onClick={gemsOn ? clearGems : applyGems} aria-pressed={gemsOn} title="Well rated, but not widely seen">
                                    <Gem size={15} aria-hidden="true" /> Hidden gems
                              </button>
                              {MOODS.map((mood) => (
                                    <button key={mood.key} type="button" className={`dsc-mood ${filters.mood === mood.key ? "is-on" : ""}`} aria-pressed={filters.mood === mood.key} onClick={() => applyMood(mood)}>
                                          <span aria-hidden="true">{mood.emoji}</span> {mood.label}
                                    </button>
                              ))}
                        </section>
                  </div>
                  {activeMood?.tvNote && filters.type === "tv" && <p className="dsc-note">{activeMood.tvNote}</p>}

                  <div className="dsc-toolbar">
                        <button type="button" className={`dsc-btn ${showFilters ? "is-open" : ""}`} onClick={() => setShowFilters((value) => !value)} aria-expanded={showFilters} aria-controls="dsc-filters">
                              <SlidersHorizontal size={16} /> Filters{filterCount > 0 && <b className="dsc-badge">{filterCount}</b>}
                        </button>
                        {!showFilters && applied.length > 0 && (
                              <ul className="dsc-applied" aria-label="Applied filters">
                                    {applied.map((item) => (
                                          <li key={item.key}><button type="button" onClick={item.clear} aria-label={`Remove ${item.label}`}>{item.label} <X size={13} aria-hidden="true" /></button></li>
                                    ))}
                              </ul>
                        )}
                        {anythingSet && (
                              <button type="button" className="dsc-quiet dsc-reset" onClick={() => setSearchParams(new URLSearchParams({ type: filters.type }))}>
                                    <RotateCcw size={14} /> Reset
                              </button>
                        )}
                        <label className="dsc-sort">
                              <span>Sort</span>
                              <select value={filters.sort} onChange={(event) => update({ sort: event.target.value })}>
                                    {SORTS[filters.type].map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                              </select>
                        </label>
                  </div>

                  {showFilters && (
                        <section className="dsc-filters" id="dsc-filters" aria-label="Filters">
                              <div className="dsc-field dsc-field--wide">
                                    <span>Genres <small>{filters.genres.length > 1 && (
                                          <button type="button" className="dsc-link" onClick={() => update({ match: filters.match === "all" ? "any" : "all" })}>
                                                {filters.match === "all" ? "Matching all" : "Matching any"} — switch
                                          </button>
                                    )}</small></span>
                                    <div className="dsc-chips">
                                          {genreList.map(([id, name]) => (
                                                <button key={id} type="button" aria-pressed={filters.genres.includes(id)} className={filters.genres.includes(id) ? "is-on" : filters.without.includes(id) ? "is-off" : ""} onClick={() => toggleGenre(id)}>{name}</button>
                                          ))}
                                    </div>
                                    {taste.length > 0 && (
                                          <button type="button" className="dsc-link" onClick={() => update({ mood: "", genres: taste, match: "any" })}>Use my favourite genres from My List</button>
                                    )}
                              </div>
                              <label className="dsc-field"><span>From year</span><input inputMode="numeric" maxLength={4} placeholder="1990" value={filters.from} onChange={(event) => update({ from: event.target.value.replace(/\D/g, "") }, { replace: true })} /></label>
                              <label className="dsc-field"><span>To year</span><input inputMode="numeric" maxLength={4} placeholder={String(thisYear)} value={filters.to} onChange={(event) => update({ to: event.target.value.replace(/\D/g, "") }, { replace: true })} /></label>
                              <label className="dsc-field"><span>Minimum rating</span>
                                    <select value={filters.rating} onChange={(event) => update({ rating: event.target.value })}>
                                          <option value="">Any</option>
                                          {[5, 6, 6.5, 7, 7.5, 8, 8.5].map((value) => <option key={value} value={String(value)}>{value}+</option>)}
                                    </select>
                              </label>
                              <label className="dsc-field"><span>Minimum votes</span>
                                    <select value={filters.votes} onChange={(event) => update({ votes: event.target.value })}>
                                          <option value="">Auto</option>
                                          {[50, 100, 500, 1000, 5000].map((value) => <option key={value} value={String(value)}>{value.toLocaleString()}+</option>)}
                                    </select>
                              </label>
                              <label className="dsc-field"><span>Language</span>
                                    <select value={filters.lang} onChange={(event) => update({ lang: event.target.value })}>
                                          {LANGUAGES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                                    </select>
                              </label>
                              <label className="dsc-field"><span>{filters.type === "tv" ? "Episode length" : "Runtime"}</span>
                                    <select value={`${filters.runMin}-${filters.runMax}`} onChange={(event) => { const [runMin, runMax] = event.target.value.split("-"); update({ runMin, runMax }); }}>
                                          <option value="-">Any length</option>
                                          {filters.type === "tv"
                                                ? [["", "30", "Under 30 min"], ["30", "60", "30–60 min"], ["60", "", "Over an hour"]].map(([a, b, l]) => <option key={l} value={`${a}-${b}`}>{l}</option>)
                                                : [["", "90", "Under 90 min"], ["", "120", "Under 2 hours"], ["90", "150", "90 min – 2½ h"], ["150", "", "Over 2½ hours"]].map(([a, b, l]) => <option key={l} value={`${a}-${b}`}>{l}</option>)}
                                    </select>
                              </label>
                              <PersonPicker label="Actor" value={filters.cast} name={filters.castName} disabled={filters.type === "tv"} onPick={(cast, castName) => update({ cast, castName })} />
                              <PersonPicker label="Director / crew" value={filters.crew} name={filters.crewName} disabled={filters.type === "tv"} onPick={(crew, crewName) => update({ crew, crewName })} />
                              <label className="dsc-field dsc-check">
                                    <input type="checkbox" checked={filters.hideSeen === "1"} onChange={(event) => update({ hideSeen: event.target.checked ? "1" : "0" })} />
                                    <span>Hide titles I’ve watched or marked Not Interested</span>
                              </label>
                        </section>
                  )}

                  <section className="dsc-results" aria-live="polite" aria-busy={state.status === "loading"}>
                        <p className="dsc-count">
                              {state.status === "loading" ? "Searching…" : state.status === "ready" || state.status === "more" ? `${state.totalResults.toLocaleString()} title${state.totalResults === 1 ? "" : "s"}${hidden.size && filters.hideSeen === "1" ? " · watched and dismissed titles hidden" : ""}` : ""}
                        </p>
                        {state.error && (
                              <div className="dsc-error" role="alert">
                                    <span>{state.error}</span>
                                    <button type="button" className="dsc-btn" onClick={() => load(state.results.length ? state.page + 1 : 1)}>Try again</button>
                              </div>
                        )}
                        {state.status === "loading" ? (
                              <div className="catalog-grid media-grid dsc-grid">{Array.from({ length: 10 }).map((_, index) => <span key={index} className="dsc-skeleton" />)}</div>
                        ) : visible.length ? (
                              <div className="catalog-grid media-grid dsc-grid">{visible.map((item) => <Card key={`${item.media_type}-${item.id}`} eachMovie={item} type={item.media_type} />)}</div>
                        ) : state.status === "ready" ? (
                              <div className="dsc-empty">
                                    <h3>No titles match all of these filters</h3>
                                    <p>Try removing a filter, widening the years or lowering the minimum rating.</p>
                              </div>
                        ) : null}
                        {state.status !== "loading" && state.page > 0 && state.page < state.totalPages && (
                              <button type="button" className="dsc-btn dsc-more" onClick={() => load(state.page + 1)} disabled={state.status === "more"}>
                                    {state.status === "more" ? "Loading…" : "Load more"}
                              </button>
                        )}
                        <p className="dsc-credit">Data from <Link to="/privacy">TMDB</Link>. MTStreams uses the TMDB API but is not endorsed or certified by TMDB.</p>
                  </section>

                  {surprise && <SurpriseReveal {...surprise} onClose={() => setSurprise(null)} onAgain={spin} />}
            </div>
      );
}
