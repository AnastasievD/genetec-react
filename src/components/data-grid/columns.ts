import type { ReactNode } from 'react'
import type { ColumnDef, RowData } from '@tanstack/react-table'
import type { DataGridFeatures } from './features'

export type DataGridFilter = 'text' | 'select' | 'date'

export interface DataGridColumn<T> {
  id: string
  label: string
  // Columns without an accessor can't be sorted or filtered.
  accessor?: (keyof T & string) | ((row: T) => unknown)
  render?: (row: T) => ReactNode
  hidden?: boolean
  hideable?: boolean
  sort?: 'text' | 'alphanumeric' | 'number' | false
  filter?: DataGridFilter | false
  filterOptions?: readonly string[]
}

export function toColumnDef<T extends RowData>(column: DataGridColumn<T>): ColumnDef<DataGridFeatures, T> {
  const { id, label, accessor, render, hideable = true, sort = 'text', filter = 'text' } = column
  const read = typeof accessor === 'string' ? (row: T) => row[accessor as keyof T] : accessor

  return {
    id,
    header: label,
    ...(read && { accessorFn: read }),
    ...(render && { cell: ({ row }) => render(row.original) }),
    enableHiding: hideable,
    enableSorting: Boolean(read) && sort !== false,
    enableColumnFilter: Boolean(read) && filter !== false,
    filterFn: filter === 'text' ? 'includesString' : 'equals',
    sortFn: sort || undefined,
  }
}

export function getInitialVisibility<T>(columns: readonly DataGridColumn<T>[]) {
  return Object.fromEntries(columns.filter(column => column.hidden).map(column => [column.id, false]))
}
