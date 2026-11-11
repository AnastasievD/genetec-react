export interface TimelineItemRow<T> {
  type: 'item'
  id: string
  item: T
  itemIndex: number
  groupIndex: number
  position: number
}

type TimelineRow<T> = { type: 'group'; key: string } | TimelineItemRow<T>

export function createTimelineModel<T>(
  items: readonly T[],
  getId: (item: T) => string,
  getGroupKey: (item: T) => string,
) {
  const byGroup = new Map<string, T[]>()

  for (const item of items) {
    const key = getGroupKey(item)
    const group = byGroup.get(key)
    if (group) group.push(item)
    else byGroup.set(key, [item])
  }

  const rows: TimelineRow<T>[] = []
  const groups: { key: string; firstItemIndex: number; count: number }[] = []
  const itemRowIndices: number[] = []
  const rowIndexById = new Map<string, number>()

  // Keys are compared as plain strings, which is the right order for ISO dates.
  for (const [key, groupItems] of [...byGroup].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
    const groupIndex = groups.length
    groups.push({ key, firstItemIndex: itemRowIndices.length, count: groupItems.length })
    rows.push({ type: 'group', key })

    groupItems.forEach((item, position) => {
      const id = getId(item)
      rowIndexById.set(id, rows.length)
      itemRowIndices.push(rows.length)
      rows.push({ type: 'item', id, item, position, groupIndex, itemIndex: itemRowIndices.length - 1 })
    })
  }

  return { rows, groups, itemRowIndices, rowIndexById }
}

export type TimelineModel<T> = ReturnType<typeof createTimelineModel<T>>

export function getNavigationTarget<T>(model: TimelineModel<T>, current: TimelineItemRow<T>, key: string) {
  const { itemRowIndices, groups } = model

  switch (key) {
    case 'ArrowUp':
      return itemRowIndices[Math.max(0, current.itemIndex - 1)]
    case 'ArrowDown':
      return itemRowIndices[Math.min(itemRowIndices.length - 1, current.itemIndex + 1)]
    case 'Home':
      return itemRowIndices[0]
    case 'End':
      return itemRowIndices.at(-1)
    case 'ArrowLeft':
    case 'ArrowRight': {
      const group = groups[current.groupIndex + (key === 'ArrowLeft' ? -1 : 1)]
      const itemIndex = group
        ? group.firstItemIndex + Math.min(current.position, group.count - 1)
        : current.itemIndex

      return itemRowIndices[itemIndex]
    }
    default:
      return undefined
  }
}
