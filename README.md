# Genetec React Technical Task

A data grid, a timeline and an event form, plus a small app that puts them together.

Needs Node.js 24 and npm:

```sh
npm ci
npm run dev
```

Checks: `npm run typecheck`, `npm run lint`, `npm run build`.

## How it's organised

`src/components` is the "library" part. It doesn't know about events at all and doesn't
import anything from `src/features`, so it could be moved into a separate package as is.
`src/features/events` holds the event type, mock data and the config that plugs events
into the generic components. `App.tsx` just wires things together.

I used Mantine for UI and TanStack Table / Virtual for the heavy lifting. I didn't want
to write sorting and pagination by hand when a well-tested headless library exists, but
I also didn't want TanStack types to leak into the grid's API. So `DataGrid` takes its
own column config (`label`, `accessor`, `hidden`, `sort`, `filter`, `render`...) and converts it
internally. If we ever swap the table engine, consumers won't notice.

## State

All state lives in `App` with plain `useState`. There's one list of events, one modal and
a couple of UI switches. A store (Redux, Zustand) would be more code than the problem.
If the data came from an API, I'd add TanStack Query rather than a global store.

Grid and timeline read from the same `events` array, so creating or editing an event
shows up in both without any syncing. The timeline shows the first 10k events plus
anything created in the app. That's a demo requirement, not a domain rule, so it's kept
as a set of ids in `App` and not on the event itself.

## Timeline grouping

I grouped by day, as suggested. Events here are calendar entries without a time, so the
day is the natural unit. Week grouping would make groups of ~200 items, which is too
long to scroll with arrows. Dates are stored as `YYYY-MM-DD` strings and formatted in
UTC, so an event never moves to another day because of the user's time zone.

Keyboard: ↑/↓ moves between events, ←/→ jumps to the same position in the previous or
next day, Home/End go to the first or last event, Enter opens the edit form. The whole
timeline is one tab stop (roving tabindex). A screen reader reads the event and its
position ("2 of 28") on focus. The live region only speaks when you move into another
day, otherwise everything was read twice.

## 100k rows

The grid is paginated, so only 25 rows are in the DOM. The timeline is virtualized
because it's a continuous list. The tricky part there was keyboard focus: the focused
item can scroll out of the rendered range, so it's always kept mounted.

Numbers from the production build on my MacBook (M-series, Chromium):

- sorting 100k rows: ~90 ms per click
- filtering: 60–90 ms per keystroke

Sorting is a single click, so 90 ms is fine. With filtering, the delay hits every key
press and adds up while typing, so the input keeps its own value and the filter is
applied 250 ms after you stop typing.

## Smaller decisions

- Editing a row keeps you on the same page. TanStack resets to page 1 on any data change
  by default; I turned that off and reset the page only on sort or filter changes.
- The success message lives in a `role="status"` region that is always in the DOM.
- The "Grid scenario" select is there to show the loading, empty and error states. With
  mock data they wouldn't be visible otherwise.

