# Genetec React Technical Task

React technical assignment: a reusable data grid, timeline, and event form with a demo application.

Requires Node.js 24 LTS and npm.

```sh
npm ci
npm run dev
```

Checks: `npm run typecheck`, `npm run lint`, `npm run build`.

The demo uses 100,000 reproducible mock events. TanStack Table handles client-side
filtering, sorting, and pagination; Mantine provides the UI. Only the current page
is rendered. Dates use `YYYY-MM-DD` to keep day grouping independent of time zone.

The timeline starts with 10,000 events from the same dataset and includes newly
created events. TanStack Virtual renders only the visible rows and keeps the
focused event mounted for keyboard navigation.
