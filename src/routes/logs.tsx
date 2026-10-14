import { Link, createFileRoute } from "@tanstack/react-router";
import { daysLate, describeTiming, type LogEntry } from "#/features/todos/domain";
import { useLog, useTodos } from "#/features/todos/useTodos";

export const Route = createFileRoute("/logs")({ component: LogsPage });

const dayFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "full" });
const timeFormat = new Intl.DateTimeFormat(undefined, { timeStyle: "short" });

function groupByDay(log: LogEntry[]) {
  const groups = new Map<string, LogEntry[]>();
  for (const entry of log) {
    const day = dayFormat.format(new Date(entry.completedAt));
    groups.set(day, [...(groups.get(day) ?? []), entry]);
  }
  return [...groups];
}

function LogsPage() {
  const { log, loaded } = useLog();
  const { todos } = useTodos();
  const existing = new Set(todos.map((t) => t.id));

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <Link to="/" className="text-sm text-muted hover:text-ink">
        ← All todos
      </Link>
      <h1 className="mt-4 mb-6 text-3xl font-bold tracking-tight">Log</h1>

      {loaded && log.length === 0 && (
        <p className="py-10 text-center text-sm text-muted">No completions yet.</p>
      )}

      <div className="space-y-6">
        {groupByDay(log).map(([day, entries]) => (
          <section key={day}>
            <h2 className="mb-2 px-1 text-xs font-semibold tracking-wide text-muted uppercase">
              {day}
            </h2>
            <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
              {entries.map((entry) => (
                <LogItem key={entry.id} entry={entry} exists={existing.has(entry.todoId)} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}

function LogItem({ entry, exists }: { entry: LogEntry; exists: boolean }) {
  const timing = describeTiming(entry);
  const late = (daysLate(entry) ?? 0) > 0;

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span className="w-14 shrink-0 text-xs text-muted tabular-nums">
        {timeFormat.format(new Date(entry.completedAt))}
      </span>
      <div className="min-w-0 flex-1">
        {exists ? (
          <Link
            to="/$id"
            params={{ id: entry.todoId }}
            className="font-medium hover:text-accent hover:underline"
          >
            {entry.title}
          </Link>
        ) : (
          <span className="font-medium text-muted" title="This todo was deleted">
            {entry.title} <span className="text-xs">(deleted)</span>
          </span>
        )}
      </div>
      {timing && (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${late ? "bg-overdue/10 text-overdue" : "bg-accent/10 text-accent"}`}
        >
          {timing}
        </span>
      )}
    </li>
  );
}
