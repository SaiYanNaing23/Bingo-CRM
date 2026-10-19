import { useEffect, useRef, useState } from 'react'
import {
  Scheduler,
  type CalendarEvent as CalendarKitEvent,
  type CalendarTheme,
  type ViewType,
} from 'calendarkit-pro'
import { Bell, Pencil, Search, Trash2 } from 'lucide-react'
import { Link, NavLink, useLocation, useNavigate, useParams, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ChoiceSelect } from '@/components/shared/choice-select'
import { DateTimePicker } from '@/components/shared/date-time-picker'
import { Pagination } from '@/components/shared/record-table'
import { EmptyState, ErrorState, FormError, Loading, PageHeader } from '@/components/shared/states'
import { TimezoneField } from '@/components/shared/timezone-field'
import { safeReturnPath } from '@/lib/api-client'
import { browserTimezone, displayDate, localInput, toTimestamp } from '@/lib/dates'
import { friendly } from '@/lib/fields'
import { useDebounced } from '@/lib/use-debounced'
import { useTheme } from '@/features/settings/theme-context'
import {
  useCalendarEvent,
  useCalendarRange,
  useCalendarReminders,
  useDeleteCalendarEvent,
  useRescheduleCalendarEvent,
  useSaveCalendarEvent,
} from './api'
import { CalendarForm } from './calendar-form'
import {
  calendarRangeViews,
  calendarTypes,
  type CalendarEvent,
  type CalendarSourceType,
} from './types'

type CalendarPageView = 'list' | 'range' | 'reminders' | 'detail' | 'edit'
type CalendarDisplayView = Extract<ViewType, 'month' | 'week' | 'day'>

const sourceRoutes: Record<CalendarSourceType, string> = {
  COMPANY: 'companies',
  CONTACT: 'contacts',
  APPLICATION: 'applications',
  TASK: 'tasks',
  PROJECT: 'projects',
}

const calendarKitTheme: CalendarTheme = {
  colors: {
    primary: 'var(--primary)',
    secondary: 'var(--secondary)',
    background: 'var(--background)',
    foreground: 'var(--foreground)',
    border: 'var(--border)',
    muted: 'var(--muted)',
    accent: 'var(--accent)',
  },
  fontFamily: 'inherit',
  borderRadius: 'var(--radius)',
}

function positiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function currentDate(timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return value.year + '-' + value.month + '-' + value.day
}

function dateValue(date: Date) {
  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return year + '-' + month + '-' + day
}

function calendarDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day, 12)
}

function returnPath(state: unknown) {
  const from =
    state && typeof state === 'object' && 'from' in state
      ? (state as { from?: unknown }).from
      : undefined
  return safeReturnPath(from, '/calendar')
}

function stateString(state: unknown, key: string) {
  if (!state || typeof state !== 'object' || !(key in state)) return undefined
  const value = (state as Record<string, unknown>)[key]
  return typeof value === 'string' ? value : undefined
}

function eventTime(event: CalendarEvent) {
  const start = displayDate(event.startAt, event.timezone)
  return event.endAt ? start + ' to ' + displayDate(event.endAt, event.timezone) : start
}

function toCalendarKitEvent(event: CalendarEvent): CalendarKitEvent {
  const start = new Date(event.startAt)
  return {
    id: event.id,
    title: event.title,
    start,
    end: event.endAt ? new Date(event.endAt) : new Date(start.getTime() + 30 * 60_000),
    description: friendly(event.type) + ' - ' + event.timezone,
    calendarId: event.type,
  }
}

