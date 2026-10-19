import { useCallback } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useBeforeUnload, useBlocker } from 'react-router'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { ApiError } from '@/lib/api-client'
import { browserTimezone, displayDate, isTimezone, localInput, toTimestamp } from '@/lib/dates'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ChoiceSelect } from '@/components/shared/choice-select'
import { DateTimePicker } from '@/components/shared/date-time-picker'
import { EditorField } from '@/components/shared/editor-frame'
import { RecordPicker } from '@/components/shared/record-picker'
import { FormError } from '@/components/shared/states'
import { TimezoneField } from '@/components/shared/timezone-field'
import {
  calendarSourceTypes,
  calendarTypes,
  type CalendarEvent,
  type CalendarEventType,
  type CalendarPayload,
  type CalendarSourceType,
} from './types'

const sourceKinds = {
  COMPANY: 'companies',
  CONTACT: 'contacts',
  APPLICATION: 'applications',
  TASK: 'tasks',
  PROJECT: 'projects',
} as const

function parseReminders(value: string) {
  if (!value.trim()) return []
  const reminders = value.split(',').map((item) => Number(item.trim()))
  if (reminders.some((item) => !Number.isInteger(item) || item < 0 || item > 40_320)) return null
  return [...new Set(reminders)]
}

const schema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(200, 'Use 200 characters or fewer'),
    type: z.enum(calendarTypes),
    startAt: z.string().min(1, 'Start date and time are required'),
    endAt: z.string(),
    timezone: z.string().refine(isTimezone, 'Choose a valid IANA timezone'),
    reminders: z.string().refine((value) => parseReminders(value) !== null, 'Use comma-separated whole minutes from 0 to 40320'),
    sourceEntityType: z.union([z.enum(calendarSourceTypes), z.literal('')]),
    sourceEntityId: z.string(),
  })
  .superRefine((values, context) => {
    if (Boolean(values.sourceEntityType) !== Boolean(values.sourceEntityId)) {
      context.addIssue({
        code: 'custom',
        message: 'Choose both a source type and source record, or leave both empty',
        path: values.sourceEntityId ? ['sourceEntityType'] : ['sourceEntityId'],
      })
    }

    if (!values.endAt || !isTimezone(values.timezone)) return
    try {
      if (Date.parse(toTimestamp(values.endAt, values.timezone)) < Date.parse(toTimestamp(values.startAt, values.timezone))) {
        context.addIssue({ code: 'custom', message: 'End must be at or after the start', path: ['endAt'] })
      }
    } catch {
      context.addIssue({ code: 'custom', message: 'Enter a valid end date and time', path: ['endAt'] })
    }
  })

type CalendarFormValues = z.infer<typeof schema>

interface CalendarFormProps {
  record?: CalendarEvent
  initialStartAt?: string
  initialTimezone?: string
  cancelTo: string
  cancelState?: { from: string }
  saving: boolean
  onSave: (payload: CalendarPayload) => Promise<unknown>
}

function defaultValues(
  record?: CalendarEvent,
  initialStartAt?: string,
  initialTimezone?: string,
): CalendarFormValues {
  const timezone =
    record?.timezone ??
    (initialTimezone && isTimezone(initialTimezone) ? initialTimezone : browserTimezone())
  return {
    title: record?.title ?? '',
    type: record?.type ?? 'OTHER',
    startAt: record
      ? localInput(record.startAt, timezone)
      : initialStartAt
        ? localInput(initialStartAt, timezone)
        : '',
    endAt: record?.endAt ? localInput(record.endAt, timezone) : '',
    timezone,
    reminders: record?.reminders.join(', ') ?? '',
    sourceEntityType: record?.sourceEntityType ?? '',
    sourceEntityId: record?.sourceEntityId ?? '',
  }
}

