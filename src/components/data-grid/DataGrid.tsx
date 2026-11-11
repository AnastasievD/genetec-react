import { useId } from 'react'
import { Badge, Button, Drawer, Flex, Group, Pagination, Paper, Stack, Table, Text, TextInput, UnstyledButton } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  columnFilteringFeature,
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

const features = tableFeatures({
  columnFilteringFeature,
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
}

export function DataGrid<T extends RowData>({
  caption,
  rows,
  columns,
  getRowId,
  initialPageSize = 25,
}: DataGridProps<T>) {
  const captionId = useId()
  const [filtersOpened, { open: openFilters, close: closeFilters }] = useDisclosure(false)
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
  const visibleRows = table.getRowModel().rows
  const rowCount = table.getRowCount()
  const pageCount = Math.max(1, table.getPageCount())
  const start = pageIndex * pageSize
  const filterColumns = table.getAllLeafColumns().filter(column => column.getCanFilter())
  const activeFilterCount = table.state.columnFilters.length

  return (
    <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
      <Group justify="space-between" p="md">
        <Text component="h2" id={captionId} size="md" fw={600} m={0}>
          {caption}
        </Text>
        {filterColumns.length > 0 && (
          <Button
            variant="default"
            size="sm"
            onClick={openFilters}
            aria-haspopup="dialog"
            aria-expanded={filtersOpened}
            rightSection={activeFilterCount > 0 ? <Badge size="sm" circle>{activeFilterCount}</Badge> : undefined}
          >
            Filters
          </Button>
        )}
      </Group>
      {filterColumns.length > 0 && (
        <Drawer
          opened={filtersOpened}
          onClose={closeFilters}
          position="right"
          title={`${caption} filters`}
          closeButtonProps={{ 'aria-label': 'Close filters' }}
        >
          <Stack>
            {filterColumns.map(column => {
              const label = typeof column.columnDef.header === 'string'
                ? column.columnDef.header
                : column.id

              return (
                <TextInput
                  key={column.id}
                  label={label}
                  placeholder={`Filter ${label}`}
                  value={String(column.getFilterValue() ?? '')}
                  onChange={event => column.setFilterValue(event.currentTarget.value)}
                />
              )
            })}
            <Text size="sm" c="dimmed" role="status">
              {rowCount} of {rows.length} records match.
            </Text>
            <Group grow>
              <Button
                variant="default"
                disabled={activeFilterCount === 0}
                onClick={() => table.resetColumnFilters()}
              >
                Clear filters
              </Button>
              <Button onClick={closeFilters}>Done</Button>
            </Group>
          </Stack>
        </Drawer>
      )}
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
                        <UnstyledButton onClick={header.column.getToggleSortingHandler()} fw={600}>
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
                <Table.Td colSpan={table.getAllLeafColumns().length}>
                  {rows.length === 0 ? 'No records to display.' : 'No matching records.'}
                </Table.Td>
              </Table.Tr>
            ) : visibleRows.map(row => (
              <Table.Tr key={row.id}>
                {row.getAllCells().map(cell => {
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
    </Paper>
  )
}
