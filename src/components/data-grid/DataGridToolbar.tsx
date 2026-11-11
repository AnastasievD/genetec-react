import { Badge, Button, Checkbox, Drawer, Group, Popover, Stack, Text, TextInput } from '@mantine/core'
import { useEffect, useEffectEvent, useState } from 'react'
import { useDebouncedValue, useDisclosure } from '@mantine/hooks'
import type { ReactTable, RowData } from '@tanstack/react-table'
import type { DataGridFeatures } from './features'

interface DataGridToolbarProps<T extends RowData> {
  table: ReactTable<DataGridFeatures, T>
  caption: string
  captionId: string
  labels: ReadonlyMap<string, string>
  totalRows: number
  filteredRows: number
  disabled: boolean
  onClearFilters: () => void
}

export function DataGridToolbar<T extends RowData>({
  table, caption, captionId, labels, totalRows, filteredRows, disabled, onClearFilters,
}: DataGridToolbarProps<T>) {
  const [filtersOpened, { open: openFilters, close: closeFilters }] = useDisclosure(false)
  const [filtersVersion, setFiltersVersion] = useState(0)
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
                    label={labels.get(column.id) ?? column.id}
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
            {filterColumns.map(column => (
              <ColumnFilter
                key={`${column.id}-${filtersVersion}`}
                label={labels.get(column.id) ?? column.id}
                initialValue={String(column.getFilterValue() ?? '')}
                onChange={value => {
                  if (value === (column.getFilterValue() ?? '')) return
                  column.setFilterValue(value)
                  table.setPageIndex(0)
                }}
              />
            ))}
            <Text size="sm" c="dimmed" role="status">
              {filteredRows} of {totalRows} records match.
            </Text>
            <Group grow>
              <Button variant="default" disabled={activeFilterCount === 0} onClick={() => {
                  onClearFilters()
                  setFiltersVersion(version => version + 1)
                }}>
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

interface ColumnFilterProps {
  label: string
  initialValue: string
  onChange: (value: string) => void
}

function ColumnFilter({ label, initialValue, onChange }: ColumnFilterProps) {
  const [value, setValue] = useState(initialValue)
  const [debouncedValue] = useDebouncedValue(value, 250)

  const applyFilter = useEffectEvent(onChange)

  useEffect(() => applyFilter(debouncedValue), [debouncedValue])

  return (
    <TextInput
      label={label}
      placeholder={`Filter ${label}`}
      value={value}
      onChange={event => setValue(event.currentTarget.value)}
    />
  )
}
