import { Group, Pagination, Paper, Table, Text } from '@mantine/core'
import {
  createPaginatedRowModel,
  rowPaginationFeature,
  tableFeatures,
  useTable,
} from '@tanstack/react-table'
import type { ColumnDef, RowData } from '@tanstack/react-table'

const features = tableFeatures({
  rowPaginationFeature,
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
  const table = useTable({
    features,
    data: rows,
    columns,
    getRowId,
    initialState: { pagination: { pageIndex: 0, pageSize: initialPageSize } },
  })
  const { pageIndex, pageSize } = table.state.pagination
  const visibleRows = table.getRowModel().rows
  const rowCount = table.getRowCount()
  const pageCount = Math.max(1, table.getPageCount())
  const start = pageIndex * pageSize

  return (
    <Paper withBorder radius="md">
      <Table.ScrollContainer minWidth={600} type="native">
        <Table horizontalSpacing="md" verticalSpacing="sm" captionSide="top" striped highlightOnHover>
          <Table.Caption ta="left" px="md" py="sm" fw={600} c="var(--mantine-color-text)">
            {caption}
          </Table.Caption>
          <Table.Thead>
            {table.getHeaderGroups().map(group => (
              <Table.Tr key={group.id}>
                {group.headers.map(header => (
                  <Table.Th key={header.id} scope="col" colSpan={header.colSpan}>
                    {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                  </Table.Th>
                ))}
              </Table.Tr>
            ))}
          </Table.Thead>
          <Table.Tbody>
            {visibleRows.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={table.getAllLeafColumns().length}>No records to display.</Table.Td>
              </Table.Tr>
            ) : visibleRows.map(row => (
              <Table.Tr key={row.id}>
                {row.getAllCells().map(cell => (
                  <Table.Td key={cell.id}><table.FlexRender cell={cell} /></Table.Td>
                ))}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
      <Group component="nav" aria-label={`${caption} pagination`} justify="space-between" p="md">
        <Text role="status" size="sm" c="dimmed">
          {rowCount === 0 ? 0 : start + 1}–{start + visibleRows.length} of {rowCount} records
          {' · '}Page {pageIndex + 1} of {pageCount}
        </Text>
        <Pagination
          total={pageCount}
          value={pageIndex + 1}
          onChange={page => table.setPageIndex(page - 1)}
          disabled={rowCount === 0}
          withEdges
          layout="responsive"
          getItemProps={page => ({ 'aria-label': `Page ${page}` })}
          getControlProps={control => ({ 'aria-label': `${control} page` })}
        />
      </Group>
    </Paper>
  )
}
