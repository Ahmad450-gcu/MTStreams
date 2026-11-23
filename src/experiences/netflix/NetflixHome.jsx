import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronDown, Grid2x2, Rows3 } from "lucide-react";
import Billboard from "./components/Billboard";
import Row, { LazyRow } from "./components/Row";
import NetflixGrid from "./components/NetflixGrid";
import { useCatalogue, useMyList, useWatchHistory } from "../shared/hooks";
import { MOVIE_GENRES, TV_GENRES } from "../shared/services";

/** A row whose content comes from the service-filtered catalogue engine. */
export function CatalogueRow({ title, spec, variant, limit, exploreTo }) {
      const [target, setTarget] = useState(variant === "top10" ? 10 : 20);
      const { items, loading, error, retry, hasMore } = useCatalogue("netflix", spec, { target });
      const shown = limit ? items.slice(0, limit) : items.slice(0, 40);
      return (
            <Row
                  title={title}
                  items={shown}
                  loading={loading && shown.length < (limit || target)}
                  error={error}
                  onRetry={retry}
                  variant={variant}
                  exploreTo={exploreTo}
                  hasMore={hasMore && !limit && items.length < 40}
                  onNeedMore={() => setTarget((current) => Math.min(40, current + 20))}
            />
      );
}

function ContinueWatchingRow() {
      const history = useWatchHistory("netflix");
      if (!history.length) return null;
      return <Row title="Continue Watching for Viewer" items={history} variant="continue" />;
}

function MyListRow() {
      const { list } = useMyList("netflix");
      if (!list.length) return null;
      return <Row title="My List" items={list} exploreTo="/my-list" />;
}

const HOME_ROWS = [
      { title: "Top 10 TV Shows Today", spec: { types: ["tv"], sort: "trending" }, variant: "top10", limit: 10 },
      { key: "mylist" },
      { title: "Popular on Notflix", spec: { types: ["movie", "tv"], sort: "popular", minVotes: 1500 } },
      { title: "New Releases", spec: { types: ["movie", "tv"], sort: "new" }, exploreTo: "/browse/new-popular" },
      { title: "Top 10 Movies Today", spec: { types: ["movie"], sort: "trending" }, variant: "top10", limit: 10 },
      { title: "Critically Acclaimed TV Shows", spec: { types: ["tv"], sort: "top" }, exploreTo: "/tv?view=grid" },
      { title: "Action & Adventure Movies", spec: { types: ["movie"], sort: "popular", genres: "28|12" }, exploreTo: "/trending?genre=28" },
      { title: "Comedies", spec: { types: ["movie"], sort: "popular", genres: "35" }, exploreTo: "/trending?genre=35" },
      { title: "Sci-Fi & Fantasy Series", spec: { types: ["tv"], sort: "popular", genres: "10765" }, exploreTo: "/tv?genre=10765" },
      { title: "Crime TV Dramas", spec: { types: ["tv"], sort: "popular", genres: "80" }, exploreTo: "/tv?genre=80" },
      { title: "Award-Winning Films", spec: { types: ["movie"], sort: "top" } },
      { title: "Anime Series", spec: { types: ["tv"], sort: "popular", genres: "16", language: "ja" } },
      { title: "Thrillers", spec: { types: ["movie"], sort: "popular", genres: "53" }, exploreTo: "/trending?genre=53" },
      { title: "Documentaries", spec: { types: ["movie", "tv"], sort: "popular", genres: "99" } },
      { title: "Korean TV Shows", spec: { types: ["tv"], sort: "popular", language: "ko" } },
      { title: "Horror Movies", spec: { types: ["movie"], sort: "popular", genres: "27" }, exploreTo: "/trending?genre=27" },
      { title: "Romantic Movies", spec: { types: ["movie"], sort: "popular", genres: "10749" } },
      { title: "Family Movie Night", spec: { types: ["movie"], sort: "popular", genres: "10751" } },
];

const typeRows = (type, genre) => {
      const g = genre ? { genres: String(genre) } : {};
      const noun = type === "tv" ? "TV Shows" : "Movies";
      const genres = type === "tv"
            ? [["10759", "Action & Adventure TV"], ["35", "TV Comedies"], ["18", "TV Dramas"], ["80", "Crime TV Shows"], ["10765", "Sci-Fi & Fantasy TV"], ["99", "Docuseries"], ["10764", "Reality TV"], ["9648", "Mystery TV"], ["10762", "Kids' TV"]]
            : [["28", "Action Movies"], ["35", "Comedy Movies"], ["18", "Dramas"], ["53", "Thriller Movies"], ["878", "Sci-Fi Movies"], ["27", "Horror Movies"], ["10749", "Romantic Movies"], ["99", "Documentary Films"], ["16", "Animated Movies"], ["10751", "Family Movies"]];
      if (genre) {
            return [
                  { title: `Top 10 ${noun} Today`, spec: { types: [type], sort: "trending", ...g }, variant: "top10", limit: 10 },
                  { title: "Popular Now", spec: { types: [type], sort: "popular", ...g } },
                  { title: "New Releases", spec: { types: [type], sort: "new", ...g } },
                  { title: "Critically Acclaimed", spec: { types: [type], sort: "top", ...g } },
                  { title: "Hidden Gems", spec: { types: [type], sort: "top", minVotes: 60, ...g } },
            ];
      }
      return [
            { title: `Top 10 ${noun} Today`, spec: { types: [type], sort: "trending" }, variant: "top10", limit: 10 },
            { title: `Popular ${noun}`, spec: { types: [type], sort: "popular" } },
            { title: "New Releases", spec: { types: [type], sort: "new" } },
            ...genres.map(([id, label]) => ({ title: label, spec: { types: [type], sort: "popular", genres: id }, exploreTo: `${type === "tv" ? "/tv" : "/trending"}?genre=${id}` })),
            { title: `Award-Winning ${noun}`, spec: { types: [type], sort: "top" } },
      ];
};

