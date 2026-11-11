import { useState } from 'react'
import { Box, Container, Stack, Text, Title } from '@mantine/core'
import type { ColumnDef } from '@tanstack/react-table'
import { DataGrid } from './components/data-grid/DataGrid'
import type { DataGridFeatures } from './components/data-grid/DataGrid'
import type { CalendarEvent } from './features/events/event'
import { createMockEvents } from './features/events/mock-events'

const columns: ColumnDef<DataGridFeatures, CalendarEvent>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'title', header: 'Title' },
  { accessorKey: 'date', header: 'Date' },
]

const getEventId = (event: CalendarEvent) => event.id

export default function App() {
  const [events] = useState(() => createMockEvents(100_000))

  return (
    <Container component="main" size="xl" py="xl">
      <Stack gap="xl">
        <Box component="header">
          <Text size="sm" c="dimmed">Genetec · React technical task</Text>
          <Title order={1} mt="xs">Events</Title>
          <Text mt="xs">A data grid, timeline, and event form built with React and TypeScript.</Text>
        </Box>
        <DataGrid
          caption="Events"
          rows={events}
          columns={columns}
          getRowId={getEventId}
        />
      </Stack>
    </Container>
  )
}
