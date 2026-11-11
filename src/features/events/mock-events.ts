import type { CalendarEvent } from './event'

const titles = [
  'Site inspection',
  'Maintenance visit',
  'Safety briefing',
  'Equipment check',
  'Team meeting',
] as const

const startDate = Date.UTC(2026, 0, 1)
const daysInYear = 365
const millisecondsPerDay = 24 * 60 * 60 * 1000

export function createMockEvents(count: number): CalendarEvent[] {
  if (!Number.isSafeInteger(count) || count < 0) {
    throw new RangeError('Event count must be a non-negative safe integer')
  }

  return Array.from({ length: count }, (_, index) => ({
    id: `mock-event-${index + 1}`,
    title: `${titles[index % titles.length]} ${index + 1}`,
    date: new Date(startDate + (index % daysInYear) * millisecondsPerDay)
      .toISOString()
      .slice(0, 10),
  }))
}