function GenreMenu({ type, genre, onChange }) {
      const [open, setOpen] = useState(false);
      const list = type === "tv" ? TV_GENRES : MOVIE_GENRES;
      const ref = useRef(null);
      useEffect(() => {
            const close = (event) => !ref.current?.contains(event.target) && setOpen(false);
            document.addEventListener("mousedown", close);
            return () => document.removeEventListener("mousedown", close);
      }, []);
      return (
            <div className="nfx-genre" ref={ref}>
                  <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
                        {genre ? list[genre] || "Genres" : "Genres"} <ChevronDown size={16} />
                  </button>
                  {open && (
                        <ul className="nfx-genre__menu">
                              {genre && <li><button type="button" onClick={() => { onChange(null); setOpen(false); }}>All Genres</button></li>}
                              {Object.entries(list).map(([id, name]) => (
                                    <li key={id}><button type="button" onClick={() => { onChange(id); setOpen(false); }}>{name}</button></li>
                              ))}
                        </ul>
                  )}
            </div>
      );
}

export function SubNav({ type }) {
      const [params, setParams] = useSearchParams();
      const genre = params.get("genre");
      const view = params.get("view") || "rows";
      const navigate = useNavigate();
      const base = type === "tv" ? "/tv" : "/trending";
      const list = type === "tv" ? TV_GENRES : MOVIE_GENRES;
      const set = (next) => {
            const merged = { genre, view, ...next };
            const search = new URLSearchParams();
            if (merged.genre) search.set("genre", merged.genre);
            if (merged.view === "grid") search.set("view", "grid");
            setParams(search);
      };
      return (
            <div className="nfx-subnav">
                  <div className="nfx-subnav__left">
                        {genre ? (
                              <>
                                    <button type="button" className="nfx-subnav__crumb" onClick={() => navigate(base)}>{type === "tv" ? "TV Shows" : "Movies"}</button>
                                    <span className="nfx-subnav__sep">›</span>
                                    <h1>{list[genre]}</h1>
                              </>
                        ) : (
                              <h1>{type === "tv" ? "TV Shows" : "Movies"}</h1>
                        )}
                        <GenreMenu type={type} genre={genre} onChange={(id) => set({ genre: id })} />
                  </div>
                  <div className="nfx-subnav__toggle" role="group" aria-label="Layout">
                        <button type="button" className={view !== "grid" ? "is-active" : ""} onClick={() => set({ view: "rows" })} aria-label="Rows view"><Rows3 size={18} /></button>
                        <button type="button" className={view === "grid" ? "is-active" : ""} onClick={() => set({ view: "grid" })} aria-label="Grid view"><Grid2x2 size={18} /></button>
                  </div>
            </div>
      );
}

export default function NetflixHome({ mode = "home" }) {
      const [params] = useSearchParams();
      const genre = mode !== "home" ? params.get("genre") : null;
      const view = mode !== "home" ? params.get("view") : null;
      const type = mode === "tv" ? "tv" : "movie";

      const billboardSpec = useMemo(() => {
            if (mode === "home") return { types: ["movie", "tv"], sort: "trending" };
            return { types: [type], sort: genre ? "popular" : "trending", ...(genre ? { genres: genre } : {}) };
      }, [mode, type, genre]);
      const billboard = useCatalogue("netflix", billboardSpec, { target: 20 });
      const rows = mode === "home" ? HOME_ROWS : typeRows(type, genre);

      useEffect(() => {
            document.title = mode === "home" ? "Home - Notflix" : `${type === "tv" ? "TV Shows" : "Movies"} - Notflix`;
      }, [mode, type]);

      if (view === "grid") {
            return (
                  <div className="nfx-page nfx-page--grid">
                        <NetflixGrid spec={{ types: [type], sort: "popular", ...(genre ? { genres: genre } : {}) }} />
                  </div>
            );
      }

      return (
            <div className={`nfx-page nfx-page--${mode}`}>
                  <Billboard items={billboard.items} loading={billboard.loading} />
                  <div className="nfx-lolomo">
                        {mode === "home" && <ContinueWatchingRow />}
                        <Row
                              title={mode === "home" ? "Trending Now" : genre ? "Trending Now" : `Trending ${type === "tv" ? "TV Shows" : "Movies"}`}
                              items={billboard.items.slice(1, 40)}
                              loading={billboard.loading}
                              error={billboard.error}
                              onRetry={billboard.retry}
                              hasMore={billboard.hasMore && billboard.items.length < 40}
                              onNeedMore={() => billboard.loadMore(20)}
                        />
                        {rows.map((row, index) =>
                              row.key === "mylist" ? (
                                    <MyListRow key="mylist" />
                              ) : index < 2 ? (
                                    <CatalogueRow key={row.title} {...row} />
                              ) : (
                                    <LazyRow key={row.title} minHeight={row.variant === "top10" ? 300 : 200}>
                                          <CatalogueRow {...row} />
                                    </LazyRow>
                              )
                        )}
                  </div>
            </div>
      );
}
