import { Activity, useMemo, useState } from 'react'
import { Box, Button, Container, Group, Modal, SegmentedControl, Select, Stack, Text, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { DataGrid, EventForm, Timeline } from './components'
import type { EventFormValues } from './components'
import type { CalendarEvent } from './features/events/event'
import {
  createEventColumns,
  formatDay,
  getEventDay,
  getEventId,
  getEventLabel,
  renderEventTimelineItem,
} from './features/events/event-views'
import { createMockEvents } from './features/events/mock-events'

const emptyEvents: CalendarEvent[] = []

export default function App() {
  const [events, setEvents] = useState(() => createMockEvents(100_000))
  const [timelineIds, setTimelineIds] = useState(() => new Set(events.slice(0, 10_000).map(event => event.id)))
  const timelineEvents = useMemo(() => events.filter(event => timelineIds.has(event.id)), [events, timelineIds])
  const [scenario, setScenario] = useState('ready')
  const [view, setView] = useState('grid')
  const [editor, setEditor] = useState<{ event?: CalendarEvent } | null>(null)
  const columns = useMemo(() => createEventColumns(event => setEditor({ event })), [])

  function saveEvent(values: EventFormValues) {
    const existing = editor?.event

    if (existing) {
      setEvents(events => events.map(event => event.id === existing.id ? { ...event, ...values } : event))
    } else {
      const event = { id: crypto.randomUUID(), ...values }
      setEvents(events => [event, ...events])
      setTimelineIds(ids => new Set(ids).add(event.id))
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
        <SegmentedControl
          value={view}
          onChange={setView}
          role="radiogroup"
          aria-label="Event view"
          w="fit-content"
          data={[
            { value: 'grid', label: 'Table' },
            { value: 'timeline', label: 'Timeline' },
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
        <Activity mode={view === 'grid' ? 'visible' : 'hidden'}>
          <Stack gap="md">
            <Select
              label="Grid scenario"
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
        </Activity>
        <Activity mode={view === 'timeline' ? 'visible' : 'hidden'}>
          <Timeline
            title="Timeline"
            description={`${timelineEvents.length.toLocaleString('en')} events grouped by day`}
            emptyMessage="No events to display."
            items={timelineEvents}
            getId={getEventId}
            getGroupKey={getEventDay}
            formatGroupKey={formatDay}
            getItemLabel={getEventLabel}
            renderItem={renderEventTimelineItem}
            onItemSelect={event => setEditor({ event })}
          />
        </Activity>
      </Stack>
    </Container>
  )
}
