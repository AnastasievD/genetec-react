export const eventStatuses = ['scheduled', 'in progress', 'done', 'cancelled'] as const
export const eventLocations = ['Montreal HQ', 'Toronto', 'Vancouver', 'Paris', 'Berlin', 'Remote'] as const
export const eventPriorities = ['1', '2', '3', '4', '5'] as const

export type EventStatus = typeof eventStatuses[number]

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

export type EventValues = Omit<CalendarEvent, 'id'>

export const newEventValues: EventValues = {
  title: '',
  date: '',
  status: 'scheduled',
  location: eventLocations[0],
  priority: 3,
}

export function createEvent(values: EventValues): CalendarEvent {
  return { id: crypto.randomUUID(), ...values }
}
