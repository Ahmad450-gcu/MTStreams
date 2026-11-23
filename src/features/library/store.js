// Personal library: watch statuses, ratings, notes and custom collections.
//
// Everything lives in this browser (IndexedDB, with an in-memory fallback when
// storage is unavailable, e.g. some private windows). Nothing is sent to the
// server and nothing here makes a TMDB request: each saved title keeps a small
// snapshot of the metadata that was already on screen when it was saved.

const DB_NAME = "mtstreams-library";
const DB_VERSION = 1;
const EXPORT_FORMAT = "mtstreams-library";
const EXPORT_VERSION = 1;

export const STATUSES = [
      { key: "want", label: "Want to Watch" },
      { key: "watching", label: "Watching" },
      { key: "watched", label: "Watched" },
      { key: "dismissed", label: "Not Interested" },
];
const STATUS_KEYS = new Set(STATUSES.map((status) => status.key));

export const SUGGESTED_COLLECTIONS = ["Must Watch", "Weekend Movies", "Favourite Movies", "Favourite Series", "Best Horror", "Watch With Friends"];

/** Stable identity: TMDB ids are only unique within a media type. */
export const keyOf = (mediaType, id) => `${mediaType}:${id}`;

const now = () => Date.now();
const newId = () => (globalThis.crypto?.randomUUID ? crypto.randomUUID() : `c${now().toString(36)}${Math.random().toString(36).slice(2, 8)}`);

/* --------------------------------------------------------------- database */
let dbPromise = null;
let persistent = true;

function openDb() {
      if (dbPromise) return dbPromise;
      dbPromise = new Promise((resolve) => {
            if (typeof indexedDB === "undefined") {
                  persistent = false;
                  resolve(null);
                  return;
            }
            let request;
            try {
                  request = indexedDB.open(DB_NAME, DB_VERSION);
            } catch {
                  persistent = false;
                  resolve(null);
                  return;
            }
            // Versioned schema. Future versions add a branch per old version so
            // existing libraries are migrated rather than recreated.
            request.onupgradeneeded = (event) => {
                  const db = request.result;
                  if (event.oldVersion < 1) {
                        const items = db.createObjectStore("items", { keyPath: "key" });
                        items.createIndex("status", "status");
                        items.createIndex("addedAt", "addedAt");
                        db.createObjectStore("collections", { keyPath: "id" });
                  }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => {
                  persistent = false;
                  resolve(null);
            };
            request.onblocked = () => {
                  persistent = false;
                  resolve(null);
            };
      });
      return dbPromise;
}

function tx(storeNames, mode, work) {
      return openDb().then((db) => {
            if (!db) return undefined;
            return new Promise((resolve, reject) => {
                  const transaction = db.transaction(storeNames, mode);
                  const result = work(transaction);
                  transaction.oncomplete = () => resolve(result);
                  transaction.onerror = () => reject(transaction.error);
                  transaction.onabort = () => reject(transaction.error || new Error("Storage transaction was aborted."));
            });
      });
}

const getAll = (store) => tx([store], "readonly", (transaction) => {
      const out = [];
      transaction.objectStore(store).openCursor().onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                  out.push(cursor.value);
                  cursor.continue();
            }
      };
      return out;
});

/* ------------------------------------------------------------ live state */
let state = { ready: false, persistent: true, items: new Map(), collections: [], error: null };
const listeners = new Set();
const emit = () => listeners.forEach((listener) => listener());
const setState = (patch) => {
      state = { ...state, ...patch };
      emit();
};

export const subscribe = (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
};
export const getSnapshot = () => state;

let loading = null;
export function loadLibrary() {
      if (loading) return loading;
      loading = Promise.all([getAll("items"), getAll("collections")])
            .then(([items = [], collections = []]) => {
                  setState({
                        ready: true,
                        persistent,
                        items: new Map(items.map((item) => [item.key, item])),
                        collections: collections.sort((a, b) => a.createdAt - b.createdAt),
                  });
            })
            .catch((error) => setState({ ready: true, persistent: false, error: error?.message || "Library storage is unavailable." }));
      return loading;
}

// Keep tabs/windows of the app in sync.
const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("mtstreams-library") : null;
if (channel) {
      channel.onmessage = () => {
            loading = null;
            loadLibrary();
      };
}
const announce = () => channel?.postMessage("changed");

function writeItems(items, deleteKeys = []) {
      return tx(["items"], "readwrite", (transaction) => {
            const store = transaction.objectStore("items");
            items.forEach((item) => store.put(item));
            deleteKeys.forEach((key) => store.delete(key));
      }).then(announce);
}
function writeCollections(collections, deleteIds = []) {
      return tx(["collections"], "readwrite", (transaction) => {
            const store = transaction.objectStore("collections");
            collections.forEach((collection) => store.put(collection));
            deleteIds.forEach((id) => store.delete(id));
      }).then(announce);
}

