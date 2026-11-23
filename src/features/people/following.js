// Followed actors and directors, kept in localStorage (a short list of small
// records). Shared across tabs through the storage event.
import { useSyncExternalStore } from "react";

const KEY = "mtstreams:following:v1";
const listeners = new Set();
let cache = null;

function read() {
      if (cache) return cache;
      try {
            const parsed = JSON.parse(localStorage.getItem(KEY) || "[]");
            cache = Array.isArray(parsed) ? parsed.filter((person) => Number.isInteger(person?.id)) : [];
      } catch {
            cache = [];
      }
      return cache;
}

function write(next) {
      cache = next;
      try {
            localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
            // Storage unavailable: keep the in-memory list for this session.
      }
      listeners.forEach((listener) => listener());
}

if (typeof window !== "undefined") {
      window.addEventListener("storage", (event) => {
            if (event.key !== KEY) return;
            cache = null;
            listeners.forEach((listener) => listener());
      });
}

const subscribe = (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
};

export function useFollowing() {
      return useSyncExternalStore(subscribe, read, read);
}

export function isFollowing(id) {
      return read().some((person) => person.id === Number(id));
}

export function toggleFollow(person) {
      const list = read();
      const id = Number(person.id);
      if (list.some((entry) => entry.id === id)) {
            write(list.filter((entry) => entry.id !== id));
            return false;
      }
      write([{ id, name: person.name, profile_path: person.profile_path || null, known_for_department: person.known_for_department || "", followedAt: Date.now() }, ...list].slice(0, 200));
      return true;
}
