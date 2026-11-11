import { useMemo, useState } from 'react'
import { Box, Button, Container, Group, Modal, Select, Stack, Text, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import type { ColumnDef } from '@tanstack/react-table'
import { DataGrid } from './components/data-grid/DataGrid'
import type { DataGridFeatures } from './components/data-grid/DataGrid'
import { EventForm } from './components/event-form/EventForm'
import type { CalendarEvent, EventValues } from './features/events/event'
import { createMockEvents } from './features/events/mock-events'

const getEventId = (event: CalendarEvent) => event.id
const emptyEvents: CalendarEvent[] = []

export default function App() {
  const [events, setEvents] = useState(() => createMockEvents(100_000))
  const [scenario, setScenario] = useState('ready')
  const [editor, setEditor] = useState<{ event?: CalendarEvent } | null>(null)
  const columns = useMemo<ColumnDef<DataGridFeatures, CalendarEvent>[]>(() => [
    { accessorKey: 'id', header: 'ID', sortFn: 'alphanumeric' },
    { accessorKey: 'title', header: 'Title', sortFn: 'alphanumeric' },
    { accessorKey: 'date', header: 'Date', sortFn: 'text' },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button
          variant="subtle"
          size="xs"
          aria-label={`Edit ${row.original.title}`}
          onClick={() => setEditor({ event: row.original })}
        >
          Edit
        </Button>
      ),
    },
  ], [])

  function saveEvent(values: EventValues) {
    const existing = editor?.event

    if (existing) {
      setEvents(events => events.map(event => event.id === existing.id ? { ...event, ...values } : event))
    } else {
      const event = { id: crypto.randomUUID(), ...values }
      setEvents(events => [event, ...events])
    }

    setEditor(null)
    setScenario('ready')
    notifications.show({
      color: 'green',
      message: existing ? 'Event updated.' : 'Event created.',
      role: 'status',
      closeButtonProps: { 'aria-label': 'Dismiss notification' },
    })
  }

  return (
    <Container component="main" size="xl" py="xl">
      <Stack gap="xl">
        <Box component="header">
          <Text size="sm" c="dimmed">Genetec · React technical task</Text>
          <Group justify="space-between" mt="xs">
            <Title order={1}>Events</Title>
            <Button onClick={() => setEditor({})}>
              New Event
            </Button>
          </Group>
        </Box>
        <Select
          label="Data scenario"
          value={scenario}
          onChange={value => setScenario(value ?? 'ready')}
          allowDeselect={false}
          maw={240}
          data={[
            { value: 'ready', label: 'Events' },
            { value: 'loading', label: 'Loading' },
            { value: 'empty', label: 'No data' },
            { value: 'error', label: 'Error' },
          ]}
        />
        <Modal
          opened={editor !== null}
          onClose={() => setEditor(null)}
          title={editor?.event ? 'Edit event' : 'New event'}
          closeButtonProps={{ 'aria-label': 'Close event form' }}
        >
          {editor !== null && (
            <EventForm
              key={editor.event?.id ?? 'new'}
              initialValues={editor.event}
              onSave={saveEvent}
              onCancel={() => setEditor(null)}
            />
          )}
        </Modal>
        <DataGrid
          caption="Events"
          rows={scenario === 'empty' ? emptyEvents : events}
          columns={columns}
          getRowId={getEventId}
          loading={scenario === 'loading'}
          error={scenario === 'error' ? 'The mock data source is unavailable. Please try again.' : undefined}
          onRetry={() => setScenario('ready')}
        />
      </Stack>
    </Container>
  )
}
