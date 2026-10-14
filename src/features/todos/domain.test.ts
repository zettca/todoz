import { describe, expect, it } from "vite-plus/test";
import {
  addInterval,
  completeTodo,
  createLogEntry,
  describeTiming,
  getUrgency,
  sortTodos,
  type Todo,
} from "./domain";

const base: Todo = { id: "1", title: "t", createdAt: "2026-01-01T00:00:00.000Z" };

describe("addInterval", () => {
  it("adds days, weeks and clamps months", () => {
    expect(addInterval("2026-01-30", { every: 3, unit: "day" })).toBe("2026-02-02");
    expect(addInterval("2026-01-01", { every: 2, unit: "week" })).toBe("2026-01-15");
    expect(addInterval("2026-01-31", { every: 1, unit: "month" })).toBe("2026-02-28");
  });
});

describe("getUrgency", () => {
  const today = "2026-05-10";
  it.each([
    ["2026-05-09", "overdue"],
    ["2026-05-10", "due-today"],
    ["2026-05-12", "due-soon"],
    ["2026-05-13", "upcoming"],
  ] as const)("%s -> %s", (dueDate, expected) => {
    expect(getUrgency({ ...base, dueDate }, today)).toBe(expected);
  });
  it("handles no deadline and done", () => {
    expect(getUrgency(base, today)).toBe("none");
    expect(getUrgency({ ...base, dueDate: "2026-01-01", completedAt: "x" }, today)).toBe("done");
  });
});

describe("completeTodo", () => {
  const now = new Date(2026, 4, 10, 12);
  it("marks one-off todos done", () => {
    expect(completeTodo(base, now).completedAt).toBeDefined();
  });
  it("rolls recurring todos to the next future occurrence", () => {
    const todo = {
      ...base,
      dueDate: "2026-05-01",
      recurrence: { every: 1, unit: "week" as const },
    };
    const done = completeTodo(todo, now);
    expect(done.completedAt).toBeUndefined();
    expect(done.dueDate).toBe("2026-05-15");
    expect(done.completedCount).toBe(1);
  });
  it("completing early never schedules beyond one period from today", () => {
    const todo = { ...base, dueDate: "2026-05-12", recurrence: { every: 3, unit: "day" as const } };
    expect(completeTodo(todo, now).dueDate).toBe("2026-05-13");
  });
  it("completing repeatedly stays one period from today", () => {
    // 5 days left on a weekly todo.
    const todo = {
      ...base,
      dueDate: "2026-05-15",
      recurrence: { every: 1, unit: "week" as const },
    };
    const once = completeTodo(todo, now);
    const twice = completeTodo(once, now);
    expect(once.dueDate).toBe("2026-05-17");
    expect(twice.dueDate).toBe("2026-05-17");
  });
});

it("sorts overdue first", () => {
  const todos: Todo[] = [
    { ...base, id: "a" },
    { ...base, id: "b", dueDate: "2026-05-01" },
    { ...base, id: "c", dueDate: "2026-05-10" },
  ];
  expect(sortTodos(todos, "2026-05-10").map((t) => t.id)).toEqual(["b", "c", "a"]);
});

describe("describeTiming", () => {
  const todo: Todo = { ...base, dueDate: "2026-05-10" };
  it.each([
    [new Date(2026, 4, 8, 9), "On time"],
    [new Date(2026, 4, 10, 23), "On time"],
    [new Date(2026, 4, 11, 1), "1 day late"],
    [new Date(2026, 4, 13, 12), "3 days late"],
  ])("%s -> %s", (now, expected) => {
    expect(describeTiming(createLogEntry(todo, now))).toBe(expected);
  });
  it("is null without a deadline", () => {
    expect(describeTiming(createLogEntry(base, new Date()))).toBeNull();
  });
});
