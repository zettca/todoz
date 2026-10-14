import { useSyncExternalStore } from "react";

/**
 * A list persisted in localStorage and shared by every component. Writes are persisted
 * immediately, even if the component that made the change unmounts right after
 * (e.g. save + navigate), and changes from other tabs are picked up.
 */
export function createLocalStore<T>(key: string) {
  let cache: T[] | undefined;
  const listeners = new Set<() => void>();

  function load(): T[] {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T[]) : [];
    } catch {
      return [];
    }
  }

  function getSnapshot(): T[] {
    cache ??= load();
    return cache;
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key) return;
      cache = undefined;
      listener();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }

  return {
    get: getSnapshot,
    set(fn: (prev: T[]) => T[]) {
      cache = fn(getSnapshot());
      window.localStorage.setItem(key, JSON.stringify(cache));
      listeners.forEach((l) => l());
    },
    /** `undefined` until loaded on the client (localStorage isn't available during SSR). */
    use(): T[] | undefined {
      return useSyncExternalStore(subscribe, getSnapshot, () => undefined);
    },
  };
}
