import { Button, Group, Stack, TextInput } from '@mantine/core'
import { isNotEmpty, useForm } from '@mantine/form'

export interface EventFormValues {
  title: string
  date: string
}

export interface EventFormProps {
  initialValues?: EventFormValues
  onSave: (values: EventFormValues) => void
  onCancel: () => void
}

export function EventForm({ initialValues, onSave, onCancel }: EventFormProps) {
  const form = useForm<EventFormValues>({
    mode: 'controlled',
    initialValues: {
      title: initialValues?.title ?? '',
      date: initialValues?.date ?? '',
    },
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
    values => onSave({ title: values.title.trim(), date: values.date }),
    errors => {
      const firstField = Object.keys(errors)[0]
      if (firstField) form.getInputNode(firstField)?.focus()
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
        <Group justify="flex-end">
          <Button type="button" variant="default" onClick={onCancel}>Cancel</Button>
          <Button type="submit">Save event</Button>
        </Group>
      </Stack>
    </form>
  )
}
