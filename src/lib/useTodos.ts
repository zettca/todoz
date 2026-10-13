import { useCallback, useEffect, useState } from "react";
import { completeTodo, reopenTodo, toISODate, type Todo } from "./todos";

const STORAGE_KEY = "todoz:todos";

function load(): Todo[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Todo[]) : [];
  } catch {
    return [];
  }
}

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setTodos(load());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos, loaded]);

  const add = useCallback((todo: Omit<Todo, "id" | "createdAt">) => {
    setTodos((prev) => [
      ...prev,
      { ...todo, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
    ]);
  }, []);

  const update = useCallback((id: string, fn: (t: Todo) => Todo) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? fn(t) : t)));
  }, []);

  return {
    todos,
    loaded,
    add,
    complete: (id: string) => update(id, (t) => completeTodo(t, new Date())),
    reopen: (id: string) => update(id, reopenTodo),
    remove: (id: string) => setTodos((prev) => prev.filter((t) => t.id !== id)),
    clearDone: () => setTodos((prev) => prev.filter((t) => !t.completedAt)),
  };
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
