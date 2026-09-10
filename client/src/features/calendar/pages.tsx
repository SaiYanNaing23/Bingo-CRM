import { useRef, useState } from 'react'
import { Bell, CalendarDays, Clock3, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Link, NavLink, useLocation, useNavigate, useParams, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
import {
  useCalendarEvent,
  useCalendarEvents,
  useCalendarRange,
  useCalendarReminders,
  useDeleteCalendarEvent,
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

const sourceRoutes: Record<CalendarSourceType, string> = {
  COMPANY: 'companies',
  CONTACT: 'contacts',
  APPLICATION: 'applications',
  TASK: 'tasks',
  PROJECT: 'projects',
}

function positiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function currentDate() {
  return new Date().toISOString().slice(0, 10)
}

function returnPath(state: unknown) {
  const from = state && typeof state === 'object' && 'from' in state
    ? (state as { from?: unknown }).from
    : undefined
  return safeReturnPath(from, '/calendar')
}

function eventTime(event: CalendarEvent) {
  const start = displayDate(event.startAt, event.timezone)
  return event.endAt ? start + ' to ' + displayDate(event.endAt, event.timezone) : start
}

function dayKey(timestamp: string, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(timestamp))
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return value.year + '-' + value.month + '-' + value.day
}

function dayLabel(timestamp: string, timezone: string) {
  return new Intl.DateTimeFormat(undefined, {
    timeZone: timezone,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(timestamp))
}

function CalendarTabs() {
  const tabClass = ({ isActive }: { isActive: boolean }) =>
    'rounded-full px-4 py-2 text-sm font-medium transition ' +
    (isActive ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted hover:text-foreground')

  return (
    <nav className="flex flex-wrap gap-2 rounded-2xl border bg-card p-2 shadow-sm" aria-label="Calendar views">
      <NavLink end to="/calendar" className={tabClass}>Events</NavLink>
      <NavLink to="/calendar/range" className={tabClass}>Agenda</NavLink>
      <NavLink to="/calendar/reminders" className={tabClass}>Reminders</NavLink>
    </nav>
  )
}

function EventCard({ event, from }: { event: CalendarEvent; from: string }) {
  return (
    <Link
      to={'/calendar/' + event.id}
      state={{ from }}
      className="group grid gap-3 rounded-2xl border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-md md:grid-cols-[1fr_auto]"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate text-base font-semibold group-hover:underline">{event.title}</h2>
          <Badge variant="secondary">{friendly(event.type)}</Badge>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{eventTime(event)}</p>
        {event.sourceEntityType ? (
          <p className="mt-1 text-xs text-muted-foreground">
            {friendly(event.sourceEntityType)} source
            {event.sourceAvailable === false ? ' is unavailable' : ''}
          </p>
        ) : null}
      </div>
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground md:justify-end">
        <Clock3 className="size-4" />
        {event.timezone}
      </div>
    </Link>
  )
}

function CalendarListPage() {
  const location = useLocation()
  const [params, setParams] = useSearchParams()
  const search = params.get('search') ?? ''
  const debouncedSearch = useDebounced(search, 250)
  const type = calendarTypes.find((value) => value === params.get('type'))
  const page = positiveInteger(params.get('page'), 1)
  const limit = positiveInteger(params.get('limit'), 20)
  const sortByParam = params.get('sortBy')
  const sortBy = ['startAt', 'title', 'createdAt', 'updatedAt'].includes(sortByParam ?? '')
    ? sortByParam!
    : 'startAt'
  const order = params.get('order') === 'desc' ? 'desc' : 'asc'
  const events = useCalendarEvents({
    search: debouncedSearch || undefined,
    type,
    page,
    limit,
    sortBy,
    order,
  })
  const from = location.pathname + location.search

  const setFilter = (key: string, value?: string) => {
    setParams((current) => {
      const next = new URLSearchParams(current)
      if (value) next.set(key, value)
      else next.delete(key)
      if (key !== 'page') next.delete('page')
      return next
    }, { replace: true })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Events"
        description="Keep interviews, follow-ups, deadlines, and standalone commitments in one timeline."
        action={
          <Button asChild>
            <Link to="/calendar/new" state={{ from }}>
              <Plus className="size-4" />
              New event
            </Link>
          </Button>
        }
      />
      <CalendarTabs />

      <div className="grid gap-3 rounded-2xl border bg-card p-4 shadow-sm lg:grid-cols-[minmax(16rem,1fr)_13rem_12rem_9rem]">
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
        <ChoiceSelect
          value={type ?? ''}
          onChange={(value) => setFilter('type', value)}
          options={[
            { value: '', label: 'All event types' },
            ...calendarTypes.map((value) => ({ value, label: friendly(value) })),
          ]}
        />
        <ChoiceSelect
          value={sortBy}
          onChange={(value) => setFilter('sortBy', value)}
          options={[
            { value: 'startAt', label: 'Sort by start' },
            { value: 'title', label: 'Sort by title' },
            { value: 'createdAt', label: 'Sort by created' },
            { value: 'updatedAt', label: 'Sort by updated' },
          ]}
        />
        <ChoiceSelect
          value={order}
          onChange={(value) => setFilter('order', value)}
          options={[
            { value: 'asc', label: 'Ascending' },
            { value: 'desc', label: 'Descending' },
          ]}
        />
      </div>

      {events.isPending ? <Loading /> : null}
      {events.isError ? <ErrorState error={events.error} retry={() => events.refetch()} /> : null}
      {events.data && events.data.data.length === 0 ? (
        <EmptyState
          title="No calendar events found"
          description={search || type ? 'Try clearing a filter.' : 'Create an event to start building your agenda.'}
          action={
            <Button asChild>
              <Link to="/calendar/new" state={{ from }}>Create event</Link>
            </Button>
          }
        />
      ) : null}
      {events.data?.data.length ? (
        <div className="space-y-3">
          {events.data.data.map((event) => <EventCard key={event.id} event={event} from={from} />)}
        </div>
      ) : null}
      {events.data ? (
        <Pagination
          meta={events.data.meta}
          busy={events.isFetching}
          onPage={(value) => setFilter('page', String(value))}
        />
      ) : null}
    </div>
  )
}

function CalendarRangePage() {
  const location = useLocation()
  const [params, setParams] = useSearchParams()
  const view = calendarRangeViews.find((value) => value === params.get('view')) ?? 'week'
  const date = /^\d{4}-\d{2}-\d{2}$/.test(params.get('date') ?? '') ? params.get('date')! : currentDate()
  const timezone = params.get('timezone') || browserTimezone()
  const type = calendarTypes.find((value) => value === params.get('type'))
  const page = positiveInteger(params.get('page'), 1)
  const limit = positiveInteger(params.get('limit'), 50)
  const range = useCalendarRange({ view, date, timezone, type, page, limit })
  const from = location.pathname + location.search

  const setFilter = (key: string, value?: string) => {
    setParams((current) => {
      const next = new URLSearchParams(current)
      if (value) next.set(key, value)
      else next.delete(key)
      if (key !== 'page') next.delete('page')
      return next
    }, { replace: true })
  }

  const groups = new Map<string, CalendarEvent[]>()
  for (const event of range.data?.data.events ?? []) {
    const key = dayKey(event.startAt, timezone)
    groups.set(key, [...(groups.get(key) ?? []), event])
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda"
        description="Scan a day, week, or month in the timezone where you plan to act."
        action={
          <Button asChild>
            <Link to="/calendar/new" state={{ from }}>
              <Plus className="size-4" />
              New event
            </Link>
          </Button>
        }
      />
      <CalendarTabs />

      <div className="grid gap-3 rounded-2xl border bg-card p-4 shadow-sm md:grid-cols-2 xl:grid-cols-4">
        <ChoiceSelect
          value={view}
          onChange={(value) => setFilter('view', value)}
          options={calendarRangeViews.map((value) => ({ value, label: friendly(value) }))}
        />
        <Input type="date" value={date} onChange={(event) => setFilter('date', event.target.value)} />
        <TimezoneField label="Agenda timezone" value={timezone} onChange={(value) => setFilter('timezone', value)} />
        <ChoiceSelect
          value={type ?? ''}
          onChange={(value) => setFilter('type', value)}
          options={[
            { value: '', label: 'All event types' },
            ...calendarTypes.map((value) => ({ value, label: friendly(value) })),
          ]}
        />
      </div>

      {range.data ? (
        <div className="rounded-2xl border border-dashed bg-muted/30 px-5 py-4 text-sm text-muted-foreground">
          Showing {displayDate(range.data.data.range.from, timezone)} through{' '}
          {displayDate(range.data.data.range.to, timezone)} in {timezone}.
        </div>
      ) : null}
      {range.isPending ? <Loading /> : null}
      {range.isError ? <ErrorState error={range.error} retry={() => range.refetch()} /> : null}
      {range.data && range.data.data.events.length === 0 ? (
        <EmptyState title="This range is clear" description="No events match the selected agenda window." />
      ) : null}

      {[...groups.entries()].map(([key, events]) => (
        <section key={key} className="space-y-3">
          <div className="flex items-center gap-3">
            <CalendarDays className="size-5 text-muted-foreground" />
            <h2 className="font-semibold">{dayLabel(events[0].startAt, timezone)}</h2>
            <div className="h-px flex-1 bg-border" />
          </div>
          {events.map((event) => <EventCard key={event.id} event={event} from={from} />)}
        </section>
      ))}

      {range.data ? (
        <Pagination
          meta={range.data.data.meta}
          busy={range.isFetching}
          onPage={(value) => setFilter('page', String(value))}
        />
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
  const returnPath = location.pathname + location.search

  const setPage = (value: number) => {
    setParams((current) => {
      const next = new URLSearchParams(current)
      next.set('page', String(value))
      return next
    }, { replace: true })
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
      setParams((current) => {
        const next = new URLSearchParams(current)
        next.set('from', nextFrom)
        next.set('to', nextTo)
        next.set('timezone', timezone)
        next.delete('page')
        return next
      }, { replace: true })
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
            setParams((current) => {
              const next = new URLSearchParams(current)
              next.set('timezone', value)
              return next
            }, { replace: true })
          }}
        />
        <Button onClick={applyWindow}>Apply window</Button>
      </div>
      <FormError error={windowError} />

      {reminders.isPending ? <Loading /> : null}
      {reminders.isError ? <ErrorState error={reminders.error} retry={() => reminders.refetch()} /> : null}
      {reminders.data && reminders.data.data.length === 0 ? (
        <EmptyState title="No reminders due" description="No reminder offsets land inside this window." />
      ) : null}
      {reminders.data?.data.length ? (
        <div className="space-y-3">
          {reminders.data.data.map((reminder) => (
            <Link
              key={reminder.id}
              to={'/calendar/' + reminder.eventId}
              state={{ from: returnPath }}
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
  if (eventQuery.isError) return <ErrorState error={eventQuery.error} retry={() => eventQuery.refetch()} />

  const event = eventQuery.data.data
  const sourcePath = event.sourceEntityType && event.sourceEntityId
    ? '/' + sourceRoutes[event.sourceEntityType] + '/' + event.sourceEntityId
    : undefined

  const deleteEvent = async () => {
    try {
      await remove.mutateAsync(event.id)
      toast.success('Calendar event deleted')
      navigate(from, { replace: true })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to delete this calendar event.')
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
              <p className="text-muted-foreground">Reminders</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {event.reminders.length
                  ? event.reminders.map((minutes) => <Badge key={minutes} variant="secondary">{minutes} min before</Badge>)
                  : <span className="font-medium">No reminders</span>}
              </div>
            </div>
            <div>
              <p className="text-muted-foreground">Linked source</p>
              {!event.sourceEntityType ? <p className="mt-1 font-medium">Standalone event</p> : null}
              {event.sourceEntityType && event.sourceAvailable === false ? (
                <p className="mt-1 font-medium">{friendly(event.sourceEntityType)} record is unavailable</p>
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
            <DialogDescription>This removes the event and its reminder schedule. This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(false)} disabled={remove.isPending}>Cancel</Button>
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

  if (!creating && eventQuery.isPending) return <Loading />
  if (!creating && eventQuery.isError) return <ErrorState error={eventQuery.error} retry={() => eventQuery.refetch()} />

  const record = creating ? undefined : eventQuery.data?.data
  const cancelTo = creating ? from : '/calendar/' + id

  return (
    <div className="space-y-6">
      <PageHeader
        title={creating ? 'New event' : 'Edit event'}
        description={creating ? 'Place a new commitment on your timeline.' : 'Update timing, reminders, or linked context.'}
        back={cancelTo}
        backState={creating ? undefined : { from }}
      />
      <CalendarForm
        record={record}
        cancelTo={cancelTo}
        cancelState={creating ? undefined : { from }}
        saving={save.isPending}
        onSave={async (payload) => {
          const result = await save.mutateAsync(payload)
          toast.success(creating ? 'Calendar event created' : 'Calendar event updated')
          navigate('/calendar/' + result.data.id, { replace: true, state: { from } })
        }}
      />
    </div>
  )
}

export default function CalendarPages({ view }: { view: CalendarPageView }) {
  if (view === 'range') return <CalendarRangePage />
  if (view === 'reminders') return <CalendarRemindersPage />
  if (view === 'detail') return <CalendarDetailPage />
  if (view === 'edit') return <CalendarEditPage />
  return <CalendarListPage />
}
