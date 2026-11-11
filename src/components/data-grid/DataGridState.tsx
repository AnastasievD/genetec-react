import { Alert, Button, Loader, Stack, Text } from '@mantine/core'

interface DataGridStateProps {
  loading: boolean
  error?: string
  hasData: boolean
  onRetry?: () => void
  onClearFilters: () => void
}

export function DataGridState({ loading, error, hasData, onRetry, onClearFilters }: DataGridStateProps) {
  if (loading) {
    return (
      <Stack align="center" justify="center" mih={200} role="status">
        <Loader size="sm" aria-hidden="true" />
        <Text>Loading records…</Text>
      </Stack>
    )
  }

  if (error) {
    return (
      <Alert color="red" title="Unable to load records" my="md">
        <Stack align="flex-start" gap="sm">
          <Text size="sm">{error}</Text>
          {onRetry && <Button size="xs" variant="outline" color="red" onClick={onRetry}>Try again</Button>}
        </Stack>
      </Alert>
    )
  }

  return (
    <Stack align="center" justify="center" mih={200}>
      <Text role="status">{hasData ? 'No matching records.' : 'No records to display.'}</Text>
      {hasData && <Button variant="default" size="sm" onClick={onClearFilters}>Clear filters</Button>}
    </Stack>
  )
}
