import { Badge, Box, Button, Group, Text } from '@mantine/core'
import type { DataGridColumn } from '../../components'
import { eventLocations, eventPriorities, eventStatuses } from './event'
import type { CalendarEvent, EventStatus } from './event'

export const getEventId = (event: CalendarEvent) => event.id
export const getEventDay = (event: CalendarEvent) => event.date
export const getEventLabel = (event: CalendarEvent) => event.title

const dayFormatter = new Intl.DateTimeFormat('en', { dateStyle: 'full', timeZone: 'UTC' })

const statusColors: Record<EventStatus, string> = {
  'scheduled': 'blue',
  'in progress': 'yellow',
  'done': 'green',
  'cancelled': 'gray',
}

export const formatDay = (date: string) => dayFormatter.format(new Date(`${date}T00:00:00Z`))

export function createEventColumns(onEdit: (event: CalendarEvent) => void): DataGridColumn<CalendarEvent>[] {
  return [
    { id: 'id', label: 'ID', accessor: 'id', sort: 'alphanumeric', hidden: true },
    { id: 'title', label: 'Title', accessor: 'title', sort: 'alphanumeric', hideable: false },
    { id: 'date', label: 'Date', accessor: 'date', filter: 'date' },
    {
      id: 'status',
      label: 'Status',
      accessor: 'status',
      filter: 'select',
      filterOptions: eventStatuses,
      render: event => <Badge variant="light" color={statusColors[event.status]}>{event.status}</Badge>,
    },
    { id: 'priority', label: 'Priority', accessor: 'priority', sort: 'number', filter: 'select', filterOptions: eventPriorities },
    { id: 'location', label: 'Location', accessor: 'location', filter: 'select', filterOptions: eventLocations, hidden: true },
    {
      id: 'actions',
      label: 'Actions',
      render: event => (
        <Button variant="subtle" size="xs" aria-label={`Edit ${event.title}`} onClick={() => onEdit(event)}>
          Edit
        </Button>
      ),
    },
  ]
}

export function renderEventTimelineItem(event: CalendarEvent) {
  return (
    <Group gap="sm" wrap="nowrap" h="100%">
      <Box w={8} h={8} bg={statusColors[event.status]} style={{ borderRadius: '50%', flexShrink: 0 }} />
      <Box miw={0}>
        <Text size="sm" truncate title={event.title}>{event.title}</Text>
        <Text size="xs" c="dimmed">{event.status} · {event.location}</Text>
      </Box>
    </Group>
  )
}
