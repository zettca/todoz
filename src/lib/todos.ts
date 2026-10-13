export type RecurrenceUnit = "day" | "week" | "month";

export interface Recurrence {
  every: number;
  unit: RecurrenceUnit;
}

export interface Todo {
  id: string;
  title: string;
  createdAt: string;
  /** Local calendar date, `YYYY-MM-DD`. Recurring todos always have one (the next occurrence). */
  dueDate?: string;
  recurrence?: Recurrence;
  /** Set only for one-off todos; recurring todos roll forward instead. */
  completedAt?: string;
  lastCompletedAt?: string;
  completedCount?: number;
}

export type Urgency = "done" | "overdue" | "due-today" | "due-soon" | "upcoming" | "none";

export const DUE_SOON_DAYS = 2;

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Whole calendar days from `from` to `to` (negative if `to` is earlier). */
export function daysBetween(from: string, to: string): number {
  const ms = parseISODate(to).getTime() - parseISODate(from).getTime();
  return Math.round(ms / 86_400_000);
}

export function addInterval(iso: string, { every, unit }: Recurrence): string {
  const date = parseISODate(iso);
  if (unit === "day") date.setDate(date.getDate() + every);
  else if (unit === "week") date.setDate(date.getDate() + every * 7);
  else {
    // Clamp to month end so Jan 31 + 1 month = Feb 28/29, not Mar 3.
    const day = date.getDate();
    date.setDate(1);
    date.setMonth(date.getMonth() + every);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    date.setDate(Math.min(day, lastDay));
  }
  return toISODate(date);
}

export function getUrgency(todo: Todo, today: string): Urgency {
  if (todo.completedAt) return "done";
  if (!todo.dueDate) return "none";
  const diff = daysBetween(today, todo.dueDate);
  if (diff < 0) return "overdue";
  if (diff === 0) return "due-today";
  if (diff <= DUE_SOON_DAYS) return "due-soon";
  return "upcoming";
}

/**
 * Completing a recurring todo advances its due date to the next occurrence after today,
 * skipping any missed occurrences. One-off todos are simply marked done.
 */
export function completeTodo(todo: Todo, now: Date): Todo {
  const nowIso = now.toISOString();
  if (!todo.recurrence || !todo.dueDate) return { ...todo, completedAt: nowIso };
  const today = toISODate(now);
  let next = addInterval(todo.dueDate, todo.recurrence);
  while (daysBetween(today, next) <= 0) next = addInterval(next, todo.recurrence);
  return {
    ...todo,
    dueDate: next,
    lastCompletedAt: nowIso,
    completedCount: (todo.completedCount ?? 0) + 1,
  };
}

export function reopenTodo(todo: Todo): Todo {
  const { completedAt: _, ...rest } = todo;
  return rest;
}

const URGENCY_ORDER: Record<Urgency, number> = {
  overdue: 0,
  "due-today": 1,
  "due-soon": 2,
  upcoming: 3,
  none: 4,
  done: 5,
};

export function sortTodos(todos: Todo[], today: string): Todo[] {
  return [...todos].sort((a, b) => {
    const byUrgency = URGENCY_ORDER[getUrgency(a, today)] - URGENCY_ORDER[getUrgency(b, today)];
    if (byUrgency !== 0) return byUrgency;
    if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
    return a.createdAt < b.createdAt ? -1 : 1;
  });
}

export function describeRecurrence({ every, unit }: Recurrence): string {
  return every === 1 ? `Every ${unit}` : `Every ${every} ${unit}s`;
}

export function describeDue(todo: Todo, today: string): string | null {
  if (!todo.dueDate) return null;
  const diff = daysBetween(today, todo.dueDate);
  if (diff === 0) return "Due today";
  if (diff === 1) return "Due tomorrow";
  if (diff === -1) return "1 day overdue";
  if (diff < 0) return `${-diff} days overdue`;
  return `Due in ${diff} days`;
}
