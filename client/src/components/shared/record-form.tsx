import { useRef } from 'react'
import { Link, useBeforeUnload, useBlocker } from 'react-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ChoiceSelect } from './choice-select'
import { DateTimePicker } from './date-time-picker'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { RecordPicker } from './record-picker'
import { TimezoneField } from './timezone-field'
import { FormError, Pending } from './states'
import { friendly, type ResourceConfig } from '@/lib/fields'
import { type Entity } from '@/lib/resources'
import { initialValues, formSchema, toPayload, type FormValues } from '@/lib/forms'
import { ApiError } from '@/lib/api-client'

export function RecordForm({
  config,
  record,
  onSave,
  cancelTo,
  saving,
}: {
  config: ResourceConfig
  record?: Entity
  onSave: (body: Record<string, unknown>) => Promise<void>
  cancelTo: string
  saving: boolean
}) {
  const saved = useRef(false)
  const form = useForm<FormValues>({
    defaultValues: initialValues(config, record),
    resolver: zodResolver(formSchema(config, record)),
  })
  const companyId = String(form.watch('companyId') || '')
  const { errors, isDirty, isSubmitting } = form.formState
  const blocker = useBlocker(isDirty && !isSubmitting && !saved.current)
  useBeforeUnload((event) => {
    if (isDirty && !saved.current) {
      event.preventDefault()
      event.returnValue = ''
    }
  })
  const submit = form.handleSubmit(async (values) => {
    form.clearErrors('root')
    try {
      saved.current = true
      await onSave(toPayload(config, values, record))
    } catch (error) {
      saved.current = false
      if (error instanceof ApiError)
        Object.entries(error.details?.fieldErrors ?? {}).forEach(([key, messages]) =>
          form.setError(key, { message: messages.join(' ') }),
        )
      form.setError('root', {
        message: error instanceof Error ? error.message : 'Unable to save. Please try again.',
      })
    }
  })
  return (
    <>
      <form noValidate onSubmit={submit} className="max-w-4xl space-y-5">
        <fieldset disabled={saving || isSubmitting} className="space-y-5">
          {(['basic', 'details'] as const).map((section) => {
            const fields = config.fields.filter(
              (field) => (field.section ?? 'basic') === section && !(record && field.createOnly),
            )
            return fields.length ? (
              <section className="panel" key={section}>
                <div className="border-b px-6 py-4">
                  <h2 className="font-semibold">
                    {section === 'basic' ? 'Basic information' : 'Additional details'}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {section === 'basic'
                      ? 'Fields marked with * are required.'
                      : 'A little context for when you come back.'}
                  </p>
                </div>
                <div className="field-grid p-6">
                  {fields.map((field) => {
                    const error = errors[field.key]?.message
                    const descriptionId = `${field.key}-description`
                    return (
                      <div
                        key={field.key}
                        className={field.type === 'textarea' ? 'sm:col-span-2' : ''}
                      >
                        <Label htmlFor={field.key} className="mb-2 block">
                          {field.label}
                          {field.required && (
                            <span aria-hidden="true" className="ml-1 text-muted-foreground">
                              *
                            </span>
                          )}
                        </Label>
                        {field.type === 'company' || field.type === 'recruiter' ? (
                          <Controller
                            control={form.control}
                            name={field.key}
                            render={({ field: control }) => (
                              <RecordPicker
                                key={field.type === 'recruiter' ? companyId : field.key}
                                id={field.key}
                                label={field.label}
                                kind={field.type === 'company' ? 'companies' : 'contacts'}
                                value={String(control.value || '')}
                                companyId={field.type === 'recruiter' ? companyId : undefined}
                                disabled={
                                  saving ||
                                  isSubmitting ||
                                  (field.type === 'recruiter' && !companyId)
                                }
                                ref={control.ref}
                                onBlur={control.onBlur}
                                invalid={!!error}
                                required={field.required}
                                describedBy={descriptionId}
                                onChange={(value) => {
                                  control.onChange(value)
                                  if (field.type === 'company' && config.kind === 'applications')
                                    form.setValue('recruiter', '', { shouldDirty: true })
                                }}
                              />
                            )}
                          />
                        ) : field.type === 'textarea' ? (
                          <Textarea
                            id={field.key}
                            rows={5}
                            aria-required={field.required}
                            aria-invalid={!!error}
                            aria-describedby={descriptionId}
                            {...form.register(field.key)}
                          />
                        ) : field.type === 'select' ? (
                          <Controller
                            control={form.control}
                            name={field.key}
                            render={({ field: control }) => (
                              <ChoiceSelect
                                {...control}
                                id={field.key}
                                value={String(control.value || '')}
                                disabled={saving || isSubmitting}
                                aria-required={field.required}
                                aria-invalid={!!error}
                                aria-describedby={descriptionId}
                                options={(field.options ?? []).map((value) => ({
                                  value,
                                  label: friendly(value),
                                }))}
                              />
                            )}
                          />
                        ) : field.type === 'checkbox' ? (
                          <div className="flex h-10 items-center gap-2">
                            <Controller
                              control={form.control}
                              name={field.key}
                              render={({ field: control }) => (
                                <Checkbox
                                  id={field.key}
                                  ref={control.ref}
                                  onBlur={control.onBlur}
                                  checked={!!control.value}
                                  onCheckedChange={(checked) => control.onChange(checked === true)}
                                  disabled={saving || isSubmitting}
                                />
                              )}
                            />
                            <span className="text-muted-foreground">Available</span>
                          </div>
                        ) : field.type === 'timezone' ? (
                          <Controller
                            control={form.control}
                            name={field.key}
                            render={({ field: control }) => (
                              <TimezoneField
                                {...control}
                                id={field.key}
                                label={field.label}
                                value={String(control.value || '')}
                                disabled={saving || isSubmitting}
                                aria-required={field.required}
                                aria-invalid={!!error}
                                aria-describedby={descriptionId}
                              />
                            )}
                          />
                        ) : field.type === 'datetime' ? (
                          <Controller
                            control={form.control}
                            name={field.key}
                            render={({ field: control }) => (
                              <DateTimePicker
                                {...control}
                                id={field.key}
                                label={field.label}
                                value={String(control.value || '')}
                                disabled={saving || isSubmitting}
                                aria-required={field.required}
                                aria-invalid={!!error}
                                aria-describedby={descriptionId}
                              />
                            )}
                          />
                        ) : (
                          <Input
                            id={field.key}
                            type={field.type ?? 'text'}
                            aria-required={field.required}
                            aria-invalid={!!error}
                            aria-describedby={descriptionId}
                            {...form.register(field.key)}
                          />
                        )}
                        <div id={descriptionId} className="mt-1.5 text-xs leading-relaxed">
                          {error ? (
                            <p role="alert" className="text-destructive">
                              {String(error)}
                            </p>
                          ) : field.hint ? (
                            <p className="text-muted-foreground">{field.hint}</p>
                          ) : null}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            ) : null
          })}
        </fieldset>
        <FormError error={errors.root?.message} />
        <div className="flex items-center justify-end gap-3 border-t pt-5">
          <Button type="button" variant="outline" asChild>
            <Link to={cancelTo}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={saving || isSubmitting}>
            {saving || isSubmitting ? (
              <Pending>Saving…</Pending>
            ) : record ? (
              'Save changes'
            ) : (
              `Create ${config.singular}`
            )}
          </Button>
        </div>
      </form>
      <Dialog
        open={blocker.state === 'blocked'}
        onOpenChange={(open) => {
          if (!open && blocker.state === 'blocked') blocker.reset()
        }}
      >
        <DialogContent>
          <DialogTitle>Leave without saving?</DialogTitle>
          <DialogDescription>Your changes haven’t been saved yet.</DialogDescription>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => blocker.state === 'blocked' && blocker.reset()}
            >
              Keep editing
            </Button>
            <Button
              variant="destructive"
              onClick={() => blocker.state === 'blocked' && blocker.proceed()}
            >
              Discard changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
