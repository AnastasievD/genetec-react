export type EventStatus = 'scheduled' | 'in progress' | 'done' | 'cancelled'

export interface CalendarEvent {
  id: string
  title: string
  /** Calendar date in YYYY-MM-DD format, without a time zone. */
  date: string
  status: EventStatus
  location: string
  /** 1 (highest) to 5 (lowest). */
  priority: number
}

export function createEvent(values: Pick<CalendarEvent, 'title' | 'date'>): CalendarEvent {
  return {
    id: crypto.randomUUID(),
    status: 'scheduled',
    location: 'Unassigned',
    priority: 3,
    ...values,
  }
}
