import { Link, createFileRoute } from "@tanstack/react-router";
import ThemeToggle from "#/components/ThemeToggle";
import {
  describeDue,
  describeRecurrence,
  getUrgency,
  sortTodos,
  type Todo,
  type Urgency,
} from "#/features/todos/domain";
import { ScheduleFields, field, parseTodoForm } from "#/features/todos/TodoForm";
import { useToday, useTodos, type TodoFields } from "#/features/todos/useTodos";

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

function NewTodoForm({ onAdd, today }: { onAdd: (todo: TodoFields) => void; today: string }) {
  function addTodo(data: FormData) {
    const todo = parseTodoForm(data, today);
    if (todo) onAdd(todo);
  }

  return (
    <form action={addTodo} className="group space-y-3">
      <div className="flex gap-2">
        <input
          name="title"
          required
          className={`${field} flex-1 py-2 text-base`}
          placeholder="Add a todo…"
          aria-label="Title"
        />
        <button
          type="submit"
          className="rounded-lg bg-accent px-4 text-sm font-semibold text-accent-ink transition hover:opacity-90 group-invalid:opacity-40"
        >
          Add
        </button>
      </div>
      <ScheduleFields />
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
    <li
      className={`group flex items-center gap-3 border-l-4 px-4 py-3 transition hover:bg-ink/[0.03] ${style.row}`}
    >
      <input
        type="checkbox"
        className="h-4 w-4 cursor-pointer accent-accent"
        checked={isDone}
        onChange={onToggle}
        aria-label={isDone ? "Reopen" : "Complete"}
      />
      <Link
        to="/$id"
        params={{ id: todo.id }}
        className="min-w-0 flex-1 gap-1 rounded outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <p className={isDone ? "text-muted line-through" : "font-medium"}>{todo.title}</p>
        {(due || todo.recurrence) && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
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
      </Link>
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
