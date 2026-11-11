import { eventLocations } from './event'
import type { CalendarEvent, EventStatus } from './event'

const titles = [
  'Site inspection',
  'Maintenance visit',
  'Safety briefing',
  'Equipment check',
  'Team meeting',
  'Camera calibration',
  'Access audit',
  'Firmware update',
  'Incident review',
] as const

const statuses: EventStatus[] = ['scheduled', 'scheduled', 'in progress', 'done', 'done', 'cancelled']

const startDate = Date.UTC(2026, 0, 1)
const daysInYear = 365
const millisecondsPerDay = 24 * 60 * 60 * 1000

// Values cycle by index. List lengths aren't multiples of 5, so a day (every 365th event)
// still gets a mix of titles and statuses.
const cycle = <T>(list: readonly T[], index: number) => list[index % list.length] as T

export function createMockEvents(count: number): CalendarEvent[] {
  if (!Number.isSafeInteger(count) || count < 0) {
    throw new RangeError('Event count must be a non-negative safe integer')
  }

  return Array.from({ length: count }, (_, index) => ({
    id: `mock-event-${index + 1}`,
    title: `${cycle(titles, index)} ${index + 1}`,
    date: new Date(startDate + (index % daysInYear) * millisecondsPerDay)
      .toISOString()
      .slice(0, 10),
    status: cycle(statuses, index),
    location: cycle(eventLocations, Math.floor(index / 4)),
    priority: 1 + Math.floor(index / 3) % 5,
  }))
}
