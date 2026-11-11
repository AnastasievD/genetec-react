# Genetec React Technical Task

React technical assignment: a reusable data grid, timeline, and event form with a demo application.

Requires Node.js 24 LTS and npm.

```sh
npm ci
npm run dev
```

Checks: `npm run typecheck`, `npm run lint`, `npm run build`.

The event model and reproducible mock data generator live in `src/features/events`.
Events use date-only values (`YYYY-MM-DD`), so grouping by day is independent of time zone.

The demo holds 100,000 events in memory. `DataGrid` uses TanStack Table for column
definitions and client-side pagination. Mantine provides the table markup, pagination
controls, and application layout.
It renders 25 rows per page by default; `initialPageSize` sets the initial page size.

Column headings toggle ascending, descending, and unsorted order. Sorting applies
to the full dataset before pagination. IDs and titles use natural numeric ordering.
