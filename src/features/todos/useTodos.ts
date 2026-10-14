import { useEffect, useState } from "react";
import {
  completeTodo,
  createLogEntry,
  reopenTodo,
  toISODate,
  type LogEntry,
  type Todo,
} from "./domain";
import { createLocalStore } from "./localStore";

export type TodoFields = Pick<Todo, "title" | "dueDate" | "recurrence">;

const todoStore = createLocalStore<Todo>("todoz:todos");
const logStore = createLocalStore<LogEntry>("todoz:log");

function update(id: string, fn: (t: Todo) => Todo) {
  todoStore.set((prev) => prev.map((t) => (t.id === id ? fn(t) : t)));
}

function complete(id: string) {
  const todo = todoStore.get().find((t) => t.id === id);
  if (!todo || todo.completedAt) return;
  const now = new Date();
  const completed = completeTodo(todo, now);
  update(id, () => completed);
  logStore.set((prev) => [...prev, createLogEntry(todo, now)]);
}

const actions = {
  add: (fields: TodoFields) =>
    todoStore.set((prev) => [
      ...prev,
      { ...fields, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
    ]),
  edit: (id: string, fields: TodoFields) => update(id, (t) => ({ ...t, ...fields })),
  complete,
  reopen: (id: string) => update(id, reopenTodo),
  remove: (id: string) => todoStore.set((prev) => prev.filter((t) => t.id !== id)),
  clearDone: () => todoStore.set((prev) => prev.filter((t) => !t.completedAt)),
};

export function useTodos() {
  const todos = todoStore.use();
  return { todos: todos ?? [], loaded: todos !== undefined, ...actions };
}

export function useTodo(id: string) {
  const { todos, loaded, ...rest } = useTodos();
  return { todo: todos.find((t) => t.id === id), loaded, ...rest };
}

/** All completions, newest first. */
export function useLog() {
  const log = logStore.use();
  return { log: log ? [...log].reverse() : [], loaded: log !== undefined };
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
