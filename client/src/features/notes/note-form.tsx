import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { EditorFrame, EditorField } from '@/components/shared/editor-frame'
import { FormError } from '@/components/shared/states'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ApiError } from '@/lib/api-client'
import { RichTextEditor } from './rich-text-editor'
import { EntityPicker } from './entity-picker'
import { noteValues, noteFormSchema, notePayload, type NoteValues } from './forms'
import type { Note, NoteEntity } from './types'

export function NoteForm({
  record,
  entity,
  onSave,
  cancelTo,
}: {
  record?: Note
  entity?: NoteEntity | null
  onSave: (body: Record<string, unknown>) => Promise<void>
  cancelTo: string
}) {
  const form = useForm<NoteValues>({
    defaultValues: noteValues(record, entity),
    resolver: zodResolver(noteFormSchema),
  })
  const { errors, isDirty, isSubmitting } = form.formState
  const values = form.watch()
  const submit = form.handleSubmit(async (values) => {
    form.clearErrors('root')
    try {
      await onSave(notePayload(values, record))
    } catch (error) {
      if (error instanceof ApiError)
        Object.entries(error.details?.fieldErrors ?? {}).forEach(([key, messages]) => {
          const field = key === 'entity' ? 'entityId' : key
          if (field in values)
            form.setError(field as keyof NoteValues, { message: messages.join(' ') })
        })
      form.setError('root', {
        message: error instanceof Error ? error.message : 'Unable to save. Please try again.',
      })
    }
  })
  const control = (key: keyof NoteValues) => ({
    ...form.register(key),
    id: key,
    'aria-invalid': !!errors[key],
    'aria-describedby': `${key}-description`,
  })
  return (
    <EditorFrame
      dirty={isDirty}
      busy={isSubmitting}
      onSubmit={submit}
      cancelTo={cancelTo}
      label={record ? 'Save changes' : 'Create note'}
    >
      <section className="panel space-y-5 p-6">
        <EditorField id="title" label="Note title *" error={errors.title?.message}>
          <Input {...control('title')} aria-required="true" />
        </EditorField>
        <EditorField
          id="content"
          label="Content *"
          error={errors.content?.message}
          hint="Select text to format it, or choose a style and start typing. Use Ctrl/Cmd+B for bold and Ctrl/Cmd+I for italic."
        >
          <Controller
            name="content"
            control={form.control}
            render={({ field }) => (
              <RichTextEditor
                ref={field.ref}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                disabled={isSubmitting}
                invalid={!!errors.content}
              />
            )}
          />
        </EditorField>
      </section>
      <section className="panel p-6">
        <h2 className="mb-5 font-semibold">Organize this note</h2>
        <div className="field-grid">
          <EditorField
            id="tags"
            label="Tags"
            error={errors.tags?.message}
            hint="One tag per line. Up to 20; saved in lowercase with duplicates removed."
            wide
          >
            <Textarea {...control('tags')} rows={3} placeholder={'interview\nbackend'} />
          </EditorField>
          <EntityPicker
            type={values.entityType}
            id={values.entityId}
            error={errors.entityId?.message}
            disabled={isSubmitting}
            onChange={(type, id) => {
              form.setValue('entityType', type, { shouldDirty: true })
              form.setValue('entityId', id, { shouldDirty: true, shouldValidate: true })
            }}
          />
        </div>
        {record?.entityAvailable === false &&
          values.entityType === record.entity?.type &&
          values.entityId === record.entity?.id && (
            <p className="mt-4 text-sm text-muted-foreground">
              The linked record is unavailable. You can still edit this note, select another record,
              or choose Standalone note to detach it.
            </p>
          )}
      </section>
      <FormError error={errors.root?.message} />
    </EditorFrame>
  )
}