/* -------------------------------------------------------------- snapshot */
/** Reduce a TMDB movie/TV object to the fields the library needs offline. */
export function snapshotOf(media, mediaType) {
      const type = mediaType || media.media_type;
      return {
            id: Number(media.id),
            media_type: type,
            title: media.title || media.name || media.original_title || media.original_name || "Untitled",
            poster_path: media.poster_path || null,
            backdrop_path: media.backdrop_path || null,
            release_date: media.release_date || media.first_air_date || "",
            vote_average: Number(media.vote_average) || 0,
            genre_ids: Array.isArray(media.genre_ids) ? media.genre_ids : (media.genres || []).map((genre) => genre.id),
            original_language: media.original_language || "",
            runtime: Number(media.runtime) || Number(media.episode_run_time?.[0]) || 0,
      };
}

/* --------------------------------------------------------------- actions */
export function getItem(mediaType, id) {
      return state.items.get(keyOf(mediaType, id)) || null;
}

/** Add or update a saved title. `patch` may set status, rating, note. */
export async function saveItem(media, mediaType, patch = {}) {
      const snapshot = snapshotOf(media, mediaType);
      const key = keyOf(snapshot.media_type, snapshot.id);
      const existing = state.items.get(key);
      const next = {
            ...(existing || { status: "want", rating: null, note: "", addedAt: now() }),
            ...snapshot,
            ...sanitizePatch(patch),
            key,
            updatedAt: now(),
      };
      if (next.status === "watched" && !next.watchedAt) next.watchedAt = now();
      const items = new Map(state.items);
      items.set(key, next);
      setState({ items });
      await writeItems([next]);
      return next;
}

export async function updateItem(key, patch) {
      const existing = state.items.get(key);
      if (!existing) return null;
      const next = { ...existing, ...sanitizePatch(patch), updatedAt: now() };
      if (next.status === "watched" && !next.watchedAt) next.watchedAt = now();
      const items = new Map(state.items);
      items.set(key, next);
      setState({ items });
      await writeItems([next]);
      return next;
}

export async function removeItem(key) {
      if (!state.items.has(key)) return;
      const items = new Map(state.items);
      items.delete(key);
      const touched = state.collections.filter((collection) => collection.keys.includes(key)).map((collection) => ({ ...collection, keys: collection.keys.filter((k) => k !== key), updatedAt: now() }));
      const collections = state.collections.map((collection) => touched.find((t) => t.id === collection.id) || collection);
      setState({ items, collections });
      await writeItems([], [key]);
      if (touched.length) await writeCollections(touched);
}

function sanitizePatch(patch) {
      const out = {};
      if ("status" in patch) out.status = STATUS_KEYS.has(patch.status) ? patch.status : "want";
      if ("rating" in patch) out.rating = patch.rating == null ? null : clampRating(patch.rating);
      if ("note" in patch) out.note = String(patch.note || "").slice(0, 2000);
      if ("watchedAt" in patch) out.watchedAt = Number(patch.watchedAt) || null;
      // Journal fields.
      if ("review" in patch) out.review = String(patch.review || "").slice(0, 4000);
      if ("moments" in patch) out.moments = String(patch.moments || "").slice(0, 2000);
      if ("tags" in patch) out.tags = cleanTags(patch.tags);
      return out;
}
const cleanTags = (tags) => [...new Set((Array.isArray(tags) ? tags : String(tags || "").split(","))
      .map((tag) => String(tag).trim().replace(/\s+/g, " ").slice(0, 30))
      .filter(Boolean))].slice(0, 12);
const clampRating = (value) => {
      const number = Math.round(Number(value));
      return Number.isFinite(number) ? Math.min(10, Math.max(1, number)) : null;
};

/* ------------------------------------------------------------ collections */
const cleanName = (name) => String(name || "").trim().replace(/\s+/g, " ").slice(0, 60);

export async function createCollection(name) {
      const clean = cleanName(name);
      if (!clean) throw new Error("Give the collection a name.");
      if (state.collections.some((collection) => collection.name.toLowerCase() === clean.toLowerCase())) throw new Error("A collection with that name already exists.");
      const collection = { id: newId(), name: clean, keys: [], createdAt: now(), updatedAt: now() };
      setState({ collections: [...state.collections, collection] });
      await writeCollections([collection]);
      return collection;
}

export async function renameCollection(id, name) {
      const clean = cleanName(name);
      if (!clean) throw new Error("Give the collection a name.");
      if (state.collections.some((collection) => collection.id !== id && collection.name.toLowerCase() === clean.toLowerCase())) throw new Error("A collection with that name already exists.");
      const collection = state.collections.find((entry) => entry.id === id);
      if (!collection) return;
      const next = { ...collection, name: clean, updatedAt: now() };
      setState({ collections: state.collections.map((entry) => (entry.id === id ? next : entry)) });
      await writeCollections([next]);
}

/** Deleting a collection never deletes the titles inside it. */
export async function deleteCollection(id) {
      setState({ collections: state.collections.filter((entry) => entry.id !== id) });
      await writeCollections([], [id]);
}

