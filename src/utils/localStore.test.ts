import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { createLocalStore } from "./localStore";

const KEY = "test:items";

function fakeWindow() {
  const data = new Map<string, string>();
  return Object.assign(new EventTarget(), {
    localStorage: {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
    },
  });
}

/** Simulates another tab writing to localStorage. */
function storageEvent(key: string) {
  return Object.assign(new Event("storage"), { key });
}

let win: ReturnType<typeof fakeWindow>;

beforeEach(() => {
  win = fakeWindow();
  vi.stubGlobal("window", win);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createLocalStore", () => {
  it("starts empty", () => {
    expect(createLocalStore(KEY).get()).toEqual([]);
  });

  it("loads existing data", () => {
    win.localStorage.setItem(KEY, JSON.stringify([1, 2]));
    expect(createLocalStore<number>(KEY).get()).toEqual([1, 2]);
  });

  it("treats corrupt data as empty", () => {
    win.localStorage.setItem(KEY, "{not json");
    expect(createLocalStore(KEY).get()).toEqual([]);
  });

  it("returns a stable reference until changed", () => {
    const store = createLocalStore<number>(KEY);
    const first = store.get();
    expect(store.get()).toBe(first);
    store.set((prev) => [...prev, 1]);
    expect(store.get()).not.toBe(first);
  });

  it("persists writes immediately", () => {
    const store = createLocalStore<number>(KEY);
    store.set((prev) => [...prev, 1]);
    store.set((prev) => [...prev, 2]);
    expect(store.get()).toEqual([1, 2]);
    expect(JSON.parse(win.localStorage.getItem(KEY)!)).toEqual([1, 2]);
  });

  it("notifies subscribers until they unsubscribe", () => {
    const store = createLocalStore<number>(KEY);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.set(() => [1]);
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    store.set(() => [2]);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("picks up changes from other tabs", () => {
    const store = createLocalStore<number>(KEY);
    const listener = vi.fn();
    store.subscribe(listener);
    expect(store.get()).toEqual([]);

    win.localStorage.setItem(KEY, JSON.stringify([42]));
    win.dispatchEvent(storageEvent(KEY));

    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.get()).toEqual([42]);
  });

  it("ignores other keys", () => {
    const store = createLocalStore<number>(KEY);
    const listener = vi.fn();
    store.subscribe(listener);
    win.dispatchEvent(storageEvent("other:key"));
    expect(listener).not.toHaveBeenCalled();
  });

  it("is undefined during server rendering", () => {
    const store = createLocalStore<number>(KEY);
    store.set(() => [1]);
    function Probe() {
      return String(store.use());
    }
    expect(renderToString(createElement(Probe))).toBe("undefined");
  });
});
