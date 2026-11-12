import { useCallback, useEffect, useEffectEvent, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { Box, Group, Paper, Text, UnstyledButton, VisuallyHidden } from '@mantine/core'
import { defaultRangeExtractor, useVirtualizer } from '@tanstack/react-virtual'
import type { Range } from '@tanstack/react-virtual'
import { createTimelineModel, getNavigationTarget } from './timeline-model'

export interface TimelineProps<T> {
  items: readonly T[]
  // Should be stable references, otherwise the groups are rebuilt on every render.
  getId: (item: T) => string
  getGroupKey: (item: T) => string
  formatGroupKey?: (key: string) => string
  getItemLabel: (item: T) => string
  renderItem: (item: T) => ReactNode
  onItemSelect?: (item: T) => void
  // Item to scroll to and highlight, e.g. the one just saved.
  highlightedId?: string
  title?: string
  description?: ReactNode
  emptyMessage?: ReactNode
}

export function Timeline<T>({
  items,
  getId,
  getGroupKey,
  formatGroupKey = key => key,
  getItemLabel,
  renderItem,
  onItemSelect,
  highlightedId,
  title = 'Timeline',
  description,
  emptyMessage = 'Nothing to display.',
}: TimelineProps<T>) {
  const titleId = useId()
  const instructionsId = useId()
  const scrollRef = useRef<HTMLDivElement>(null)
  const pendingFocus = useRef<string | null>(null)
  const announcedGroup = useRef<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const model = useMemo(() => createTimelineModel(items, getId, getGroupKey), [items, getId, getGroupKey])
  // Row 0 is the first group header, so row 1 is the first item.
  const activeRowIndex = (activeId ? model.rowIndexById.get(activeId) : undefined) ?? (model.rows.length > 0 ? 1 : undefined)

  // Keep the focused item mounted when scrolling it outside the visible range.
  const rangeExtractor = useCallback((range: Range) => {
    const indices = defaultRangeExtractor(range)
    if (activeRowIndex !== undefined && !indices.includes(activeRowIndex)) {
      indices.push(activeRowIndex)
      indices.sort((a, b) => a - b)
    }
    return indices
  }, [activeRowIndex])

  const getItemKey = useCallback((index: number) => model.rows[index]?.key ?? index, [model])

  // oxlint-disable-next-line react/incompatible-library -- Virtualizer models are read on every render, without memoization.
  const virtualizer = useVirtualizer({
    count: model.rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: index => model.rows[index]?.type === 'group' ? 40 : 56,
    getItemKey,
    rangeExtractor,
    overscan: 5,
  })
  const virtualItems = virtualizer.getVirtualItems()

  const revealHighlighted = useEffectEvent(() => {
    const index = highlightedId ? model.rowIndexById.get(highlightedId) : undefined
    if (index === undefined) return

    // Make it the tab stop, but don't move focus away from where the user is.
    setActiveId(highlightedId ?? null)
    virtualizer.scrollToIndex(index, { align: 'center' })
  })

  useEffect(() => revealHighlighted(), [highlightedId, model])

  useLayoutEffect(() => {
    const id = pendingFocus.current
    if (!id) return

    const button = scrollRef.current?.querySelector<HTMLElement>(`[data-item-id="${CSS.escape(id)}"]`)
    if (button) {
      button.focus({ preventScroll: true })
      pendingFocus.current = null
    }
  }, [activeId, virtualItems])

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, rowIndex: number) {
    const index = getNavigationTarget(model, rowIndex, event.key)
    if (index === undefined) return
    event.preventDefault()

    const target = model.rows[index]
    if (target?.type !== 'item') return

    pendingFocus.current = target.id
    setActiveId(target.id)
    virtualizer.scrollToIndex(index, { align: 'auto' })
  }

  return (
    <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
      <Box p="md">
        <Text component="h2" id={titleId} size="md" fw={600} m={0}>{title}</Text>
        {description && <Text size="sm" c="dimmed">{description}</Text>}
        <Text id={instructionsId} size="xs" c="dimmed" mt="xs">
          ↑ / ↓ items · ← / → groups · Home / End first / last item
          {onItemSelect && ' · Enter to open'}
        </Text>
      </Box>
      <VisuallyHidden role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </VisuallyHidden>
      {items.length === 0 ? (
        <Text p="xl" ta="center" role="status">{emptyMessage}</Text>
      ) : (
        <Box
          ref={scrollRef}
          role="region"
          aria-labelledby={titleId}
          aria-describedby={instructionsId}
          onBlur={event => {
            if (!event.currentTarget.contains(event.relatedTarget)) announcedGroup.current = null
          }}
          h="min(55vh, 32rem)"
          style={{ overflowY: 'auto', position: 'relative' }}
        >
          <Box pos="relative" h={virtualizer.getTotalSize()}>
            {virtualItems.map(virtualItem => {
              const row = model.rows[virtualItem.index]
              if (!row) return null

              const group = model.groups[row.groupIndex]
              const groupLabel = formatGroupKey(group?.key ?? '')

              return (
                <Box
                  key={virtualItem.key}
                  pos="absolute"
                  top={0}
                  left={0}
                  w="100%"
                  h={virtualItem.size}
                  style={{ transform: `translateY(${virtualItem.start}px)` }}
                >
                  {row.type === 'group' ? (
                    <Group h="100%" px="md" bg="var(--mantine-color-default-hover)">
                      <Text component="h3" size="sm" fw={600} m={0} truncate>{groupLabel}</Text>
                    </Group>
                  ) : (
                    <UnstyledButton
                      data-item-id={row.id}
                      w="100%"
                      h="100%"
                      px="md"
                      bg={row.id === highlightedId ? 'var(--mantine-primary-color-light)' : undefined}
                      tabIndex={virtualItem.index === activeRowIndex ? 0 : -1}
                      // The button's own name covers the item; the live region only announces group changes.
                      aria-label={`${getItemLabel(row.item)}, ${row.position + 1} of ${group?.count}`}
                      onFocus={() => {
                        setActiveId(row.id)
                        if (announcedGroup.current !== group?.key) {
                          announcedGroup.current = group?.key ?? null
                          setAnnouncement(`${groupLabel}, ${group?.count} items`)
                        }
                      }}
                      onKeyDown={event => handleKeyDown(event, virtualItem.index)}
                      onClick={() => onItemSelect?.(row.item)}
                    >
                      {renderItem(row.item)}
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