function CalendarTabs() {
  const tabClass = ({ isActive }: { isActive: boolean }) =>
    'rounded-full px-4 py-2 text-sm font-medium transition ' +
    (isActive
      ? 'bg-foreground text-background'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground')

  return (
    <nav
      className="flex flex-wrap gap-2 rounded-2xl border bg-card p-2 shadow-sm"
      aria-label="Calendar views"
    >
      <NavLink end to="/calendar" className={tabClass}>
        Events
      </NavLink>
      <NavLink to="/calendar/range" className={tabClass}>
        Agenda
      </NavLink>
      <NavLink to="/calendar/reminders" className={tabClass}>
        Reminders
      </NavLink>
    </nav>
  )
}

function CalendarKitCreateBridge({
  isOpen,
  onClose,
  event,
  initialDate,
  from,
  timezone,
}: {
  isOpen: boolean
  onClose: () => void
  event?: CalendarKitEvent | null
  initialDate?: Date
  from: string
  timezone: string
}) {
  const navigate = useNavigate()
  const initialStartAt = initialDate?.toISOString()

  useEffect(() => {
    if (!isOpen) return
    onClose()
    if (event?.id) return
    navigate('/calendar/new', {
      state: {
        from,
        initialStartAt,
        initialTimezone: timezone,
      },
    })
  }, [event?.id, from, initialStartAt, isOpen, navigate, onClose, timezone])

  return null
}

function CalendarSchedulerPage({ agenda = false }: { agenda?: boolean }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { resolvedMode } = useTheme()
  const timezone = params.get('timezone') || browserTimezone()
  const date = /^\d{4}-\d{2}-\d{2}$/.test(params.get('date') ?? '')
    ? params.get('date')!
    : currentDate(timezone)
  const requestedView = params.get('view')
  const view: CalendarDisplayView =
    requestedView === 'day' || requestedView === 'week' || requestedView === 'month'
      ? requestedView
      : 'month'
  const requestedRange = params.get('range')
  const agendaRange =
    calendarRangeViews.find((value) => value === requestedRange) ?? 'month'
  const backendView = agenda ? agendaRange : view
  const type = calendarTypes.find((value) => value === params.get('type'))
  const search = params.get('search') ?? ''
  const debouncedSearch = useDebounced(search, 250)
  const page = positiveInteger(params.get('page'), 1)
  const range = useCalendarRange({
    view: backendView,
    date,
    timezone,
    type,
    search: debouncedSearch || undefined,
    page,
    limit: 100,
  })
  const reschedule = useRescheduleCalendarEvent()
  const from = location.pathname + location.search
  const events = range.data?.data.events ?? []
  const calendarEvents = events.map(toCalendarKitEvent)

  const setFilter = (key: string, value?: string) => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (value) next.set(key, value)
        else next.delete(key)
        if (key !== 'page') next.delete('page')
        return next
      },
      { replace: true },
    )
  }

  const persistTime = async (
    kitEvent: CalendarKitEvent,
    startAt: Date,
    endAt: Date,
    resized: boolean,
  ) => {
    const source = events.find((event) => event.id === kitEvent.id)
    if (!source) return

    try {
      await reschedule.mutateAsync({
        id: source.id,
        payload: {
          startAt: startAt.toISOString(),
          endAt: resized || source.endAt ? endAt.toISOString() : null,
          timezone,
        },
      })
      toast.success(resized ? 'Event duration updated' : 'Event rescheduled')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to reschedule this event.')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={agenda ? 'Agenda' : 'Events'}
        description={
          agenda
            ? 'Review your selected planning range in a chronological CalendarKit agenda.'
            : 'Plan interviews, follow-ups, deadlines, and commitments on an interactive calendar.'
        }
      />
      <CalendarTabs />

      <div className="grid gap-3 rounded-2xl border bg-card p-4 shadow-sm md:grid-cols-2 xl:grid-cols-4">
        {agenda ? (
          <ChoiceSelect
            aria-label="Agenda range"
            value={agendaRange}
            onChange={(value) => setFilter('range', value)}
            options={calendarRangeViews.map((value) => ({
              value,
              label: friendly(value) + ' agenda',
            }))}
          />
        ) : (
          <ChoiceSelect
            aria-label="Calendar view"
            value={view}
            onChange={(value) => setFilter('view', value)}
            options={[
              { value: 'month', label: 'Month view' },
              { value: 'week', label: 'Week view' },
              { value: 'day', label: 'Day view' },
            ]}
          />
        )}

        <label className="relative">
          <span className="sr-only">Search calendar events</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setFilter('search', event.target.value)}
            placeholder="Search events"
            className="pl-9"
          />
        </label>

        <TimezoneField
          label={agenda ? 'Agenda timezone' : 'Calendar timezone'}
          value={timezone}
          onChange={(value) => setFilter('timezone', value)}
        />

        <ChoiceSelect
          aria-label="Event type"
          value={type ?? ''}
          onChange={(value) => setFilter('type', value)}
          options={[
            { value: '', label: 'All event types' },
            ...calendarTypes.map((value) => ({ value, label: friendly(value) })),
          ]}
        />
      </div>

      {range.isError ? <ErrorState error={range.error} retry={() => range.refetch()} /> : null}
      {!range.isError ? (
        <div className="min-h-[680px] overflow-hidden rounded-2xl border bg-card shadow-sm">
          <Scheduler
            events={calendarEvents}
            view={agenda ? 'agenda' : view}
            date={calendarDate(date)}
            onDateChange={(value) => setFilter('date', dateValue(value))}
            timezone={timezone}
            onTimezoneChange={(value) => setFilter('timezone', value)}
            theme={calendarKitTheme}
            isDarkMode={resolvedMode === 'dark'}
            isLoading={range.isPending || range.isFetching}
            hideViewSwitcher
            onEventClick={(event) =>
              navigate('/calendar/' + event.id, { state: { from } })
            }
            onEventDrop={(event, startAt, endAt) =>
              void persistTime(event, startAt, endAt, false)
            }
            onEventResize={(event, startAt, endAt) =>
              void persistTime(event, startAt, endAt, true)
            }
            onEventDelete={(eventId) =>
              navigate('/calendar/' + eventId, { state: { from } })
            }
            renderEventForm={(props) => (
              <CalendarKitCreateBridge
                isOpen={props.isOpen}
                onClose={props.onClose}
                event={props.event}
                initialDate={props.initialDate}
                from={from}
                timezone={timezone}
              />
            )}
          />
        </div>
      ) : null}

      {range.data && range.data.data.meta.totalPages > 1 ? (
        <div className="rounded-2xl border bg-card shadow-sm">
          <Pagination
            meta={range.data.data.meta}
            busy={range.isFetching}
            onPage={(value) => setFilter('page', String(value))}
          />
        </div>
      ) : null}
    </div>
  )
}

