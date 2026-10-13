import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import ThemeToggle from "#/components/ThemeToggle";
import {
  describeDue,
  describeRecurrence,
  getUrgency,
  sortTodos,
  type RecurrenceUnit,
  type Todo,
  type Urgency,
} from "#/lib/todos";
import { useToday, useTodos } from "#/lib/useTodos";

export const Route = createFileRoute("/")({ component: App });

const URGENCY: Record<Urgency, { row: string; text: string; badge?: string }> = {
  overdue: {
    row: "border-l-overdue bg-overdue/5",
    text: "text-overdue",
    badge: "bg-overdue text-white",
  },
  "due-today": {
    row: "border-l-today bg-today/5",
    text: "text-today",
    badge: "bg-today text-white",
  },
  "due-soon": { row: "border-l-soon", text: "text-soon", badge: "bg-soon text-ink" },
  upcoming: { row: "border-l-transparent", text: "text-muted" },
  none: { row: "border-l-transparent", text: "text-muted" },
  done: { row: "border-l-transparent opacity-60", text: "text-muted" },
};

const BADGE_LABEL: Partial<Record<Urgency, string>> = {
  overdue: "Overdue",
  "due-today": "Today",
  "due-soon": "Soon",
};

const field =
  "rounded-lg border border-line bg-bg px-2 py-1 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20";

/** Digits only, with leading zeros collapsed so the value stays a canonical integer string. */
function sanitizeInterval(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.replace(/^0+(?=\d)/, "");
}

function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 1;
}

function App() {
  const { todos, loaded, add, complete, reopen, remove, clearDone } = useTodos();
  const today = useToday();
  const sorted = sortTodos(todos, today);
  const active = sorted.filter((t) => !t.completedAt);
  const done = sorted.filter((t) => t.completedAt);
  const overdue = active.filter((t) => getUrgency(t, today) === "overdue").length;

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Todo<span className="text-accent">z</span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            {active.length} open
            {overdue > 0 && (
              <span className="font-semibold text-overdue"> · {overdue} overdue</span>
            )}
          </p>
        </div>
        <ThemeToggle />
      </header>

      <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <NewTodoForm onAdd={add} today={today} />
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        <ul className="divide-y divide-line">
          {active.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              today={today}
              onToggle={() => complete(todo.id)}
              onRemove={() => remove(todo.id)}
            />
          ))}
        </ul>
        {loaded && active.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">Nothing to do 🎉</p>
        )}
      </section>

      {done.length > 0 && (
        <section className="mt-8">
          <div className="mb-2 flex items-center justify-between px-1 text-xs font-semibold tracking-wide text-muted uppercase">
            <h2>Done</h2>
            <button onClick={clearDone} className="hover:text-ink">
              Clear
            </button>
          </div>
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {done.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                today={today}
                onToggle={() => reopen(todo.id)}
                onRemove={() => remove(todo.id)}
              />
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

function NewTodoForm({
  onAdd,
  today,
}: {
  onAdd: (todo: Omit<Todo, "id" | "createdAt">) => void;
  today: string;
}) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [repeats, setRepeats] = useState(false);
  const [every, setEvery] = useState("1");
  const [unit, setUnit] = useState<RecurrenceUnit>("week");

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const trimmed = title.trim();
    if (!trimmed) return;
    const interval = Number.parseInt(every, 10);
    if (repeats && !isPositiveInteger(interval)) return;
    onAdd({
      title: trimmed,
      // Recurring todos need an anchor date; default to today.
      dueDate: dueDate || (repeats ? today : undefined),
      recurrence: repeats ? { every: interval, unit } : undefined,
    });
    setTitle("");
    setDueDate("");
    setRepeats(false);
    setEvery("1");
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex gap-2">
        <input
          className={`${field} flex-1 py-2 text-base`}
          placeholder="Add a todo…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Title"
        />
        <button
          type="submit"
          className="rounded-lg bg-accent px-4 text-sm font-semibold text-accent-ink transition hover:opacity-90 disabled:opacity-40"
          disabled={!title.trim()}
        >
          Add
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
        <label className="flex items-center gap-2">
          {repeats ? "Starts" : "Due"}
          <input
            type="date"
            className={field}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="accent-accent"
            checked={repeats}
            onChange={(e) => setRepeats(e.target.checked)}
          />
          Repeat
        </label>
        {repeats && (
          <span className="flex items-center gap-2">
            every
            <input
              type="text"
              inputMode="numeric"
              pattern="[1-9][0-9]*"
              required
              autoComplete="off"
              title="Enter a whole number of 1 or more"
              className={`${field} w-16`}
              value={every}
              onChange={(e) => setEvery(sanitizeInterval(e.target.value))}
              aria-label="Interval"
            />
            <select
              className={field}
              value={unit}
              onChange={(e) => setUnit(e.target.value as RecurrenceUnit)}
              aria-label="Unit"
            >
              <option value="day">days</option>
              <option value="week">weeks</option>
              <option value="month">months</option>
            </select>
          </span>
        )}
      </div>
    </form>
  );
}

function TodoItem({
  todo,
  today,
  onToggle,
  onRemove,
}: {
  todo: Todo;
  today: string;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const urgency = getUrgency(todo, today);
  const style = URGENCY[urgency];
  const isDone = urgency === "done";
  const badge = BADGE_LABEL[urgency];
  const due = isDone ? null : describeDue(todo, today);

  return (
    <li className={`group flex items-center gap-3 border-l-4 px-4 py-3 ${style.row}`}>
      <input
        type="checkbox"
        className="h-4 w-4 cursor-pointer accent-accent"
        checked={isDone}
        onChange={onToggle}
        aria-label={isDone ? "Reopen" : "Complete"}
      />
      <div className="min-w-0 flex-1">
        <p className={isDone ? "text-muted line-through" : "font-medium"}>{todo.title}</p>
        {(due || todo.recurrence) && (
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            {badge && (
              <span className={`rounded-full px-2 py-0.5 font-semibold ${style.badge}`}>
                {badge}
              </span>
            )}
            {due && <span className={style.text}>{due}</span>}
            {todo.recurrence && (
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-accent">
                ↻ {describeRecurrence(todo.recurrence)}
              </span>
            )}
          </div>
        )}
      </div>
      <button
        onClick={onRemove}
        className="rounded p-1 text-muted opacity-0 transition group-hover:opacity-100 hover:text-overdue focus:opacity-100"
        aria-label="Delete"
      >
        ✕
      </button>
    </li>
  );
}
