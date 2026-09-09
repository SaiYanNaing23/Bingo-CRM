import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { EditorFrame, EditorField } from '@/components/shared/editor-frame'
import { ChoiceSelect } from '@/components/shared/choice-select'
import { FormError } from '@/components/shared/states'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ApiError } from '@/lib/api-client'
import { friendly } from '@/lib/fields'
import { projectStatuses, type Project } from './types'
import {
  projectFormSchema,
  projectValues,
  projectPayload,
  stateHint,
  type ProjectValues,
} from './forms'

export function ProjectForm({
  record,
  onSave,
  cancelTo,
}: {
  record?: Project
  onSave: (body: Record<string, unknown>) => Promise<void>
  cancelTo: string
}) {
  const form = useForm<ProjectValues>({
    defaultValues: projectValues(record),
    resolver: zodResolver(projectFormSchema(!!record)),
  })
  const { errors, isDirty, isSubmitting } = form.formState
  const submit = form.handleSubmit(async (values) => {
    form.clearErrors('root')
    try {
      await onSave(projectPayload(values, record))
    } catch (error) {
      if (error instanceof ApiError)
        Object.entries(error.details?.fieldErrors ?? {}).forEach(([key, messages]) => {
          if (key in values)
            form.setError(key as keyof ProjectValues, { message: messages.join(' ') })
        })
      form.setError('root', {
        message: error instanceof Error ? error.message : 'Unable to save. Please try again.',
      })
    }
  })
  const control = (key: keyof ProjectValues) => ({
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
      label={record ? 'Save changes' : 'Create project'}
    >
      <section className="panel p-6">
        <h2 className="mb-5 font-semibold">Project details</h2>
        <div className="field-grid">
          <EditorField id="name" label="Project name *" error={errors.name?.message} wide>
            <Input {...control('name')} aria-required="true" />
          </EditorField>
          <EditorField id="githubUrl" label="GitHub URL" error={errors.githubUrl?.message}>
            <Input type="url" {...control('githubUrl')} />
          </EditorField>
          <EditorField id="liveDemoUrl" label="Live demo URL" error={errors.liveDemoUrl?.message}>
            <Input type="url" {...control('liveDemoUrl')} />
          </EditorField>
          {!record && (
            <>
              <EditorField id="status" label="Initial status" error={errors.status?.message}>
                <Controller
                  name="status"
                  control={form.control}
                  render={({ field }) => (
                    <ChoiceSelect
                      {...field}
                      id="status"
                      disabled={isSubmitting}
                      options={projectStatuses.map((value) => ({ value, label: friendly(value) }))}
                    />
                  )}
                />
              </EditorField>
              <EditorField
                id="progress"
                label="Initial progress (%)"
                error={errors.progress?.message}
                hint={stateHint}
              >
                <Input type="number" min={0} max={100} step={1} {...control('progress')} />
              </EditorField>
            </>
          )}
          <EditorField
            id="stack"
            label="Technology stack"
            error={errors.stack?.message}
            hint="One entry per line. Up to 30; saved in lowercase."
          >
            <Textarea
              rows={4}
              {...control('stack')}
              placeholder={'React\nTypeScript\nPostgreSQL'}
            />
          </EditorField>
          <EditorField
            id="screenshots"
            label="Screenshot URLs"
            error={errors.screenshots?.message}
            hint="One HTTP(S) image URL per line, up to 20."
          >
            <Textarea rows={4} {...control('screenshots')} />
          </EditorField>
          <EditorField
            id="lessonsLearned"
            label="Lessons learned"
            error={errors.lessonsLearned?.message}
            wide
          >
            <Textarea rows={7} {...control('lessonsLearned')} />
          </EditorField>
        </div>
        {record && (
          <p className="mt-5 text-sm text-muted-foreground">
            Change status and percentage with Update progress on the project page.
          </p>
        )}
      </section>
      <FormError error={errors.root?.message} />
    </EditorFrame>
  )
}