function CalendarRemindersPage() {
  const location = useLocation()
  const [params, setParams] = useSearchParams()
  const initialWindow = useRef({
    from: new Date().toISOString(),
    to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  })
  const from = params.get('from') || initialWindow.current.from
  const to = params.get('to') || initialWindow.current.to
  const timezone = params.get('timezone') || browserTimezone()
  const page = positiveInteger(params.get('page'), 1)
  const limit = positiveInteger(params.get('limit'), 50)
  const [draftFrom, setDraftFrom] = useState(() => localInput(from, timezone))
  const [draftTo, setDraftTo] = useState(() => localInput(to, timezone))
  const [windowError, setWindowError] = useState<string>()
  const reminders = useCalendarReminders({ from, to, page, limit })
  const returnTo = location.pathname + location.search

  const setPage = (value: number) => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.set('page', String(value))
        return next
      },
      { replace: true },
    )
  }

  const applyWindow = () => {
    try {
      const nextFrom = toTimestamp(draftFrom, timezone)
      const nextTo = toTimestamp(draftTo, timezone)
      const duration = Date.parse(nextTo) - Date.parse(nextFrom)
      if (duration <= 0) {
        setWindowError('The window end must be after its start.')
        return
      }
      if (duration > 31 * 24 * 60 * 60 * 1000) {
        setWindowError('Reminder windows can cover at most 31 days.')
        return
      }

      setWindowError(undefined)
      setParams(
        (current) => {
          const next = new URLSearchParams(current)
          next.set('from', nextFrom)
          next.set('to', nextTo)
          next.set('timezone', timezone)
          next.delete('page')
          return next
        },
        { replace: true },
      )
    } catch {
      setWindowError('Enter a valid reminder window.')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reminder queue"
        description="See every reminder that will become due inside a focused planning window."
      />
      <CalendarTabs />

      <div className="grid gap-4 rounded-2xl border bg-card p-4 shadow-sm lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
        <DateTimePicker label="Window starts" value={draftFrom} onChange={setDraftFrom} />
        <DateTimePicker label="Window ends" value={draftTo} onChange={setDraftTo} />
        <TimezoneField
          label="Reminder display timezone"
          value={timezone}
          onChange={(value) => {
            setDraftFrom(localInput(from, value))
            setDraftTo(localInput(to, value))
            setParams(
              (current) => {
                const next = new URLSearchParams(current)
                next.set('timezone', value)
                return next
              },
              { replace: true },
            )
          }}
        />
        <Button onClick={applyWindow}>Apply window</Button>
      </div>
      <FormError error={windowError} />

      {reminders.isPending ? <Loading /> : null}
      {reminders.isError ? (
        <ErrorState error={reminders.error} retry={() => reminders.refetch()} />
      ) : null}
      {reminders.data && reminders.data.data.length === 0 ? (
        <EmptyState
          title="No reminders due"
          description="No reminder offsets land inside this window."
        />
      ) : null}
      {reminders.data?.data.length ? (
        <div className="space-y-3">
          {reminders.data.data.map((reminder) => (
            <Link
              key={reminder.id}
              to={'/calendar/' + reminder.eventId}
              state={{ from: returnTo }}
              className="grid gap-3 rounded-2xl border bg-card p-5 shadow-sm transition hover:border-foreground/25 md:grid-cols-[auto_1fr_auto] md:items-center"
            >
              <div className="grid size-11 place-items-center rounded-xl bg-muted">
                <Bell className="size-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{reminder.title}</h2>
                  <Badge variant="secondary">{friendly(reminder.type)}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Remind {reminder.minutesBefore} minutes before the event
                </p>
              </div>
              <p className="text-sm font-medium md:text-right">
                {displayDate(reminder.remindAt, reminder.timezone)}
              </p>
            </Link>
          ))}
        </div>
      ) : null}
      {reminders.data ? (
        <Pagination meta={reminders.data.meta} busy={reminders.isFetching} onPage={setPage} />
      ) : null}
    </div>
  )
}

