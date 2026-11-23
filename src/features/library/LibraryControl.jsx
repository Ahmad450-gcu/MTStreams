import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bookmark, BookmarkCheck, Check, ChevronDown, Plus, Star, Trash2 } from "lucide-react";
import useLibrary from "./useLibrary";
import { STATUSES, createCollection, keyOf, removeItem, saveItem, toggleInCollection, updateItem } from "./store";
import "./library.css";

/**
 * "My List" control for a title's details page: save, watch status, personal
 * rating, note and collections. Works entirely from local storage.
 */
export default function LibraryControl({ media, mediaType }) {
      const library = useLibrary();
      const [open, setOpen] = useState(false);
      const [newName, setNewName] = useState("");
      const [error, setError] = useState("");
      const panelRef = useRef(null);
      const buttonRef = useRef(null);
      const panelId = useId();
      const key = keyOf(mediaType, media.id);
      const item = library.items.get(key);
      const [note, setNote] = useState(item?.note || "");
      const [position, setPosition] = useState(null);

      // The details hero clips overflow, so the panel is rendered in a portal
      // and positioned against the button (below it, or above if there's no room).
      useLayoutEffect(() => {
            if (!open) return undefined;
            const place = () => {
                  const rect = buttonRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  const width = Math.min(360, window.innerWidth - 24);
                  const left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12);
                  const below = window.innerHeight - rect.bottom - 12;
                  const above = rect.top - 12;
                  const placeBelow = below >= 320 || below >= above;
                  setPosition({ left, width, maxHeight: Math.max(220, Math.min(560, placeBelow ? below - 8 : above - 8)), ...(placeBelow ? { top: rect.bottom + 8 } : { bottom: window.innerHeight - rect.top + 8 }) });
            };
            place();
            const close = () => setOpen(false);
            window.addEventListener("resize", place);
            window.addEventListener("wheel", close, { passive: true });
            const onTouch = (event) => {
                  if (!panelRef.current?.contains(event.target)) close();
            };
            window.addEventListener("touchmove", onTouch, { passive: true });
            return () => {
                  window.removeEventListener("resize", place);
                  window.removeEventListener("wheel", close);
                  window.removeEventListener("touchmove", onTouch);
            };
      }, [open]);

      useEffect(() => setNote(item?.note || ""), [item?.note]);

      useEffect(() => {
            if (!open) return undefined;
            const onPointer = (event) => {
                  if (!panelRef.current?.contains(event.target) && !buttonRef.current?.contains(event.target)) setOpen(false);
            };
            const onKey = (event) => {
                  if (event.key === "Escape") {
                        setOpen(false);
                        buttonRef.current?.focus();
                  }
            };
            document.addEventListener("pointerdown", onPointer);
            document.addEventListener("keydown", onKey);
            return () => {
                  document.removeEventListener("pointerdown", onPointer);
                  document.removeEventListener("keydown", onKey);
            };
      }, [open]);

      const run = (promise) => promise.catch((err) => setError(err?.message || "Couldn't save that change."));
      const setStatus = (status) => run(item ? updateItem(key, { status }) : saveItem(media, mediaType, { status }));
      const setRating = (rating) => run(item ? updateItem(key, { rating: item.rating === rating ? null : rating }) : saveItem(media, mediaType, { rating }));
      const saveNote = () => {
            if (item && note !== item.note) run(updateItem(key, { note }));
            else if (!item && note.trim()) run(saveItem(media, mediaType, { note }));
      };
      const addCollection = async (event) => {
            event.preventDefault();
            setError("");
            try {
                  const collection = await createCollection(newName);
                  await toggleInCollection(collection.id, media, mediaType);
                  setNewName("");
            } catch (err) {
                  setError(err?.message || "Couldn't create that collection.");
            }
      };

      const statusLabel = item ? STATUSES.find((status) => status.key === item.status)?.label : null;

      return (
            <div className="lib-control">
                  <button
                        ref={buttonRef}
                        type="button"
                        className={`lib-control__button ${item ? "is-saved" : ""}`}
                        aria-expanded={open}
                        aria-controls={panelId}
                        onClick={() => {
                              if (!item && !open) run(saveItem(media, mediaType));
                              setOpen((value) => !value);
                        }}
                  >
                        {item ? <BookmarkCheck size={18} aria-hidden="true" /> : <Bookmark size={18} aria-hidden="true" />}
                        <span>{item ? statusLabel : "Add to My List"}</span>
                        {item?.rating ? <span className="lib-control__rating"><Star size={12} fill="currentColor" aria-hidden="true" /> {item.rating}</span> : null}
                        <ChevronDown size={16} aria-hidden="true" className="lib-control__chevron" />
                  </button>

                  {open && position && createPortal(
                        <div ref={panelRef} id={panelId} className="lib-panel" role="dialog" aria-label="My List options" style={position} onWheel={(event) => event.stopPropagation()} data-lenis-prevent>
                              {!library.persistent && library.ready && <p className="lib-panel__warn">Storage isn’t available in this window, so changes last only until you close it.</p>}
                              <fieldset className="lib-panel__group">
                                    <legend>Status</legend>
                                    <div className="lib-segment">
                                          {STATUSES.map((status) => (
                                                <button key={status.key} type="button" aria-pressed={item?.status === status.key} className={item?.status === status.key ? "is-on" : ""} onClick={() => setStatus(status.key)}>
                                                      {item?.status === status.key && <Check size={13} aria-hidden="true" />} {status.label}
                                                </button>
                                          ))}
                                    </div>
                              </fieldset>

                              <fieldset className="lib-panel__group">
                                    <legend>Your rating {item?.rating ? <span className="lib-panel__hint">{item.rating}/10 · tap again to clear</span> : null}</legend>
                                    <div className="lib-stars" role="radiogroup" aria-label="Your rating out of 10">
                                          {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
                                                <button key={value} type="button" role="radio" aria-checked={item?.rating === value} aria-label={`${value} out of 10`} className={item?.rating >= value ? "is-on" : ""} onClick={() => setRating(value)}>
                                                      <Star size={16} fill="currentColor" aria-hidden="true" />
                                                </button>
                                          ))}
                                    </div>
                              </fieldset>

                              <fieldset className="lib-panel__group">
                                    <legend>Collections</legend>
                                    {library.collections.length === 0 && <p className="lib-panel__hint">No collections yet. Create one below.</p>}
                                    <div className="lib-checklist">
                                          {library.collections.map((collection) => {
                                                const inside = collection.keys.includes(key);
                                                return (
                                                      <button key={collection.id} type="button" aria-pressed={inside} className={inside ? "is-on" : ""} onClick={() => run(toggleInCollection(collection.id, media, mediaType))}>
                                                            <span className="lib-checklist__box">{inside && <Check size={12} aria-hidden="true" />}</span>
                                                            {collection.name}
                                                      </button>
                                                );
                                          })}
                                    </div>
                                    <form className="lib-inline-form" onSubmit={addCollection}>
                                          <input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="New collection" maxLength={60} aria-label="New collection name" />
                                          <button type="submit" disabled={!newName.trim()} aria-label="Create collection"><Plus size={16} aria-hidden="true" /></button>
                                    </form>
                              </fieldset>

                              <fieldset className="lib-panel__group">
                                    <legend>Note</legend>
                                    <textarea value={note} onChange={(event) => setNote(event.target.value)} onBlur={saveNote} maxLength={2000} rows={2} placeholder="Add a private note" aria-label="Personal note" />
                              </fieldset>

                              {error && <p className="lib-panel__error" role="alert">{error}</p>}

                              {item && (
                                    <button type="button" className="lib-panel__remove" onClick={() => { run(removeItem(key)); setOpen(false); }}>
                                          <Trash2 size={15} aria-hidden="true" /> Remove from My List
                                    </button>
                              )}
                        </div>,
                        document.body
                  )}
            </div>
      );
}
