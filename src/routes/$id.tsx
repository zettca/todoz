import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { describeDue, describeRecurrence } from "#/features/todos/domain";
import { ScheduleFields, field, parseTodoForm } from "#/features/todos/TodoForm";
import { useToday, useTodo } from "#/features/todos/useTodos";

export const Route = createFileRoute("/$id")({ component: TodoPage });

function TodoPage() {
  const { id } = Route.useParams();
  const { todo, loaded, edit, remove, complete, reopen } = useTodo(id);
  const today = useToday();
  const navigate = useNavigate();
  const goBack = () => navigate({ to: "/" });

  if (!loaded) return null;

  if (!todo) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <BackLink />
        <p className="mt-6 text-muted">This todo doesn't exist anymore.</p>
      </main>
    );
  }

  function save(data: FormData) {
    const fields = parseTodoForm(data, today);
    if (!fields) return;
    edit(id, fields);
    void goBack();
  }

  const isDone = !!todo.completedAt;
  const due = isDone ? null : describeDue(todo, today);

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <BackLink />

      <form
        // Re-mount when completing/reopening changes the stored values behind the inputs.
        key={`${todo.id}:${todo.dueDate}:${todo.completedAt}`}
        action={save}
        className="group mt-6 space-y-4 rounded-2xl border border-line bg-surface p-6 shadow-sm"
      >
        <input
          name="title"
          required
          defaultValue={todo.title}
          className={`${field} w-full py-2 text-xl font-semibold`}
          aria-label="Title"
        />
        <ScheduleFields todo={todo} />

        <p className="text-xs text-muted">
          {[
            isDone ? "Done" : due,
            todo.recurrence && `↻ ${describeRecurrence(todo.recurrence)}`,
            todo.completedCount && `done ${todo.completedCount}×`,
          ]
            .filter(Boolean)
            .join(" · ") || "No deadline"}
        </p>

        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <button
            type="button"
            onClick={() => (isDone ? reopen(id) : complete(id))}
            className="rounded-lg border border-line px-3 py-1.5 text-sm text-muted hover:text-ink"
          >
            {isDone ? "Reopen" : "Complete"}
          </button>
          <button
            type="button"
            onClick={() => {
              remove(id);
              void goBack();
            }}
            className="rounded-lg border border-line px-3 py-1.5 text-sm text-muted hover:border-overdue hover:text-overdue"
          >
            Delete
          </button>
          <span aria-hidden className="flex-1" />
          <Link to="/" className="rounded-lg px-3 py-1.5 text-sm text-muted hover:text-ink">
            Cancel
          </Link>
          <button
            type="submit"
            className="rounded-lg bg-accent px-4 py-1.5 text-sm font-semibold text-accent-ink transition hover:opacity-90 group-invalid:opacity-40"
          >
            Save
          </button>
        </div>
      </form>
    </main>
  );
}

function BackLink() {
  return (
    <Link to="/" className="text-sm text-muted hover:text-ink">
      ← All todos
    </Link>
  );
}
