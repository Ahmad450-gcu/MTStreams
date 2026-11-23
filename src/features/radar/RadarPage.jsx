import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, BellOff, CalendarDays, Film, RefreshCw, Tv } from "lucide-react";
import useLibrary from "../library/useLibrary";
import { MAX_SHOWS, buildRadar, notificationsEnabled, notifyToday, setNotifications, trackedTitles } from "./radar";
import "./radar.css";

const DAY = new Intl.DateTimeFormat(undefined, { weekday: "short", day: "numeric", month: "short" });
const TIME = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
const label = (date) => {
      const today = new Date().toISOString().slice(0, 10);
      const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
      if (date === today) return "Today";
      if (date === tomorrow) return "Tomorrow";
      return DAY.format(new Date(`${date}T12:00:00`));
};

function EventRow({ event }) {
      const isMovie = event.kind === "movie";
      const item = isMovie ? event.movie : event.show;
      const path = `/${isMovie ? "movie" : "tv"}/details/${item.id}`;
      return (
            <li className="rdr-event">
                  <Link to={path} className="rdr-event__poster"><img src={item.poster_path ? `https://image.tmdb.org/t/p/w92${item.poster_path}` : "/noImage.jpg"} alt="" loading="lazy" /></Link>
                  <div>
                        <Link to={path}><strong>{item.title}</strong></Link>
                        <span>
                              {isMovie ? <><Film size={12} /> Movie release</> : <><Tv size={12} /> S{event.episode.season} · E{event.episode.episode}{event.episode.name ? ` — ${event.episode.name}` : ""}</>}
                        </span>
                  </div>
            </li>
      );
}

function Timeline({ events, empty }) {
      const groups = useMemo(() => {
            const map = new Map();
            events.forEach((event) => map.set(event.date, [...(map.get(event.date) || []), event]));
            return [...map.entries()];
      }, [events]);
      if (!groups.length) return <p className="rdr-muted">{empty}</p>;
      return (
            <ol className="rdr-timeline">
                  {groups.map(([date, list]) => (
                        <li key={date} className="rdr-day">
                              <span className="rdr-day__label"><CalendarDays size={14} /> {label(date)}</span>
                              <ul>{list.map((event, index) => <EventRow key={index} event={event} />)}</ul>
                        </li>
                  ))}
            </ol>
      );
}

export default function RadarPage() {
      const library = useLibrary();
      const [state, setState] = useState({ status: "idle", radar: null, error: "" });
      const [notify, setNotify] = useState(notificationsEnabled());
      const items = useMemo(() => [...library.items.values()], [library.items]);
      const tracked = useMemo(() => trackedTitles(items), [items]);
      const trackedSignature = [...tracked.shows, ...tracked.movies].map((item) => item.key).join("|");

      useEffect(() => {
            document.title = "Release Radar | MTStreams";
      }, []);

      const check = useCallback((force = false) => {
            setState((current) => ({ ...current, status: current.radar ? "refreshing" : "loading" }));
            buildRadar(items, { force })
                  .then((radar) => {
                        setState({ status: "ready", radar, error: "" });
                        notifyToday(radar);
                  })
                  .catch(() => setState((current) => ({ ...current, status: "error", error: "Couldn’t check releases. Try again." })));
      }, [items]);

      // Opening the radar checks (using the 12-hour cache); changes to what's tracked re-check.
      useEffect(() => {
            if (library.ready) check(false);
            // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [library.ready, trackedSignature]);

      const toggleNotify = async () => {
            const next = await setNotifications(!notify);
            setNotify(next);
      };

      const radar = state.radar;
      const nothingTracked = library.ready && !tracked.shows.length && !tracked.movies.length;
      const notificationsSupported = typeof Notification !== "undefined";

      return (
            <div className="catalog-page rdr-page overflow-x-hidden w-full min-h-dvh pb-28 [background-image:var(--bg-gradient)]">
                  <header className="catalog-page__header rdr-header">
                        <div>
                              <span className="catalog-page__eyebrow">WHAT’S COMING</span>
                              <h1>Release Radar</h1>
                              <p>New episodes of the series in My List and release dates for saved movies.</p>
                        </div>
                        <div className="rdr-header__actions">
                              <button type="button" className="rdr-btn" onClick={() => check(true)} disabled={state.status === "loading" || state.status === "refreshing" || nothingTracked}>
                                    <RefreshCw size={16} className={state.status === "refreshing" ? "rdr-spin" : ""} /> Refresh
                              </button>
                              {notificationsSupported && (
                                    <button type="button" className={`rdr-btn ${notify ? "is-on" : ""}`} onClick={toggleNotify} aria-pressed={notify}>
                                          {notify ? <Bell size={16} /> : <BellOff size={16} />} {notify ? "Alerts on" : "Alerts off"}
                                    </button>
                              )}
                        </div>
                  </header>
                  <p className="rdr-note">
                        Checks run when you open this page or press Refresh{notify ? ", and when MTStreams opens (at most every 12 hours)" : ""}. Alerts can only appear while MTStreams is open — there are no background notifications.
                        {radar?.checkedAt ? ` Last checked ${TIME.format(radar.checkedAt)}.` : ""}
                  </p>

                  {nothingTracked ? (
                        <div className="rdr-empty">
                              <h3>Nothing to track yet</h3>
                              <p>Save series (any status except Not Interested) or upcoming movies with <strong>Add to My List</strong> and they’ll appear here.</p>
                              <Link to="/tv" className="rdr-btn rdr-btn--primary">Browse series</Link>
                        </div>
                  ) : state.status === "loading" || state.status === "idle" ? (
                        <div className="rdr-skeleton" />
                  ) : state.status === "error" && !radar ? (
                        <div className="rdr-error" role="alert"><span>{state.error}</span><button type="button" onClick={() => check(true)}>Try again</button></div>
                  ) : (
                        <div className="rdr-layout">
                              <section className="rdr-panel" aria-label="Upcoming">
                                    <h2>Upcoming</h2>
                                    <Timeline events={radar.upcoming} empty="No announced dates for what you’re tracking." />
                              </section>
                              <section className="rdr-panel" aria-label="Recently released">
                                    <h2>Recently released</h2>
                                    <Timeline events={radar.recent} empty="Nothing in the last two weeks." />
                              </section>
                              <section className="rdr-panel rdr-panel--wide" aria-label="Tracked series">
                                    <h2>Tracked series <span>{radar.shows.length}</span></h2>
                                    {radar.failed > 0 && <p className="rdr-muted">{radar.failed} series couldn’t be checked this time.</p>}
                                    {tracked.skippedShows > 0 && <p className="rdr-muted">Only your {MAX_SHOWS} most recently updated series are checked, to keep requests low.</p>}
                                    <ul className="rdr-shows">
                                          {radar.shows.map((show) => (
                                                <li key={show.key}>
                                                      <Link to={`/tv/details/${show.id}`}>
                                                            <img src={show.poster_path ? `https://image.tmdb.org/t/p/w154${show.poster_path}` : "/noImage.jpg"} alt="" loading="lazy" />
                                                            <strong>{show.title}</strong>
                                                            <span>{show.next?.date ? `Next: S${show.next.season}E${show.next.episode} · ${label(show.next.date)}` : show.status === "Ended" || show.status === "Canceled" ? `${show.status} — no new episodes` : "No date announced"}</span>
                                                      </Link>
                                                </li>
                                          ))}
                                    </ul>
                              </section>
                        </div>
                  )}
            </div>
      );
}
