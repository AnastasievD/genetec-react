import { Badge, Button, Checkbox, Drawer, Group, Popover, Stack, Text, TextInput } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import type { ReactTable, RowData } from '@tanstack/react-table'
import type { DataGridFeatures } from './DataGrid'

interface DataGridToolbarProps<T extends RowData> {
  table: ReactTable<DataGridFeatures, T>
  caption: string
  captionId: string
  totalRows: number
  filteredRows: number
  disabled: boolean
}

export function DataGridToolbar<T extends RowData>({
  table, caption, captionId, totalRows, filteredRows, disabled,
}: DataGridToolbarProps<T>) {
  const [filtersOpened, { open: openFilters, close: closeFilters }] = useDisclosure(false)
  const columns = table.getAllLeafColumns()
  const filterColumns = columns.filter(column => column.getCanFilter())
  const activeFilterCount = table.state.columnFilters.length
  const visibleColumnCount = table.getVisibleLeafColumns().length

  return (
    <>
      <Group justify="space-between" p="md">
        <Text component="h2" id={captionId} size="md" fw={600} m={0}>{caption}</Text>
        <Group gap="xs">
          <Popover position="bottom-end" trapFocus>
            <Popover.Target>
              <Button variant="default" size="sm" disabled={disabled}>Columns</Button>
            </Popover.Target>
            <Popover.Dropdown aria-label="Visible columns">
              <Stack gap="sm">
                {columns.map(column => (
                  <Checkbox
                    key={column.id}
                    label={typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id}
                    checked={column.getIsVisible()}
                    disabled={!column.getCanHide() || (column.getIsVisible() && visibleColumnCount === 1)}
                    onChange={column.getToggleVisibilityHandler()}
                  />
                ))}
              </Stack>
            </Popover.Dropdown>
          </Popover>
          {filterColumns.length > 0 && (
            <Button
              variant="default"
              size="sm"
              disabled={disabled}
              onClick={openFilters}
              aria-haspopup="dialog"
              aria-expanded={filtersOpened}
              rightSection={activeFilterCount > 0 ? <Badge size="sm" circle>{activeFilterCount}</Badge> : undefined}
            >
              Filters
            </Button>
          )}
        </Group>
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
              const label = typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id

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
              {filteredRows} of {totalRows} records match.
            </Text>
            <Group grow>
              <Button variant="default" disabled={activeFilterCount === 0} onClick={() => table.resetColumnFilters()}>
                Clear filters
              </Button>
              <Button onClick={closeFilters}>Done</Button>
            </Group>
          </Stack>
        </Drawer>
      )}
    </>
  )
}
