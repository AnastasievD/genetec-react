import { Button, Group, Select, SimpleGrid, Stack, TextInput } from '@mantine/core'
import { isNotEmpty, useForm } from '@mantine/form'
import { eventLocations, eventPriorities, eventStatuses } from './event'
import type { EventStatus, EventValues } from './event'

interface EventFormProps {
  initialValues: EventValues
  onSave: (values: EventValues) => void
  onCancel: () => void
}

const fieldOrder = ['title', 'date'] as const

export function EventForm({ initialValues, onSave, onCancel }: EventFormProps) {
  const form = useForm<EventValues>({
    mode: 'controlled',
    initialValues,
    validate: {
      title: isNotEmpty('Enter a title.'),
      date: value => {
        const date = new Date(`${value}T00:00:00Z`)
        const valid = /^\d{4}-\d{2}-\d{2}$/.test(value)
          && !value.startsWith('0000-')
          && !Number.isNaN(date.getTime())
          && date.toISOString().slice(0, 10) === value

        return valid ? null : 'Enter a valid date.'
      },
    },
  })

  const handleSubmit = form.onSubmit(
    values => onSave({ ...values, title: values.title.trim() }),
    errors => {
      const firstInvalid = fieldOrder.find(field => errors[field])
      if (firstInvalid) form.getInputNode(firstInvalid)?.focus()
    },
  )

  return (
    <form noValidate onSubmit={handleSubmit}>
      <Stack>
        <TextInput
          label="Title"
          name="title"
          required
          data-autofocus
          {...form.getInputProps('title')}
        />
        <TextInput
          label="Date"
          name="date"
          type="date"
          min="0001-01-01"
          max="9999-12-31"
          required
          {...form.getInputProps('date')}
        />
        <SimpleGrid cols={2}>
          <Select<EventStatus>
            label="Status"
            data={eventStatuses}
            allowDeselect={false}
            {...form.getInputProps('status')}
          />
          <Select
            label="Priority (1 = highest)"
            data={eventPriorities}
            allowDeselect={false}
            value={String(form.values.priority)}
            onChange={value => form.setFieldValue('priority', Number(value))}
          />
        </SimpleGrid>
        <Select
          label="Location"
          data={eventLocations}
          allowDeselect={false}
          {...form.getInputProps('location')}
        />
        <Group justify="flex-end">
          <Button type="button" variant="default" onClick={onCancel}>Cancel</Button>
          <Button type="submit">Save event</Button>
        </Group>
      </Stack>
    </form>
  )
}
