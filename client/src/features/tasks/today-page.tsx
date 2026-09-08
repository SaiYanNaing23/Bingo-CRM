import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router'
import { CalendarDays, Plus } from 'lucide-react'
import { useAuth } from '@/features/auth/auth-context'
import { request } from '@/lib/api-client'
import type { Success } from '@/lib/api-types'
import { browserTimezone, isTimezone } from '@/lib/dates'
import { PageHeader, Loading, ErrorState, EmptyState } from '@/components/shared/states'
import { RecordTable, Pagination } from '@/components/shared/record-table'
import { TimezoneField } from '@/components/shared/timezone-field'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { tasksConfig } from './config'
import type { Today } from './types'
export default function TodayPage() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const zone = isTimezone(params.get('timezone') || '')
    ? params.get('timezone')!
    : browserTimezone()
  const page = Math.max(1, Number(params.get('page')) || 1)
  const [inputZone, setInputZone] = useState(zone)
  const [error, setError] = useState('')
  const today = useQuery({
    queryKey: ['crm', user?.id, 'tasks', 'today', zone, page],
    queryFn: ({ signal }) =>
      request<Success<Today>>('/tasks/today', {
        params: { timezone: zone, page, limit: 20 },
        signal,
      }),
    refetchInterval: 60_000,
  })
  const data = today.data?.data
  useEffect(() => setInputZone(zone), [zone])
  useEffect(() => {
    if (data && page > Math.max(data.meta.totalPages, 1)) {
      setParams(
        { timezone: zone, page: String(Math.max(data.meta.totalPages, 1)) },
        { replace: true },
      )
    }
  }, [data, page, zone, setParams])
  return (
    <>
      <PageHeader
        title="Today"
        description="A little focus. A few good steps forward."
        action={
          <Button asChild>
            <Link to="/tasks/new" state={{ from: `/tasks/today?${params}` }}>
              <Plus className="size-4" />
              New task
            </Link>
          </Button>
        }
      />
      <div className="mb-5 flex gap-2 border-b">
        <Link className="px-4 pb-3 text-muted-foreground hover:text-foreground" to="/tasks">
          All tasks
        </Link>
        <span className="border-b-2 border-link px-4 pb-3 font-medium text-link">Today</span>
      </div>
      <div className="panel mb-6 flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-3">
          <CalendarDays className="size-5 text-link" />
          <div className="font-medium">
            {data?.date || 'Your local day'}
            <p className="mt-0.5 text-xs font-normal text-muted-foreground">{zone}</p>
          </div>
        </div>
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            if (!isTimezone(inputZone)) {
              setError('Enter a valid named timezone.')
              return
            }
            setParams({ timezone: inputZone })
            setError('')
          }}
        >
          <div>
            <Label htmlFor="today-timezone" className="mb-1 block text-xs">
              View timezone
            </Label>
            <TimezoneField
              className="w-60"
              id="today-timezone"
              label="View timezone"
              value={inputZone}
              onChange={setInputZone}
            />
          </div>
          <Button variant="outline" type="submit">
            Apply timezone
          </Button>
          {error && (
            <p role="alert" className="w-full text-xs text-destructive">
              {error}
            </p>
          )}
        </form>
      </div>
      {today.isPending ? (
        <Loading />
      ) : today.isError ? (
        <ErrorState error={today.error} retry={() => void today.refetch()} />
      ) : (
        data && (
          <>
            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ['Due today', data.summary.dueToday, 'All statuses in this local day'],
                [
                  'Open today',
                  data.summary.pendingToday + data.summary.inProgressToday,
                  `${data.summary.pendingToday} to do · ${data.summary.inProgressToday} in progress`,
                ],
                [
                  'Completed · due today',
                  data.summary.completedToday,
                  'Completed tasks scheduled for today',
                ],
                ['Overdue', data.summary.overdue, 'Open tasks due before this local day'],
              ].map(([label, count, caption]) => (
                <div className="panel p-5" key={label}>
                  <p className="text-xs font-medium text-muted-foreground">{label}</p>
                  <p className="my-3 text-3xl font-semibold tracking-tight">{count}</p>
                  <p className="text-xs text-muted-foreground">{caption}</p>
                </div>
              ))}
            </div>
            <section className="panel overflow-hidden">
              <div className="flex flex-wrap justify-between gap-2 border-b px-5 py-4">
                <h2 className="font-semibold">On your list today</h2>
                <p className="text-xs text-muted-foreground">
                  {data.summary.cancelledToday} cancelled today · {data.summary.unscheduled} open
                  without a due date
                </p>
              </div>
              {data.tasks.length ? (
                <RecordTable config={tasksConfig} rows={data.tasks} />
              ) : (
                <EmptyState
                  title="A little room in your day"
                  description="There are no tasks scheduled for this day. Add one, or visit All tasks to plan what comes next."
                  action={
                    <Button variant="outline" asChild>
                      <Link to="/tasks">View all tasks</Link>
                    </Button>
                  }
                />
              )}
              <Pagination
                meta={data.meta}
                onPage={(page) => setParams({ timezone: zone, page: String(page) })}
                busy={today.isFetching}
              />
            </section>
            <p className="mt-4 text-xs text-muted-foreground">
              Counts cover all records, across every page. This view refreshes each minute.
            </p>
          </>
        )
      )}
    </>
  )
}
