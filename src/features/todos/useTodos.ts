import { useEffect, useState, useSyncExternalStore } from "react";
import { completeTodo, reopenTodo, toISODate, type Todo } from "./domain";

const STORAGE_KEY = "todoz:todos";

export type TodoFields = Pick<Todo, "title" | "dueDate" | "recurrence">;

function load(): Todo[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Todo[]) : [];
  } catch {
    return [];
  }
}

// Shared store so every page sees the same todos and writes are persisted immediately,
// even if the component that made the change unmounts right after (e.g. save + navigate).
let cache: Todo[] | undefined;
const listeners = new Set<() => void>();

function getSnapshot(): Todo[] {
  cache ??= load();
  return cache;
}

function getServerSnapshot(): Todo[] | undefined {
  return undefined;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    cache = undefined;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function setTodos(fn: (prev: Todo[]) => Todo[]) {
  cache = fn(getSnapshot());
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  listeners.forEach((l) => l());
}

function update(id: string, fn: (t: Todo) => Todo) {
  setTodos((prev) => prev.map((t) => (t.id === id ? fn(t) : t)));
}

const actions = {
  add: (fields: TodoFields) =>
    setTodos((prev) => [
      ...prev,
      { ...fields, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
    ]),
  edit: (id: string, fields: TodoFields) => update(id, (t) => ({ ...t, ...fields })),
  complete: (id: string) => update(id, (t) => completeTodo(t, new Date())),
  reopen: (id: string) => update(id, reopenTodo),
  remove: (id: string) => setTodos((prev) => prev.filter((t) => t.id !== id)),
  clearDone: () => setTodos((prev) => prev.filter((t) => !t.completedAt)),
};

export function useTodos() {
  const todos = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { todos: todos ?? [], loaded: todos !== undefined, ...actions };
}

export function useTodo(id: string) {
  const { todos, loaded, ...rest } = useTodos();
  return { todo: todos.find((t) => t.id === id), loaded, ...rest };
}

/** Today's date, refreshed every minute so highlights update across midnight. */
export function useToday(): string {
  const [today, setToday] = useState(() => toISODate(new Date()));
  useEffect(() => {
    const id = setInterval(() => setToday(toISODate(new Date())), 60_000);
    return () => clearInterval(id);
  }, []);
  return today;
}