function CalendarDetailPage() {
  const { id = '' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const eventQuery = useCalendarEvent(id)
  const remove = useDeleteCalendarEvent()
  const [confirming, setConfirming] = useState(false)
  const from = returnPath(location.state)

  if (eventQuery.isPending) return <Loading />
  if (eventQuery.isError) {
    return <ErrorState error={eventQuery.error} retry={() => eventQuery.refetch()} />
  }

  const event = eventQuery.data.data
  const sourcePath =
    event.sourceEntityType && event.sourceEntityId
      ? '/' + sourceRoutes[event.sourceEntityType] + '/' + event.sourceEntityId
      : undefined

  const deleteEvent = async () => {
    try {
      await remove.mutateAsync(event.id)
      toast.success('Calendar event deleted')
      navigate(from, { replace: true })
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to delete this calendar event.',
      )
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={event.title}
        description={eventTime(event)}
        back={from}
        action={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to={'/calendar/' + event.id + '/edit'} state={{ from }}>
                <Pencil className="size-4" />
                Edit
              </Link>
            </Button>
            <Button variant="destructive" onClick={() => setConfirming(true)}>
              <Trash2 className="size-4" />
              Delete
            </Button>
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <h2 className="font-semibold">Schedule</h2>
          <dl className="mt-4 grid gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Starts</dt>
              <dd className="mt-1 font-medium">{displayDate(event.startAt, event.timezone)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Ends</dt>
              <dd className="mt-1 font-medium">
                {event.endAt ? displayDate(event.endAt, event.timezone) : 'No end time'}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Timezone</dt>
              <dd className="mt-1 font-medium">{event.timezone}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <h2 className="font-semibold">Context</h2>
          <div className="mt-4 space-y-4 text-sm">
            <div>
              <p className="text-muted-foreground">Event type</p>
              <Badge className="mt-2" variant="secondary">
                {friendly(event.type)}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground">Reminders</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {event.reminders.length ? (
                  event.reminders.map((minutes) => (
                    <Badge key={minutes} variant="secondary">
                      {minutes} min before
                    </Badge>
                  ))
                ) : (
                  <span className="font-medium">No reminders</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-muted-foreground">Linked source</p>
              {!event.sourceEntityType ? (
                <p className="mt-1 font-medium">Standalone event</p>
              ) : null}
              {event.sourceEntityType && event.sourceAvailable === false ? (
                <p className="mt-1 font-medium">
                  {friendly(event.sourceEntityType)} record is unavailable
                </p>
              ) : null}
              {sourcePath && event.sourceAvailable !== false ? (
                <Button asChild variant="outline" className="mt-2">
                  <Link to={sourcePath}>Open {friendly(event.sourceEntityType!)}</Link>
                </Button>
              ) : null}
            </div>
          </div>
        </section>
      </div>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this calendar event?</DialogTitle>
            <DialogDescription>
              This removes the event and its reminder schedule. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirming(false)}
              disabled={remove.isPending}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteEvent} disabled={remove.isPending}>
              {remove.isPending ? 'Deleting...' : 'Delete event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CalendarEditPage() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const eventQuery = useCalendarEvent(id)
  const save = useSaveCalendarEvent(id)
  const from = returnPath(location.state)
  const creating = !id
  const initialStartAt = stateString(location.state, 'initialStartAt')
  const initialTimezone = stateString(location.state, 'initialTimezone')

  if (!creating && eventQuery.isPending) return <Loading />
  if (!creating && eventQuery.isError) {
    return <ErrorState error={eventQuery.error} retry={() => eventQuery.refetch()} />
  }

  const record = creating ? undefined : eventQuery.data?.data
  const cancelTo = creating ? from : '/calendar/' + id

  return (
    <div className="space-y-6">
      <PageHeader
        title={creating ? 'New event' : 'Edit event'}
        description={
          creating
            ? 'Place a new commitment on your timeline.'
            : 'Update timing, reminders, or linked context.'
        }
        back={cancelTo}
        backState={creating ? undefined : { from }}
      />
      <CalendarForm
        record={record}
        initialStartAt={creating ? initialStartAt : undefined}
        initialTimezone={creating ? initialTimezone : undefined}
        cancelTo={cancelTo}
        cancelState={creating ? undefined : { from }}
        saving={save.isPending}
        onSave={async (payload) => {
          const result = await save.mutateAsync(payload)
          toast.success(creating ? 'Calendar event created' : 'Calendar event updated')
          navigate('/calendar/' + result.data.id, {
            replace: true,
            state: { from },
          })
        }}
      />
    </div>
  )
}

export default function CalendarPages({ view }: { view: CalendarPageView }) {
  if (view === 'range') return <CalendarSchedulerPage agenda />
  if (view === 'reminders') return <CalendarRemindersPage />
  if (view === 'detail') return <CalendarDetailPage />
  if (view === 'edit') return <CalendarEditPage />
  return <CalendarSchedulerPage />
}
