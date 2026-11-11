import { useId } from 'react'
import { Flex, Group, Pagination, Paper, Table, Text, UnstyledButton } from '@mantine/core'
import {
  columnFilteringFeature,
  columnVisibilityFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
  useTable,
} from '@tanstack/react-table'
import type { ColumnDef, RowData } from '@tanstack/react-table'
import { DataGridState } from './DataGridState'
import { DataGridToolbar } from './DataGridToolbar'

const features = tableFeatures({
  columnFilteringFeature,
  columnVisibilityFeature,
  rowSortingFeature,
  rowPaginationFeature,
  filterFns: { includesString: filterFn_includesString },
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
})

export type DataGridFeatures = typeof features

interface DataGridProps<T extends RowData> {
  caption: string
  rows: readonly T[]
  columns: readonly ColumnDef<DataGridFeatures, T>[]
  getRowId: (row: T) => string
  initialPageSize?: number
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
  loading = false,
  error,
  onRetry,
}: DataGridProps<T>) {
  const captionId = useId()
  const table = useTable({
    features,
    data: rows,
    columns,
    getRowId,
    defaultColumn: { filterFn: 'includesString' },
    enableMultiSort: false,
    enableSortingRemoval: true,
    sortDescFirst: false,
    initialState: { pagination: { pageIndex: 0, pageSize: initialPageSize } },
  })
  const { pageIndex, pageSize } = table.state.pagination
  const unavailable = loading || Boolean(error)
  const visibleRows = unavailable ? [] : table.getRowModel().rows
  const rowCount = unavailable ? 0 : table.getRowCount()
  const pageCount = unavailable ? 1 : Math.max(1, table.getPageCount())
  const start = pageIndex * pageSize

  return (
    <Paper withBorder radius="md" aria-busy={loading} style={{ overflow: 'hidden' }}>
      <DataGridToolbar
        table={table}
        caption={caption}
        captionId={captionId}
        totalRows={rows.length}
        filteredRows={rowCount}
        disabled={unavailable}
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
                        <UnstyledButton disabled={unavailable} onClick={header.column.getToggleSortingHandler()} fw={600}>
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
                    onClearFilters={() => table.resetColumnFilters()}
                  />
                </Table.Td>
              </Table.Tr>
            ) : visibleRows.map(row => (
              <Table.Tr key={row.id}>
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
            {rowCount === 0 ? 0 : start + 1}–{start + visibleRows.length} of {rowCount} records
            {' · '}Page {pageIndex + 1} of {pageCount}
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