/** Toggle a title in a collection, saving the title to the library first if needed. */
export async function toggleInCollection(id, media, mediaType) {
      const collection = state.collections.find((entry) => entry.id === id);
      if (!collection) return;
      const snapshot = snapshotOf(media, mediaType);
      const key = keyOf(snapshot.media_type, snapshot.id);
      if (!state.items.has(key)) await saveItem(media, mediaType);
      const keys = collection.keys.includes(key) ? collection.keys.filter((k) => k !== key) : [...collection.keys, key];
      const next = { ...collection, keys, updatedAt: now() };
      setState({ collections: state.collections.map((entry) => (entry.id === id ? next : entry)) });
      await writeCollections([next]);
}

/* -------------------------------------------------------- export / import */
export function exportLibrary({ collectionId } = {}) {
      const collections = collectionId ? state.collections.filter((collection) => collection.id === collectionId) : state.collections;
      const keys = collectionId ? new Set(collections.flatMap((collection) => collection.keys)) : null;
      const items = [...state.items.values()].filter((item) => !keys || keys.has(item.key));
      return {
            format: EXPORT_FORMAT,
            version: EXPORT_VERSION,
            exportedAt: new Date().toISOString(),
            items,
            collections: collections.map(({ name, keys: collectionKeys, createdAt }) => ({ name, keys: collectionKeys, createdAt })),
      };
}

/**
 * Validate and merge an export file. Existing titles are kept unless the
 * imported copy is newer; collections merge by name; duplicates are skipped.
 */
export async function importLibrary(data) {
      if (!data || typeof data !== "object" || data.format !== EXPORT_FORMAT) throw new Error("This file isn't an MTStreams library export.");
      if (!Number.isInteger(data.version) || data.version > EXPORT_VERSION) throw new Error("This export was made by a newer version of MTStreams.");
      if (!Array.isArray(data.items) || !Array.isArray(data.collections)) throw new Error("The export file is incomplete.");
      if (data.items.length > 20000 || data.collections.length > 500) throw new Error("The export file is too large.");

      const validItems = [];
      let skipped = 0;
      for (const raw of data.items) {
            const id = Number(raw?.id);
            const type = raw?.media_type;
            if (!Number.isInteger(id) || id <= 0 || (type !== "movie" && type !== "tv")) {
                  skipped += 1;
                  continue;
            }
            const key = keyOf(type, id);
            const item = {
                  ...snapshotOf({ ...raw, id }, type),
                  status: STATUS_KEYS.has(raw.status) ? raw.status : "want",
                  rating: raw.rating == null ? null : clampRating(raw.rating),
                  note: String(raw.note || "").slice(0, 2000),
                  addedAt: Number(raw.addedAt) || now(),
                  updatedAt: Number(raw.updatedAt) || now(),
                  watchedAt: Number(raw.watchedAt) || null,
                  review: String(raw.review || "").slice(0, 4000),
                  moments: String(raw.moments || "").slice(0, 2000),
                  tags: cleanTags(raw.tags),
                  key,
            };
            const existing = state.items.get(key);
            if (!existing || item.updatedAt > existing.updatedAt) validItems.push(item);
      }

      const items = new Map(state.items);
      validItems.forEach((item) => items.set(item.key, item));

      const collections = [...state.collections];
      const changedCollections = [];
      for (const raw of data.collections) {
            const name = cleanName(raw?.name);
            if (!name) continue;
            const keys = (Array.isArray(raw.keys) ? raw.keys : []).filter((key) => typeof key === "string" && items.has(key));
            const existing = collections.find((collection) => collection.name.toLowerCase() === name.toLowerCase());
            if (existing) {
                  const merged = { ...existing, keys: [...new Set([...existing.keys, ...keys])], updatedAt: now() };
                  collections[collections.indexOf(existing)] = merged;
                  changedCollections.push(merged);
            } else {
                  const created = { id: newId(), name, keys: [...new Set(keys)], createdAt: Number(raw.createdAt) || now(), updatedAt: now() };
                  collections.push(created);
                  changedCollections.push(created);
            }
      }

      setState({ items, collections });
      await writeItems(validItems);
      await writeCollections(changedCollections);
      return { added: validItems.length, skipped, collections: changedCollections.length };
}

/** Permanently clear the library on this device. */
export async function clearLibrary() {
      const itemKeys = [...state.items.keys()];
      const collectionIds = state.collections.map((collection) => collection.id);
      setState({ items: new Map(), collections: [] });
      await writeItems([], itemKeys);
      await writeCollections([], collectionIds);
}

/** Plain-text summary for sharing a collection (clipboard / Web Share). */
export function collectionSummary(collectionId) {
      const collection = state.collections.find((entry) => entry.id === collectionId);
      if (!collection) return "";
      const lines = collection.keys
            .map((key) => state.items.get(key))
            .filter(Boolean)
            .map((item, index) => `${index + 1}. ${item.title}${item.release_date ? ` (${item.release_date.slice(0, 4)})` : ""} — ${item.media_type === "tv" ? "Series" : "Movie"}`);
      return [`${collection.name} — my MTStreams collection`, "", ...lines].join("\n");
}
