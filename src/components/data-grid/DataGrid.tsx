import { useEffect, useEffectEvent, useId, useMemo, useRef } from 'react'
import { Flex, Group, Pagination, Paper, Table, Text, UnstyledButton } from '@mantine/core'
import { useTable } from '@tanstack/react-table'
import type { RowData } from '@tanstack/react-table'
import { getInitialVisibility, toColumnDef } from './columns'
import type { DataGridColumn } from './columns'
import { features } from './features'
import { DataGridState } from './DataGridState'
import { DataGridToolbar } from './DataGridToolbar'

export interface DataGridProps<T extends RowData> {
  caption: string
  rows: readonly T[]
  columns: readonly DataGridColumn<T>[]
  getRowId: (row: T) => string
  initialPageSize?: number
  // Row to bring into view and highlight, e.g. the one just saved.
  highlightedId?: string
  loading?: boolean
  error?: string
  onRetry?: () => void
}

export function DataGrid<T extends RowData>({
  caption,
  rows,
  columns,
  getRowId,
  initialPageSize = 25,
  highlightedId,
  loading = false,
  error,
  onRetry,
}: DataGridProps<T>) {
  const captionId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const columnDefs = useMemo(() => columns.map(toColumnDef), [columns])
  const columnsById = useMemo(() => new Map(columns.map(column => [column.id, column])), [columns])
  const table = useTable({
    features,
    data: rows,
    columns: columnDefs,
    getRowId,
    enableMultiSort: false,
    enableSortingRemoval: true,
    sortDescFirst: false,
    // Editing a row shouldn't jump back to the first page; sorting and filtering reset it below.
    autoResetPageIndex: false,
    initialState: {
      pagination: { pageIndex: 0, pageSize: initialPageSize },
      columnVisibility: getInitialVisibility(columns),
    },
  })
  const { pageIndex, pageSize } = table.state.pagination
  const unavailable = loading || Boolean(error)
  const visibleRows = unavailable ? [] : table.getRowModel().rows
  const rowCount = unavailable ? 0 : table.getRowCount()
  const pageCount = unavailable ? 1 : Math.max(1, table.getPageCount())
  const start = pageIndex * pageSize
  const lastPageIndex = Math.max(0, table.getPageCount() - 1)

  // Rows can shrink without a filter change (e.g. a new data set), so keep the page in range.
  useEffect(() => {
    if (pageIndex > lastPageIndex) table.setPageIndex(lastPageIndex)
  }, [pageIndex, lastPageIndex, table])

  const revealHighlighted = useEffectEvent(() => {
    if (!highlightedId) return

    const findIndex = () => table.getPrePaginatedRowModel().rows.findIndex(row => row.id === highlightedId)
    let index = findIndex()
    if (index === -1 && table.state.columnFilters.length > 0) {
      table.resetColumnFilters()
      index = findIndex()
    }
    if (index !== -1) table.setPageIndex(Math.floor(index / pageSize))
  })

  // Only after a save (new id or new data), not on every sort, filter or page change.
  useEffect(() => revealHighlighted(), [highlightedId, rows])

  useEffect(() => {
    if (!highlightedId) return
    rootRef.current
      ?.querySelector(`[data-row-id="${CSS.escape(highlightedId)}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [highlightedId, pageIndex])

  function clearFilters() {
    table.resetColumnFilters()
    table.setPageIndex(0)
  }

  return (
    <Paper ref={rootRef} withBorder radius="md" aria-busy={loading} style={{ overflow: 'hidden' }}>
      <DataGridToolbar
        table={table}
        caption={caption}
        captionId={captionId}
        columnsById={columnsById}
        totalRows={rows.length}
        filteredRows={rowCount}
        disabled={unavailable}
        onClearFilters={clearFilters}
      />
      <Table.ScrollContainer minWidth={600} maxHeight="min(55vh, 32rem)" type="native">
        <Table
          aria-labelledby={captionId}
          layout="fixed"
          horizontalSpacing="md"
          verticalSpacing="sm"
          stickyHeader
          highlightOnHover
          styles={{ td: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }}
        >
          <Table.Thead>
            {table.getHeaderGroups().map(group => (
              <Table.Tr key={group.id}>
                {group.headers.map(header => {
                  const direction = header.column.getIsSorted()

                  return (
                    <Table.Th
                      key={header.id}
                      scope="col"
                      colSpan={header.colSpan}
                      aria-sort={direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : undefined}
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <UnstyledButton
                          disabled={unavailable}
                          fw={600}
                          onClick={event => {
                            header.column.getToggleSortingHandler()?.(event)
                            table.setPageIndex(0)
                          }}
                        >
                          <Group gap="xs" wrap="nowrap">
                            <table.FlexRender header={header} />
                            <span aria-hidden="true">{direction === 'asc' ? '↑' : direction === 'desc' ? '↓' : '↕'}</span>
                          </Group>
                        </UnstyledButton>
                      ) : <table.FlexRender header={header} />}
                    </Table.Th>
                  )
                })}
              </Table.Tr>
            ))}
          </Table.Thead>
          <Table.Tbody>
            {visibleRows.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={Math.max(1, table.getVisibleLeafColumns().length)} style={{ whiteSpace: 'normal' }}>
                  <DataGridState
                    loading={loading}
                    error={error}
                    hasData={rows.length > 0}
                    onRetry={onRetry}
                    onClearFilters={clearFilters}
                  />
                </Table.Td>
              </Table.Tr>
            ) : visibleRows.map(row => (
              <Table.Tr
                key={row.id}
                data-row-id={row.id}
                bg={row.id === highlightedId ? 'var(--mantine-primary-color-light)' : undefined}
              >
                {row.getVisibleCells().map(cell => {
                  const value = cell.getValue()

                  return (
                    <Table.Td key={cell.id} title={typeof value === 'string' ? value : undefined}>
                      <table.FlexRender cell={cell} />
                    </Table.Td>
                  )
                })}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
      {!unavailable && (
        <Flex
          component="nav"
          aria-label={`${caption} pagination`}
          direction={{ base: 'column', sm: 'row' }}
          align="center"
          justify="space-between"
          gap="sm"
          p="md"
          style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}
        >
          <Text role="status" size="sm" ta={{ base: 'center', sm: 'left' }}>
            {rowCount === 0 ? 0 : (start + 1).toLocaleString('en')}–{(start + visibleRows.length).toLocaleString('en')}
            {' of '}{rowCount.toLocaleString('en')} records
            {' · '}Page {(pageIndex + 1).toLocaleString('en')} of {pageCount.toLocaleString('en')}
          </Text>
          <Pagination
            total={pageCount}
            value={pageIndex + 1}
            onChange={page => table.setPageIndex(page - 1)}
            disabled={rowCount === 0}
            withEdges
            withPages={false}
            getControlProps={control => ({
              'aria-label': `${control} page`,
              title: `${control} page`,
            })}
          />
        </Flex>
      )}
    </Paper>
  )
}
