import { useState } from 'react'
import { Box, Container, Select, Stack, Text, Title } from '@mantine/core'
import type { ColumnDef } from '@tanstack/react-table'
import { DataGrid } from './components/data-grid/DataGrid'
import type { DataGridFeatures } from './components/data-grid/DataGrid'
import type { CalendarEvent } from './features/events/event'
import { createMockEvents } from './features/events/mock-events'

const columns: ColumnDef<DataGridFeatures, CalendarEvent>[] = [
  { accessorKey: 'id', header: 'ID', sortFn: 'alphanumeric' },
  { accessorKey: 'title', header: 'Title', sortFn: 'alphanumeric' },
  { accessorKey: 'date', header: 'Date', sortFn: 'text' },
]

const getEventId = (event: CalendarEvent) => event.id
const emptyEvents: CalendarEvent[] = []

export default function App() {
  const [events] = useState(() => createMockEvents(100_000))
  const [scenario, setScenario] = useState('ready')

  return (
    <Container component="main" size="xl" py="xl">
      <Stack gap="xl">
        <Box component="header">
          <Text size="sm" c="dimmed">Genetec · React technical task</Text>
          <Title order={1} mt="xs">Events</Title>
        </Box>
        <Select
          label="Data scenario"
          value={scenario}
          onChange={value => setScenario(value ?? 'ready')}
          allowDeselect={false}
          maw={240}
          data={[
            { value: 'ready', label: '100,000 events' },
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
    </Container>
  )
}
