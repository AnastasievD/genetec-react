import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import { Badge, Button, Checkbox, Drawer, Group, Popover, Select, Stack, Text, TextInput } from '@mantine/core'
import { useDebouncedValue, useDisclosure } from '@mantine/hooks'
import type { Column, ReactTable, RowData } from '@tanstack/react-table'
import type { DataGridColumn } from './columns'
import type { DataGridFeatures } from './features'

interface DataGridToolbarProps<T extends RowData> {
  table: ReactTable<DataGridFeatures, T>
  caption: string
  captionId: string
  columnsById: ReadonlyMap<string, DataGridColumn<T>>
  totalRows: number
  filteredRows: number
  disabled: boolean
  onClearFilters: () => void
}

export function DataGridToolbar<T extends RowData>({
  table, caption, captionId, columnsById, totalRows, filteredRows, disabled, onClearFilters,
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
                    label={columnsById.get(column.id)?.label ?? column.id}
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
                column={column}
                config={columnsById.get(column.id)}
                onChange={value => {
                  if (value === (column.getFilterValue() ?? '')) return
                  column.setFilterValue(value)
                  table.setPageIndex(0)
                }}
              />
            ))}
            <Text size="sm" c="dimmed" role="status">
              {filteredRows.toLocaleString('en')} of {totalRows.toLocaleString('en')} records match.
            </Text>
            <Group grow>
              <Button
                variant="default"
                disabled={activeFilterCount === 0}
                onClick={() => {
                  onClearFilters()
                  setFiltersVersion(version => version + 1)
                }}
              >
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

interface ColumnFilterProps<T extends RowData> {
  column: Column<DataGridFeatures, T>
  config?: DataGridColumn<T>
  onChange: (value: string) => void
}

function ColumnFilter<T extends RowData>({ column, config, onChange }: ColumnFilterProps<T>) {
  const label = config?.label ?? column.id
  const initialValue = String(column.getFilterValue() ?? '')

  if (config?.filter === 'select') {
    return <SelectFilter column={column} label={label} initialValue={initialValue} onChange={onChange} />
  }

  if (config?.filter === 'date') {
    return (
      <TextInput
        type="date"
        label={label}
        defaultValue={initialValue}
        onChange={event => onChange(event.currentTarget.value)}
      />
    )
  }

  return <TextFilter label={label} initialValue={initialValue} onChange={onChange} />
}

interface FilterInputProps {
  label: string
  initialValue: string
  onChange: (value: string) => void
}

// Filtering 100k rows takes ~50-100 ms, so text is applied once typing pauses.
function TextFilter({ label, initialValue, onChange }: FilterInputProps) {
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

interface SelectFilterProps<T extends RowData> extends FilterInputProps {
  column: Column<DataGridFeatures, T>
}

function SelectFilter<T extends RowData>({ column, label, initialValue, onChange }: SelectFilterProps<T>) {
  const rows = column.table.getCoreRowModel().rows
  const options = useMemo(() => {
    const values = new Set(rows.map(row => row.getValue(column.id)))
    return [...values]
      .sort((a, b) => (a as string | number) < (b as string | number) ? -1 : 1)
      .map(String)
  }, [rows, column.id])

  return (
    <Select
      label={label}
      placeholder="Any"
      data={options}
      defaultValue={initialValue || null}
      onChange={value => onChange(value ?? '')}
      clearable
    />
  )
}
