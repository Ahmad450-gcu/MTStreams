import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Check, Columns3, Copy, Download, FolderPlus, Pencil, Radar, Share2, Star, Trash2, Upload, X } from "lucide-react";
import Card from "../../Components/ui/Card";
import useLibrary from "./useLibrary";
import { toggleFollow, useFollowing } from "../people/following";
import {
      STATUSES,
      SUGGESTED_COLLECTIONS,
      clearLibrary,
      collectionSummary,
      createCollection,
      deleteCollection,
      exportLibrary,
      importLibrary,
      removeItem,
      renameCollection,
      updateItem,
} from "./store";
import "./library.css";

const SORTS = [
      { key: "added", label: "Recently added", compare: (a, b) => b.addedAt - a.addedAt },
      { key: "release", label: "Release date", compare: (a, b) => (b.release_date || "").localeCompare(a.release_date || "") },
      { key: "title", label: "Title", compare: (a, b) => a.title.localeCompare(b.title) },
      { key: "tmdb", label: "TMDB rating", compare: (a, b) => b.vote_average - a.vote_average },
      { key: "mine", label: "Your rating", compare: (a, b) => (b.rating || 0) - (a.rating || 0) },
];

const download = (data, filename) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = Object.assign(document.createElement("a"), { href: url, download: filename });
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
};
const stamp = () => new Date().toISOString().slice(0, 10);
const slug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "collection";

function LibraryCard({ item }) {
      return (
            <div className="lib-card">
                  <Card eachMovie={item} type={item.media_type} />
                  <div className="lib-card__meta">
                        <select
                              value={item.status}
                              onChange={(event) => updateItem(item.key, { status: event.target.value })}
                              aria-label={`Status for ${item.title}`}
                              className={`lib-card__status lib-status--${item.status}`}
                        >
                              {STATUSES.map((status) => <option key={status.key} value={status.key}>{status.label}</option>)}
                        </select>
                        {item.rating ? <span className="lib-card__mine" title="Your rating"><Star size={12} fill="currentColor" aria-hidden="true" /> {item.rating}</span> : null}
                        <button type="button" className="lib-card__remove" onClick={() => removeItem(item.key)} aria-label={`Remove ${item.title} from My List`}><X size={15} aria-hidden="true" /></button>
                  </div>
                  {item.note ? <p className="lib-card__note" title={item.note}>{item.note}</p> : null}
            </div>
      );
}

function CollectionRow({ collection, active, onSelect, onFlash }) {
      const [editing, setEditing] = useState(false);
      const [name, setName] = useState(collection.name);
      const [confirming, setConfirming] = useState(false);
      const save = async (event) => {
            event.preventDefault();
            try {
                  await renameCollection(collection.id, name);
                  setEditing(false);
            } catch (error) {
                  onFlash(error.message);
            }
      };
      const share = async () => {
            const text = collectionSummary(collection.id);
            try {
                  if (navigator.share) {
                        await navigator.share({ title: collection.name, text });
                        return;
                  }
            } catch (error) {
                  if (error?.name === "AbortError") return;
            }
            try {
                  await navigator.clipboard.writeText(text);
                  onFlash("Collection copied to the clipboard.");
            } catch {
                  onFlash("Couldn't copy the collection.");
            }
      };

      if (editing) {
            return (
                  <form className="lib-collection is-editing" onSubmit={save}>
                        <input value={name} onChange={(event) => setName(event.target.value)} maxLength={60} aria-label="Collection name" autoFocus />
                        <button type="submit" aria-label="Save name"><Check size={15} /></button>
                        <button type="button" onClick={() => { setEditing(false); setName(collection.name); }} aria-label="Cancel"><X size={15} /></button>
                  </form>
            );
      }
      return (
            <div className={`lib-collection ${active ? "is-active" : ""}`}>
                  <button type="button" className="lib-collection__name" onClick={onSelect} aria-pressed={active}>
                        {collection.name} <span>{collection.keys.length}</span>
                  </button>
                  {confirming ? (
                        <span className="lib-collection__confirm">
                              Delete? <button type="button" onClick={() => deleteCollection(collection.id)}>Yes</button>
                              <button type="button" onClick={() => setConfirming(false)}>No</button>
                        </span>
                  ) : (
                        <span className="lib-collection__tools">
                              <button type="button" onClick={share} aria-label={`Share ${collection.name}`} title="Share or copy"><Share2 size={14} /></button>
                              <button type="button" onClick={() => download(exportLibrary({ collectionId: collection.id }), `mtstreams-${slug(collection.name)}-${stamp()}.json`)} aria-label={`Export ${collection.name}`} title="Export as JSON"><Download size={14} /></button>
                              <button type="button" onClick={() => setEditing(true)} aria-label={`Rename ${collection.name}`} title="Rename"><Pencil size={14} /></button>
                              <button type="button" onClick={() => setConfirming(true)} aria-label={`Delete ${collection.name}`} title="Delete (titles stay in My List)"><Trash2 size={14} /></button>
                        </span>
                  )}
            </div>
      );
}

