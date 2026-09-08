import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Check, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChoiceSelect } from './choice-select'
import { DateTimePicker } from './date-time-picker'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import { useWrite, valueOf, type Entity } from '@/lib/resources'
import { request } from '@/lib/api-client'
import { queryClient } from '@/lib/query-client'
import { friendly, type ResourceConfig } from '@/lib/fields'
import { browserTimezone, localInput, toTimestamp } from '@/lib/dates'
import type { Success } from '@/lib/api-types'
import { needsDate, stages } from '@/features/applications/types'
import type { Completion } from '@/features/tasks/types'
import { FormError, Pending } from './states'

export function RecordActions({
  config,
  record,
  from,
}: {
  config: ResourceConfig
  record: Entity
  from: string
}) {
  const [action, setAction] = useState<'delete' | 'stage' | 'follow-up' | null>(null)
  const [stage, setStage] = useState(String(valueOf(record, 'stage') || 'APPLIED'))
  const [date, setDate] = useState('')
  const zone = String(valueOf(record, 'timezone') || browserTimezone())
  const [last, setLast] = useState(localInput(valueOf(record, 'lastContactAt') as string, zone))
  const [next, setNext] = useState(localInput(valueOf(record, 'nextFollowUpAt') as string, zone))
  const [completion, setCompletion] = useState<Completion | null>(null)
  const [error, setError] = useState<unknown>(null)
  const navigate = useNavigate()
  const status = valueOf(record, 'status')
  const path = `/${config.kind}/${record.id}`
  const writer = useWrite(
    async ({
      suffix = '',
      method = 'PATCH',
      body,
    }: {
      suffix?: string
      method?: string
      body?: unknown
    }) => request<Success<unknown>>(path + suffix, { method, body }),
  )
  const execute = async (work: () => Promise<unknown>, message: string) => {
    setError(null)
    try {
      await work()
      toast.success(message)
      setAction(null)
    } catch (error) {
      setError(error)
    }
  }
  const open = (action: 'delete' | 'stage' | 'follow-up') => {
    setError(null)
    setStage(String(valueOf(record, 'stage') || 'APPLIED'))
    setLast(localInput(valueOf(record, 'lastContactAt') as string, zone))
    setNext(localInput(valueOf(record, 'nextFollowUpAt') as string, zone))
    setDate('')
    setAction(action)
  }
  const stageWriter = useWrite(async () => {
    if (needsDate(stage) && !valueOf(record, 'dateApplied')) {
      await request(path, { method: 'PUT', body: { dateApplied: toTimestamp(date, zone) } })
      await queryClient.invalidateQueries({ queryKey: ['crm'] })
      try {
        return await request(`${path}/stage`, { method: 'PATCH', body: { stage } })
      } catch (error) {
        throw new Error(
          `The application date was saved, but the stage change failed. ${(error as Error).message}`,
        )
      }
    }
    return request(`${path}/stage`, { method: 'PATCH', body: { stage } })
  })
  const pending = writer.isPending || stageWriter.isPending
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {!(config.kind === 'tasks' && status === 'COMPLETED') && (
          <Button variant="outline" asChild>
            <Link to={`${path}/edit`} state={{ from }}>
              <Pencil className="size-4" />
              Edit
            </Link>
          </Button>
        )}
        {config.kind === 'companies' && (
          <Button
            variant="outline"
            disabled={pending}
            onClick={() =>
              void execute(
                () =>
                  writer.mutateAsync({
                    suffix: '/status',
                    body: { status: status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE' },
                  }),
                status === 'ACTIVE' ? 'Company archived' : 'Company reactivated',
              )
            }
          >
            {status === 'ACTIVE' ? 'Archive company' : 'Reactivate company'}
          </Button>
        )}
        {config.kind === 'applications' && (
          <Button disabled={pending} onClick={() => open('stage')}>
            Change stage
          </Button>
        )}
        {config.kind === 'contacts' && (
          <Button disabled={pending} onClick={() => open('follow-up')}>
            Update follow-up
          </Button>
        )}
        {config.kind === 'tasks' &&
          status !== 'COMPLETED' &&
          (status === 'CANCELLED' ? (
            <Button
              disabled={pending}
              onClick={() =>
                void execute(
                  () => writer.mutateAsync({ method: 'PUT', body: { status: 'TODO' } }),
                  'Task reopened',
                )
              }
            >
              Reopen task
            </Button>
          ) : (
            <Button
              disabled={pending}
              onClick={() =>
                void execute(async () => {
                  const result = await writer.mutateAsync({ suffix: '/complete', body: {} })
                  setCompletion(result.data as Completion)
                }, 'Task completed')
              }
            >
              <Check className="size-4" />
              {pending ? 'Completing…' : 'Complete task'}
            </Button>
          ))}
        <Button
          variant="ghost"
          className="text-destructive hover:text-destructive"
          disabled={pending}
          onClick={() => open('delete')}
        >
          <Trash2 className="size-4" />
          Delete
        </Button>
      </div>
      {!action && <FormError error={error} />}
      {completion?.nextTask && (
        <div role="status" className="success-notice rounded-md border px-4 py-3 text-sm">
          Your next occurrence is ready.{' '}
          <Link className="font-medium underline" to={`/tasks/${completion.nextTask.id}`}>
            Open next task
          </Link>
        </div>
      )}
      <Dialog
        open={!!action}
        onOpenChange={(open) => {
          if (!open && !pending) setAction(null)
        }}
      >
        <DialogContent>
          <DialogTitle>
            {action === 'delete'
              ? `Delete this ${config.singular}?`
              : action === 'stage'
                ? 'Change application stage'
                : 'Update follow-up dates'}
          </DialogTitle>
          <DialogDescription>
            {action === 'delete'
              ? 'This record will be removed from your workspace. Linked records are not deleted by this action.'
              : `Dates below use ${zone}.`}
          </DialogDescription>
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault()
              if (pending) return
              void execute(
                async () => {
                  if (action === 'delete') {
                    await writer.mutateAsync({ method: 'DELETE' })
                    navigate(from, { replace: true })
                  }
                  if (action === 'stage') await stageWriter.mutateAsync()
                  if (action === 'follow-up')
                    await writer.mutateAsync({
                      suffix: '/follow-up',
                      body: {
                        lastContactAt: toTimestamp(last, zone),
                        nextFollowUpAt: toTimestamp(next, zone),
                      },
                    })
                },
                action === 'delete' ? 'Record deleted' : 'Changes saved',
              )
            }}
            className="space-y-4"
          >
            {action === 'stage' && (
              <>
                <Label htmlFor="next-stage">Stage</Label>
                <ChoiceSelect
                  id="next-stage"
                  value={stage}
                  onChange={setStage}
                  disabled={pending}
                  options={stages.map((value) => ({ value, label: friendly(value) }))}
                />
                {needsDate(stage) && !valueOf(record, 'dateApplied') && (
                  <div>
                    <Label htmlFor="stage-date" className="mb-2 block">
                      Date applied
                    </Label>
                    <DateTimePicker
                      id="stage-date"
                      label="Date applied"
                      disabled={pending}
                      value={date}
                      onChange={setDate}
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      Add the application date before moving to this stage.
                    </p>
                  </div>
                )}
              </>
            )}
            {action === 'follow-up' && (
              <>
                <div>
                  <Label htmlFor="follow-last" className="mb-2 block">
                    Last contacted
                  </Label>
                  <DateTimePicker
                    id="follow-last"
                    label="Last contacted"
                    disabled={pending}
                    value={last}
                    onChange={setLast}
                  />
                </div>
                <div>
                  <Label htmlFor="follow-next" className="mb-2 block">
                    Next follow-up
                  </Label>
                  <DateTimePicker
                    id="follow-next"
                    label="Next follow-up"
                    disabled={pending}
                    value={next}
                    onChange={setNext}
                  />
                </div>
              </>
            )}
            <FormError error={error} />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => setAction(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={pending}
                variant={action === 'delete' ? 'destructive' : 'default'}
              >
                {pending ? (
                  <Pending>Saving…</Pending>
                ) : action === 'delete' ? (
                  'Delete record'
                ) : (
                  'Save changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
