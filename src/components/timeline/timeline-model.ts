import type { CalendarEvent } from '../../features/events/event'

export interface TimelineEventRow {
  type: 'event'
  event: CalendarEvent
  eventIndex: number
  groupIndex: number
  position: number
}

type TimelineRow = { type: 'day'; date: string } | TimelineEventRow

export function createTimelineModel(events: readonly CalendarEvent[]) {
  const byDay = new Map<string, CalendarEvent[]>()

  for (const event of events) {
    const group = byDay.get(event.date)
    if (group) group.push(event)
    else byDay.set(event.date, [event])
  }

  const rows: TimelineRow[] = []
  const groups: { date: string; firstEventIndex: number; count: number }[] = []
  const eventRowIndices: number[] = []
  const rowIndexById = new Map<string, number>()

  for (const [date, dayEvents] of [...byDay].sort(([a], [b]) => a.localeCompare(b))) {
    const groupIndex = groups.length
    groups.push({ date, firstEventIndex: eventRowIndices.length, count: dayEvents.length })
    rows.push({ type: 'day', date })

    dayEvents.forEach((event, position) => {
      rowIndexById.set(event.id, rows.length)
      eventRowIndices.push(rows.length)
      rows.push({ type: 'event', event, position, groupIndex, eventIndex: eventRowIndices.length - 1 })
    })
  }

  return { rows, groups, eventRowIndices, rowIndexById }
}

export type TimelineModel = ReturnType<typeof createTimelineModel>

export function getNavigationTarget(model: TimelineModel, current: TimelineEventRow, key: string) {
  const { eventRowIndices, groups } = model

  switch (key) {
    case 'ArrowUp':
      return eventRowIndices[Math.max(0, current.eventIndex - 1)]
    case 'ArrowDown':
      return eventRowIndices[Math.min(eventRowIndices.length - 1, current.eventIndex + 1)]
    case 'Home':
      return eventRowIndices[0]
    case 'End':
      return eventRowIndices.at(-1)
    case 'ArrowLeft':
    case 'ArrowRight': {
      const group = groups[current.groupIndex + (key === 'ArrowLeft' ? -1 : 1)]
      const eventIndex = group
        ? group.firstEventIndex + Math.min(current.position, group.count - 1)
        : current.eventIndex

      return eventRowIndices[eventIndex]
    }
    default:
      return undefined
  }
}
