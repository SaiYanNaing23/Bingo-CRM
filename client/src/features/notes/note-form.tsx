import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { EditorFrame, EditorField } from '@/components/shared/editor-frame'
import { FormError } from '@/components/shared/states'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api-client'
import { MarkdownPreview } from './markdown-preview'
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
  const [preview, setPreview] = useState(false)
  const form = useForm<NoteValues>({
    defaultValues: noteValues(record, entity),
    resolver: zodResolver(noteFormSchema),
  })
  const { errors, isDirty, isSubmitting } = form.formState
  const values = form.watch()
  const submit = form.handleSubmit(
    async (values) => {
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
    },
    (errors) => {
      if (errors.content) setPreview(false)
    },
  )
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
          <div className="flex gap-2" role="group" aria-label="Editor view">
            <Button
              type="button"
              size="sm"
              variant={preview ? 'ghost' : 'secondary'}
              aria-pressed={!preview}
              onClick={() => setPreview(false)}
            >
              Write
            </Button>
            <Button
              type="button"
              size="sm"
              variant={preview ? 'secondary' : 'ghost'}
              aria-pressed={preview}
              onClick={() => setPreview(true)}
            >
              Preview
            </Button>
          </div>
          <span className="text-xs text-muted-foreground">
            Markdown · {values.content.length.toLocaleString()} / 100,000 characters
          </span>
        </div>
        {preview ? (
          <div className="min-h-72">
            {values.content.trim() ? (
              <MarkdownPreview content={values.content} />
            ) : (
              <p className="text-muted-foreground">
                Your preview will appear here once you write something.
              </p>
            )}
          </div>
        ) : (
          <EditorField
            id="content"
            label="Markdown content *"
            error={errors.content?.message}
            hint="Use # headings, lists, **bold**, links, and fenced code blocks. Images open as links in the preview."
          >
            <Textarea
              {...control('content')}
              aria-required="true"
              rows={16}
              className="min-h-80 font-mono text-sm leading-7"
              spellCheck={false}
            />
          </EditorField>
        )}
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
