import { useCallback, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Box, Group, Paper, Text, UnstyledButton, VisuallyHidden } from '@mantine/core'
import { defaultRangeExtractor, useVirtualizer } from '@tanstack/react-virtual'
import type { CalendarEvent } from '../../features/events/event'
import { createTimelineModel, getNavigationTarget } from './timeline-model'
import type { TimelineEventRow } from './timeline-model'

interface TimelineProps {
  events: readonly CalendarEvent[]
  onEventSelect?: (event: CalendarEvent) => void
}

const dayFormatter = new Intl.DateTimeFormat('en', { dateStyle: 'full', timeZone: 'UTC' })
const formatDay = (date: string) => dayFormatter.format(new Date(`${date}T00:00:00Z`))

export function Timeline({ events, onEventSelect }: TimelineProps) {
  const titleId = useId()
  const instructionsId = useId()
  const scrollRef = useRef<HTMLDivElement>(null)
  const buttons = useRef(new Map<string, HTMLButtonElement>())
  const pendingFocus = useRef<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const model = useMemo(() => createTimelineModel(events), [events])
  const activeRowIndex = (activeId ? model.rowIndexById.get(activeId) : undefined) ?? model.eventRowIndices[0]

  // Keep the focused event mounted when scrolling it outside the visible range.
  const rangeExtractor = useCallback((range: Parameters<typeof defaultRangeExtractor>[0]) => {
    const indices = defaultRangeExtractor(range)
    if (activeRowIndex !== undefined && !indices.includes(activeRowIndex)) {
      indices.push(activeRowIndex)
      indices.sort((a, b) => a - b)
    }
    return indices
  }, [activeRowIndex])

  const getItemKey = useCallback((index: number) => {
    const row = model.rows[index]
    return row?.type === 'event' ? row.event.id : `day-${row?.date}`
  }, [model])

  // oxlint-disable-next-line react/incompatible-library -- Virtualizer models are read on every render, without memoization.
  const virtualizer = useVirtualizer({
    count: model.rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: index => model.rows[index]?.type === 'day' ? 40 : 56,
    getItemKey,
    rangeExtractor,
    overscan: 5,
  })
  const virtualItems = virtualizer.getVirtualItems()

  useLayoutEffect(() => {
    const id = pendingFocus.current
    if (!id) return

    const button = buttons.current.get(id)
    if (button) {
      button.focus({ preventScroll: true })
      pendingFocus.current = null
    }
  }, [activeId, virtualItems])

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, row: TimelineEventRow) {
    const index = getNavigationTarget(model, row, event.key)
    if (index === undefined) return
    event.preventDefault()

    const target = model.rows[index]
    if (target?.type !== 'event') return

    pendingFocus.current = target.event.id
    setActiveId(target.event.id)
    virtualizer.scrollToIndex(index, { align: 'auto' })
  }

  return (
    <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
      <Box p="md">
        <Text component="h2" id={titleId} size="md" fw={600} m={0}>Timeline</Text>
        <Text size="sm" c="dimmed">{events.length.toLocaleString('en')} events grouped by day</Text>
        <Text id={instructionsId} size="xs" c="dimmed" mt="xs">
          ↑ / ↓ events · ← / → days · Home / End first / last event
          {onEventSelect && ' · Enter to edit'}
        </Text>
      </Box>
      <VisuallyHidden role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </VisuallyHidden>
      {events.length === 0 ? (
        <Text p="xl" ta="center" role="status">No events to display.</Text>
      ) : (
        <Box
          ref={scrollRef}
          role="region"
          aria-labelledby={titleId}
          aria-describedby={instructionsId}
          h="min(55vh, 32rem)"
          style={{ overflowY: 'auto', position: 'relative' }}
        >
          <Box pos="relative" h={virtualizer.getTotalSize()}>
            {virtualItems.map(item => {
              const row = model.rows[item.index]
              if (!row) return null

              return (
                <Box
                  key={item.key}
                  pos="absolute"
                  top={0}
                  left={0}
                  w="100%"
                  h={item.size}
                  style={{ transform: `translateY(${item.start}px)` }}
                >
                  {row.type === 'day' ? (
                    <Group h="100%" px="md" bg="var(--mantine-color-default-hover)">
                      <Text component="h3" size="sm" fw={600} m={0} truncate>{formatDay(row.date)}</Text>
                    </Group>
                  ) : (
                    <UnstyledButton
                      ref={node => {
                        if (node) buttons.current.set(row.event.id, node)
                        else buttons.current.delete(row.event.id)
                      }}
                      w="100%"
                      h="100%"
                      px="md"
                      tabIndex={item.index === activeRowIndex ? 0 : -1}
                      aria-label={`${row.event.title}, ${formatDay(row.event.date)}`}
                      onFocus={() => {
                        setActiveId(row.event.id)
                        setAnnouncement(`${formatDay(row.event.date)}. ${row.event.title}. Event ${row.position + 1} of ${model.groups[row.groupIndex]?.count}.`)
                      }}
                      onKeyDown={event => handleKeyDown(event, row)}
                      onClick={() => onEventSelect?.(row.event)}
                    >
                      <Group gap="sm" wrap="nowrap" h="100%">
                        <Box w={8} h={8} bg="blue" style={{ borderRadius: '50%', flexShrink: 0 }} />
                        <Box miw={0}>
                          <Text size="sm" truncate title={row.event.title}>{row.event.title}</Text>
                          <Text size="xs" c="dimmed">{row.event.date}</Text>
                        </Box>
                      </Group>
                    </UnstyledButton>
                  )}
                </Box>
              )
            })}
          </Box>
        </Box>
      )}
    </Paper>
  )
}
