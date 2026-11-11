export interface CalendarEvent {
  id: string
  title: string
  /** Calendar date in YYYY-MM-DD format, without a time zone. */
  date: string
}

export type EventValues = Pick<CalendarEvent, 'title' | 'date'>
