import { useEffect, useSyncExternalStore } from "react";
import { getSnapshot, loadLibrary, subscribe } from "./store";

/** Live view of the personal library. Loads it from IndexedDB on first use. */
export default function useLibrary() {
      const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
      useEffect(() => {
            loadLibrary();
      }, []);
      return state;
}
