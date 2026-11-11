export interface TimelineItemRow<T> {
  type: 'item'
  key: string
  id: string
  item: T
  groupIndex: number
  position: number
}

type TimelineRow<T> = { type: 'group'; key: string; groupIndex: number } | TimelineItemRow<T>

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
  const groups: { key: string; firstRowIndex: number; count: number }[] = []
  const rowIndexById = new Map<string, number>()

  // Keys are compared as plain strings, which is the right order for ISO dates.
  for (const [key, groupItems] of [...byGroup].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
    const groupIndex = groups.length
    rows.push({ type: 'group', key: `group-${key}`, groupIndex })
    groups.push({ key, firstRowIndex: rows.length, count: groupItems.length })

    groupItems.forEach((item, position) => {
      const id = getId(item)
      rowIndexById.set(id, rows.length)
      rows.push({ type: 'item', key: `item-${id}`, id, item, groupIndex, position })
    })
  }

  return { rows, groups, rowIndexById }
}

export type TimelineModel<T> = ReturnType<typeof createTimelineModel<T>>

// Every group has at least one item, so a step lands on an item after skipping at most one header.
export function getNavigationTarget<T>({ rows, groups }: TimelineModel<T>, current: number, key: string) {
  const row = rows[current]
  if (row?.type !== 'item') return undefined

  const step = (direction: 1 | -1) => {
    let next = current + direction
    if (rows[next]?.type === 'group') next += direction
    return rows[next] ? next : current
  }

  switch (key) {
    case 'ArrowUp':
      return step(-1)
    case 'ArrowDown':
      return step(1)
    case 'Home':
      return 1
    case 'End':
      return rows.length - 1
    case 'ArrowLeft':
    case 'ArrowRight': {
      const group = groups[row.groupIndex + (key === 'ArrowLeft' ? -1 : 1)]
      return group ? group.firstRowIndex + Math.min(row.position, group.count - 1) : current
    }
    default:
      return undefined
  }
}