export default function LibraryPage() {
      const library = useLibrary();
      const following = useFollowing();
      const [status, setStatus] = useState("all");
      const [type, setType] = useState("all");
      const [sort, setSort] = useState("added");
      const [collectionId, setCollectionId] = useState(null);
      const [newName, setNewName] = useState("");
      const [flash, setFlash] = useState("");
      const [confirmClear, setConfirmClear] = useState(false);
      const fileRef = useRef(null);

      useEffect(() => {
            document.title = "My List | MTStreams";
      }, []);
      useEffect(() => {
            if (!flash) return undefined;
            const timer = setTimeout(() => setFlash(""), 4000);
            return () => clearTimeout(timer);
      }, [flash]);

      const items = useMemo(() => [...library.items.values()], [library.items]);
      const counts = useMemo(() => {
            const out = { all: 0 };
            items.forEach((item) => {
                  out[item.status] = (out[item.status] || 0) + 1;
                  if (item.status !== "dismissed") out.all += 1;
            });
            return out;
      }, [items]);
      const collection = library.collections.find((entry) => entry.id === collectionId) || null;

      const visible = useMemo(() => {
            const inCollection = collection ? new Set(collection.keys) : null;
            const compare = SORTS.find((entry) => entry.key === sort).compare;
            return items
                  .filter((item) => (inCollection ? inCollection.has(item.key) : true))
                  .filter((item) => (status === "all" ? item.status !== "dismissed" : item.status === status))
                  .filter((item) => type === "all" || item.media_type === type)
                  .sort(compare);
      }, [items, collection, status, type, sort]);

      const addCollection = async (name) => {
            try {
                  const created = await createCollection(name);
                  setNewName("");
                  setCollectionId(created.id);
            } catch (error) {
                  setFlash(error.message);
            }
      };

      const onImport = async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            if (file.size > 10 * 1024 * 1024) {
                  setFlash("That file is too large to be an MTStreams export.");
                  return;
            }
            try {
                  const result = await importLibrary(JSON.parse(await file.text()));
                  setFlash(`Imported ${result.added} title${result.added === 1 ? "" : "s"} and ${result.collections} collection${result.collections === 1 ? "" : "s"}${result.skipped ? ` (${result.skipped} invalid entr${result.skipped === 1 ? "y" : "ies"} skipped)` : ""}.`);
            } catch (error) {
                  setFlash(error instanceof SyntaxError ? "That file isn't valid JSON." : error.message);
            }
      };

      const unusedSuggestions = SUGGESTED_COLLECTIONS.filter((name) => !library.collections.some((entry) => entry.name.toLowerCase() === name.toLowerCase()));

      return (
            <div className="catalog-page lib-page overflow-x-hidden w-full min-h-dvh pb-28 [background-image:var(--bg-gradient)]">
                  <header className="catalog-page__header lib-page__header">
                        <span className="catalog-page__eyebrow">YOUR LIBRARY</span>
                        <h1>My List</h1>
                        <p>Everything you’ve saved, rated and organised. Stored privately on this device.</p>
                        <nav className="lib-links" aria-label="Library tools">
                              <Link to="/journal"><BookOpen size={15} /> Journal &amp; Stats</Link>
                              <Link to="/radar"><Radar size={15} /> Release Radar</Link>
                              <Link to="/compare"><Columns3 size={15} /> Compare</Link>
                        </nav>
                  </header>

                  {!library.persistent && library.ready && <p className="lib-banner">Storage isn’t available in this window (for example, some private modes). Your list will last only until you close it, so export it if you want to keep it.</p>}
                  {flash && <p className="lib-banner lib-banner--info" role="status">{flash}</p>}

                  <div className="lib-layout">
                        <aside className="lib-side" aria-label="Collections and data">
                              <h2>Collections</h2>
                              <button type="button" className={`lib-collection__name lib-collection__all ${!collection ? "is-active" : ""}`} onClick={() => setCollectionId(null)} aria-pressed={!collection}>
                                    All titles <span>{counts.all}</span>
                              </button>
                              {library.collections.map((entry) => (
                                    <CollectionRow key={entry.id} collection={entry} active={entry.id === collectionId} onSelect={() => setCollectionId(entry.id === collectionId ? null : entry.id)} onFlash={setFlash} />
                              ))}
                              <form className="lib-inline-form" onSubmit={(event) => { event.preventDefault(); addCollection(newName); }}>
                                    <input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="New collection" maxLength={60} aria-label="New collection name" />
                                    <button type="submit" disabled={!newName.trim()} aria-label="Create collection"><FolderPlus size={16} /></button>
                              </form>
                              {unusedSuggestions.length > 0 && (
                                    <div className="lib-suggest">
                                          <span>Quick add</span>
                                          {unusedSuggestions.map((name) => <button key={name} type="button" onClick={() => addCollection(name)}>+ {name}</button>)}
                                    </div>
                              )}

                              <h2>People you follow</h2>
                              {following.length ? (
                                    <ul className="lib-people">
                                          {following.map((person) => (
                                                <li key={person.id}>
                                                      <Link to={`/person/details/${person.id}`}>
                                                            {person.profile_path ? <img src={`https://image.tmdb.org/t/p/w45${person.profile_path}`} alt="" loading="lazy" /> : <span className="lib-people__blank" />}
                                                            <span>{person.name}<small>{person.known_for_department}</small></span>
                                                      </Link>
                                                      <button type="button" onClick={() => toggleFollow(person)} aria-label={`Unfollow ${person.name}`}><X size={14} /></button>
                                                </li>
                                          ))}
                                    </ul>
                              ) : (
                                    <p className="lib-side__hint">Follow actors and directors from their profile pages.</p>
                              )}

                              <h2>Your data</h2>
                              <div className="lib-data">
                                    <button type="button" onClick={() => download(exportLibrary(), `mtstreams-library-${stamp()}.json`)}><Download size={15} /> Export all</button>
                                    <button type="button" onClick={() => fileRef.current?.click()}><Upload size={15} /> Import</button>
                                    <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onImport} />
                                    {confirmClear ? (
                                          <span className="lib-collection__confirm">
                                                Delete everything on this device? <button type="button" onClick={() => { clearLibrary(); setConfirmClear(false); setCollectionId(null); setFlash("Your list was cleared."); }}>Delete</button>
                                                <button type="button" onClick={() => setConfirmClear(false)}>Cancel</button>
                                          </span>
                                    ) : (
                                          <button type="button" className="lib-data__danger" onClick={() => setConfirmClear(true)} disabled={!items.length && !library.collections.length}><Trash2 size={15} /> Clear</button>
                                    )}
                              </div>
                        </aside>

                        <section className="lib-main" aria-label={collection ? collection.name : "My List"}>
                              <div className="lib-toolbar">
                                    <div className="lib-tabs" role="tablist" aria-label="Watch status">
                                          {[{ key: "all", label: "All" }, ...STATUSES].map((entry) => (
                                                <button key={entry.key} type="button" role="tab" aria-selected={status === entry.key} className={status === entry.key ? "is-on" : ""} onClick={() => setStatus(entry.key)}>
                                                      {entry.label} <span>{counts[entry.key] || 0}</span>
                                                </button>
                                          ))}
                                    </div>
                                    <div className="lib-filters">
                                          <select value={type} onChange={(event) => setType(event.target.value)} aria-label="Media type">
                                                <option value="all">Movies &amp; series</option>
                                                <option value="movie">Movies</option>
                                                <option value="tv">Series</option>
                                          </select>
                                          <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort by">
                                                {SORTS.map((entry) => <option key={entry.key} value={entry.key}>{entry.label}</option>)}
                                          </select>
                                          {collection && (
                                                <button type="button" className="lib-copy" onClick={async () => { try { await navigator.clipboard.writeText(collectionSummary(collection.id)); setFlash("Collection copied to the clipboard."); } catch { setFlash("Couldn't copy the collection."); } }}>
                                                      <Copy size={14} /> Copy list
                                                </button>
                                          )}
                                    </div>
                              </div>

                              {!library.ready ? (
                                    <div className="catalog-grid media-grid lib-grid">{Array.from({ length: 8 }).map((_, index) => <span key={index} className="lib-skeleton" />)}</div>
                              ) : visible.length ? (
                                    <div className="catalog-grid media-grid lib-grid">{visible.map((item) => <LibraryCard key={item.key} item={item} />)}</div>
                              ) : (
                                    <div className="lib-empty">
                                          <h3>{items.length ? "Nothing matches these filters" : collection ? "This collection is empty" : "Your list is empty"}</h3>
                                          <p>{items.length ? "Try another status, type or collection." : <>Open any movie or series and use <strong>Add to My List</strong> to save it here.</>}</p>
                                          {!items.length && <Link to="/trending" className="lib-empty__cta">Browse movies</Link>}
                                    </div>
                              )}
                        </section>
                  </div>
            </div>
      );
}
