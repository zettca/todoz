import { describe, expect, it } from "vite-plus/test";
import { addInterval, completeTodo, getUrgency, sortTodos, type Todo } from "./todos";

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
  it("completing early moves to the next occurrence", () => {
    const todo = { ...base, dueDate: "2026-05-12", recurrence: { every: 3, unit: "day" as const } };
    expect(completeTodo(todo, now).dueDate).toBe("2026-05-15");
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
