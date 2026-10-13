# Todoz

A small todo app where todos behave like tasks:

- **Deadlines**: give a todo a due date.
- **Recurring todos**: repeat every N days, weeks or months. Checking one off rolls it to the next occurrence (skipping any missed ones).
- **Overdue highlighting**: todos are colour-coded as _overdue_, _due today_ or _due soon_ (within 2 days), and sorted by urgency.
- Light / dark / auto theme.

Todos are stored in your browser's `localStorage`. There is no backend and no account.

## Development

This project uses [Vite+](https://viteplus.dev) (`vp`) with [TanStack Start](https://tanstack.com/start) and [Tailwind CSS](https://tailwindcss.com). Check `package.json` for the scripts and other dependencies.
