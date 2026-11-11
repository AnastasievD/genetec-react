import { Box, Button, Group, Text } from '@mantine/core'
import type { DataGridColumn } from '../../components'
import type { CalendarEvent } from './event'

export const getEventId = (event: CalendarEvent) => event.id
export const getEventDay = (event: CalendarEvent) => event.date
export const getEventLabel = (event: CalendarEvent) => event.title

const dayFormatter = new Intl.DateTimeFormat('en', { dateStyle: 'full', timeZone: 'UTC' })

export const formatDay = (date: string) => dayFormatter.format(new Date(`${date}T00:00:00Z`))

export function createEventColumns(onEdit: (event: CalendarEvent) => void): DataGridColumn<CalendarEvent>[] {
  return [
    { id: 'id', label: 'ID', accessor: 'id', sort: 'alphanumeric', hidden: true },
    { id: 'title', label: 'Title', accessor: 'title', sort: 'alphanumeric', hideable: false },
    { id: 'date', label: 'Date', accessor: 'date' },
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
      <Box w={8} h={8} bg="blue" style={{ borderRadius: '50%', flexShrink: 0 }} />
      <Box miw={0}>
        <Text size="sm" truncate title={event.title}>{event.title}</Text>
        <Text size="xs" c="dimmed">{event.date}</Text>
      </Box>
    </Group>
  )
}