function payloadFrom(values: CalendarFormValues, record?: CalendarEvent): CalendarPayload {
  const initial = defaultValues(record)
  const preserveStart = Boolean(record && values.timezone === record.timezone && values.startAt === initial.startAt)
  const preserveEnd = Boolean(record?.endAt && values.timezone === record.timezone && values.endAt === initial.endAt)

  return {
    title: values.title.trim(),
    type: values.type as CalendarEventType,
    startAt: preserveStart ? record!.startAt : toTimestamp(values.startAt, values.timezone),
    endAt: values.endAt
      ? preserveEnd
        ? record!.endAt
        : toTimestamp(values.endAt, values.timezone)
      : null,
    timezone: values.timezone,
    reminders: parseReminders(values.reminders) ?? [],
    sourceEntityType: values.sourceEntityType ? (values.sourceEntityType as CalendarSourceType) : null,
    sourceEntityId: values.sourceEntityId || null,
  }
}

export function CalendarForm({
  record,
  initialStartAt,
  initialTimezone,
  cancelTo,
  cancelState,
  saving,
  onSave,
}: CalendarFormProps) {
  const {
    control,
    formState: { errors, isDirty, isSubmitting },
    handleSubmit,
    register,
    reset,
    setError,
    setValue,
  } = useForm<CalendarFormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues(record, initialStartAt, initialTimezone),
  })

  const timezone = useWatch({ control, name: 'timezone' })
  const startAt = useWatch({ control, name: 'startAt' })
  const endAt = useWatch({ control, name: 'endAt' })
  const eventType = useWatch({ control, name: 'type' })
  const sourceType = useWatch({ control, name: 'sourceEntityType' })
  const sourceId = useWatch({ control, name: 'sourceEntityId' })
  const sourceKind = sourceType ? sourceKinds[sourceType as CalendarSourceType] : undefined
  const blocker = useBlocker(isDirty && !isSubmitting)

  useBeforeUnload(
    useCallback(
      (event) => {
        if (!isDirty || isSubmitting) return
        event.preventDefault()
      },
      [isDirty, isSubmitting],
    ),
  )

  let startPreview = 'Enter a start date and time'
  if (startAt && isTimezone(timezone)) {
    try {
      startPreview = displayDate(toTimestamp(startAt, timezone), timezone)
    } catch {
      startPreview = 'Enter a valid start date and time'
    }
  }

  const submit = handleSubmit(async (values) => {
    try {
      await onSave(payloadFrom(values, record))
      reset(values)
    } catch (error) {
      let mapped = false
      if (error instanceof ApiError) {
        for (const [field, messages] of Object.entries(error.details?.fieldErrors ?? {})) {
          if (field in values) {
            setError(field as keyof CalendarFormValues, {
              message: messages[0] ?? error.message,
            })
            mapped = true
          }
        }
      }
      if (!mapped) {
        setError('root', {
          message: error instanceof Error ? error.message : 'Unable to save this calendar event.',
        })
      }
    }
  })

  return (
    <>
      <form className="space-y-6" onSubmit={submit}>
        <div className="grid gap-5 rounded-2xl border bg-card p-5 shadow-sm md:grid-cols-2">
          <EditorField id="calendar-title" label="Title" error={errors.title?.message} wide>
            <Input id="calendar-title" autoFocus maxLength={200} disabled={saving} {...register('title')} />
          </EditorField>

          <EditorField id="calendar-type" label="Event type" error={errors.type?.message}>
            <ChoiceSelect
              id="calendar-type"
              aria-invalid={Boolean(errors.type)}
              aria-describedby="calendar-type-description"
              value={eventType}
              onChange={(value) => setValue('type', value as CalendarEventType, { shouldDirty: true })}
              options={calendarTypes.map((value) => ({ value, label: value.replaceAll('_', ' ') }))}
              disabled={saving}
            />
          </EditorField>

          <EditorField id="calendar-timezone" label="Timezone" error={errors.timezone?.message}>
            <TimezoneField
              id="calendar-timezone"
              label="Event timezone"
              aria-invalid={Boolean(errors.timezone)}
              aria-describedby="calendar-timezone-description"
              value={timezone}
              onChange={(value) => setValue('timezone', value, { shouldDirty: true })}
              disabled={saving}
            />
          </EditorField>

          <EditorField id="calendar-start" label="Starts" error={errors.startAt?.message}>
            <DateTimePicker
              id="calendar-start"
              label="Event start"
              value={startAt}
              onChange={(value) => setValue('startAt', value, { shouldDirty: true })}
              aria-invalid={Boolean(errors.startAt)}
              aria-describedby="calendar-start-description"
              disabled={saving}
            />
          </EditorField>

          <EditorField id="calendar-end" label="Ends (optional)" error={errors.endAt?.message}>
            <DateTimePicker
              id="calendar-end"
              label="Event end"
              value={endAt}
              onChange={(value) => setValue('endAt', value, { shouldDirty: true })}
              aria-invalid={Boolean(errors.endAt)}
              aria-describedby="calendar-end-description"
              disabled={saving}
            />
          </EditorField>

          <EditorField
            id="calendar-reminders"
            label="Reminder offsets"
            hint="Comma-separated minutes before the event, for example 15, 60, 1440."
            error={errors.reminders?.message}
            wide
          >
            <Input
              id="calendar-reminders"
              inputMode="numeric"
              placeholder="15, 60"
              disabled={saving}
              aria-invalid={Boolean(errors.reminders)}
              aria-describedby="calendar-reminders-description"
              {...register('reminders')}
            />
          </EditorField>
        </div>

        <div className="grid gap-5 rounded-2xl border bg-card p-5 shadow-sm md:grid-cols-2">
          <div className="md:col-span-2">
            <p className="text-sm font-semibold">Linked source</p>
            <p className="mt-1 text-sm text-muted-foreground">Keep this event standalone, or connect it to a CRM record.</p>
          </div>

          <EditorField id="calendar-source-type" label="Source type" error={errors.sourceEntityType?.message}>
            <ChoiceSelect
              id="calendar-source-type"
              aria-invalid={Boolean(errors.sourceEntityType)}
              aria-describedby="calendar-source-type-description"
              value={sourceType}
              onChange={(value) => {
                setValue('sourceEntityType', value as CalendarSourceType | '', { shouldDirty: true })
                setValue('sourceEntityId', '', { shouldDirty: true })
              }}
              options={[
                { value: '', label: 'Standalone event' },
                ...calendarSourceTypes.map((value) => ({ value, label: value.replaceAll('_', ' ') })),
              ]}
              disabled={saving}
            />
          </EditorField>

          <EditorField id="calendar-source-id" label="Source record" error={errors.sourceEntityId?.message}>
            {sourceKind ? (
              <RecordPicker
                kind={sourceKind}
                id="calendar-source-id"
                label="Source record"
                value={sourceId}
                onChange={(value) => setValue('sourceEntityId', value, { shouldDirty: true })}
                invalid={Boolean(errors.sourceEntityId)}
                describedBy="calendar-source-id-description"
                disabled={saving}
              />
            ) : (
              <Input id="calendar-source-id" value="" placeholder="Choose a source type first" disabled />
            )}
          </EditorField>
        </div>

        <div className="rounded-2xl border border-dashed bg-muted/30 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Calendar preview</p>
          <p className="mt-2 font-medium">{startPreview}</p>
          <p className="mt-1 text-sm text-muted-foreground">{timezone || 'No timezone selected'}</p>
        </div>

        <FormError error={errors.root?.message} />

        <div className="flex flex-wrap justify-end gap-3">
          <Button asChild variant="outline" disabled={saving}>
            <Link to={cancelTo} state={cancelState}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : record ? 'Save event' : 'Create event'}
          </Button>
        </div>
      </form>

      <Dialog open={blocker.state === 'blocked'} onOpenChange={(open) => !open && blocker.reset?.()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discard unsaved changes?</DialogTitle>
            <DialogDescription>Your calendar edits have not been saved.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => blocker.reset?.()}>Keep editing</Button>
            <Button variant="destructive" onClick={() => blocker.proceed?.()}>Discard changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
