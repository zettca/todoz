import type { RecurrenceUnit, Todo } from "./domain";
import type { TodoFields } from "./useTodos";

export const field =
  "rounded-lg border border-line bg-bg px-2 py-1 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20";

/** Reads the fields rendered by `<ScheduleFields>` plus a `title` input. */
export function parseTodoForm(data: FormData, today: string): TodoFields | null {
  const title = (data.get("title") as string).trim();
  if (!title) return null;
  const dueDate = (data.get("dueDate") as string) || undefined;
  const repeats = data.has("repeats");
  return {
    title,
    // Recurring todos need an anchor date; default to today.
    dueDate: dueDate ?? (repeats ? today : undefined),
    recurrence: repeats
      ? {
          every: Math.max(1, Number(data.get("every")) || 1),
          unit: data.get("unit") as RecurrenceUnit,
        }
      : undefined,
  };
}

/** Due date and repeat inputs. The parent `<form>` must have the `group` class. */
export function ScheduleFields({ todo }: { todo?: Todo }) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
      <label className="flex items-center gap-2">
        <span className="group-has-[[name=repeats]:checked]:hidden">Due</span>
        <span className="hidden group-has-[[name=repeats]:checked]:inline">Starts</span>
        <input type="date" name="dueDate" defaultValue={todo?.dueDate} className={field} />
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="repeats"
          defaultChecked={!!todo?.recurrence}
          className="accent-accent"
        />
        Repeat
      </label>
      <span className="hidden items-center gap-2 group-has-[[name=repeats]:checked]:flex">
        every
        <input
          type="text"
          name="every"
          inputMode="numeric"
          pattern="[0-9]*"
          defaultValue={todo?.recurrence?.every ?? 1}
          className={`${field} w-16`}
          aria-label="Interval"
        />
        <select
          name="unit"
          defaultValue={todo?.recurrence?.unit ?? "week"}
          className={field}
          aria-label="Unit"
        >
          <option value="day">days</option>
          <option value="week">weeks</option>
          <option value="month">months</option>
        </select>
      </span>
    </div>
  );
}
