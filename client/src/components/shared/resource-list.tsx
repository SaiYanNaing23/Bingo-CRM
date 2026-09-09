import { useEffect, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Plus, Search, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChoiceSelect } from './choice-select'
import { DateTimePicker } from './date-time-picker'
import { RecordPicker } from './record-picker'
import { EmptyState, ErrorState, Loading, PageHeader } from './states'
import { RecordTable, Pagination } from './record-table'
import { useRecords } from '@/lib/resources'
import { type ResourceConfig, friendly } from '@/lib/fields'
import { useDebounced } from '@/lib/use-debounced'
import { browserTimezone, localInput, toTimestamp } from '@/lib/dates'
import type { Params } from '@/lib/api-types'

function DateFilter({
  id,
  label,
  value,
  onApply,
  onError,
}: {
  id: string
  label: string
  value: string
  onApply: (value: string) => void
  onError: (error: string) => void
}) {
  const [draft, setDraft] = useState(value ? localInput(value, browserTimezone()) : '')
  return (
    <div className="space-y-2">
      <DateTimePicker id={id} label={label} value={draft} onChange={setDraft} />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          try {
            onApply(draft ? toTimestamp(draft, browserTimezone()) : '')
            onError('')
          } catch (error) {
            onError((error as Error).message)
          }
        }}
      >
        Apply {label.toLowerCase()}
      </Button>
    </div>
  )
}

export function ResourceList({
  config,
  additionalParams = {},
  extraFilters,
  filterNotice,
}: {
  config: ResourceConfig
  additionalParams?: Params
  extraFilters?: ReactNode
  filterNotice?: string
}) {
  const [params, setParams] = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filterError, setFilterError] = useState('')
  const search = useDebounced(params.get('search') || '')
  const page = Math.max(1, Number(params.get('page')) || 1)
  const limit = [10, 20, 50].includes(Number(params.get('limit')))
    ? Number(params.get('limit'))
    : 20
  const sortBy = config.sorts.includes(params.get('sortBy') || '')
    ? params.get('sortBy')!
    : config.defaultSort
  const order =
    params.get('order') === 'asc' || (!params.has('order') && config.kind === 'tasks')
      ? 'asc'
      : 'desc'
  const query: Params = { search, page, limit, sortBy, order, ...additionalParams }
  config.filters.forEach((filter) => {
    const value = params.get(filter.key)
    if (value && (!filter.options || filter.options.includes(value))) query[filter.key] = value
  })
  const records = useRecords(config.kind, query)
  const update = (key: string, value: string) =>
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
  useEffect(() => {
    if (records.data && page > Math.max(records.data.meta.totalPages, 1))
      setParams(
        (current) => {
          const next = new URLSearchParams(current)
          next.set('page', String(Math.max(records.data!.meta.totalPages, 1)))
          return next
        },
        { replace: true },
      )
  }, [records.data, page, setParams])
  const filtered =
    !!search ||
    Object.values(additionalParams).some(Boolean) ||
    config.filters.some((filter) => !!params.get(filter.key))
  return (
    <>
      <PageHeader
        title={config.title}
        description={config.description}
        action={
          <Button asChild>
            <Link to={`/${config.kind}/new`} state={{ from: `/${config.kind}?${params}` }}>
              <Plus className="size-4" />
              New {config.singular}
            </Link>
          </Button>
        }
      />
      {config.kind === 'tasks' && (
        <div className="mb-5 flex gap-2 border-b">
          <span className="border-b-2 border-link px-4 pb-3 font-medium text-link">All tasks</span>
          <Link className="px-4 pb-3 text-muted-foreground hover:text-foreground" to="/tasks/today">
            Today
          </Link>
        </div>
      )}
      <section className="panel overflow-hidden" aria-label={`${config.title} list`}>
        {filterNotice && (
          <p role="status" className="border-b bg-muted/30 p-4 text-sm text-muted-foreground">
            {filterNotice}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
            <Input
              aria-label={`Search ${config.title.toLowerCase()}`}
              placeholder={`Search ${config.title.toLowerCase()}…`}
              className="pl-9"
              value={params.get('search') || ''}
              onChange={(event) => update('search', event.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setFiltersOpen(!filtersOpen)}
              aria-expanded={filtersOpen}
            >
              <SlidersHorizontal className="size-4" />
              Filters{filtered && <span className="size-1.5 rounded-full bg-primary" />}
            </Button>
            <label className="sr-only" htmlFor="sort">
              Sort by
            </label>
            <ChoiceSelect
              id="sort"
              className="w-auto"
              value={sortBy}
              onChange={(value) => update('sortBy', value)}
              options={config.sorts.map((value) => ({
                value,
                label:
                  (
                    {
                      createdAt: 'Created',
                      updatedAt: 'Updated',
                      dateApplied: 'Date applied',
                      dueDate: 'Due date',
                      lastContactAt: 'Last contacted',
                    } as Record<string, string>
                  )[value] || friendly(value),
              }))}
            />
            <Button
              variant="outline"
              aria-label="Toggle sort direction"
              onClick={() => update('order', order === 'asc' ? 'desc' : 'asc')}
            >
              {order === 'asc' ? 'Ascending' : 'Descending'}
            </Button>
            <ChoiceSelect
              aria-label="Rows per page"
              className="w-auto"
              value={String(limit)}
              onChange={(value) => update('limit', value)}
              options={[10, 20, 50].map((value) => ({
                value: String(value),
                label: `${value} / page`,
              }))}
            />
          </div>
        </div>
        {filtersOpen && (
          <div className="border-b bg-muted/30 p-5">
            <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {config.filters.map((filter) => (
                <div key={filter.key}>
                  <label
                    className="mb-2 block text-xs font-medium"
                    htmlFor={`filter-${filter.key}`}
                  >
                    {filter.label}
                    {filter.type === 'datetime' && (
                      <span className="font-normal text-muted-foreground">
                        {' '}
                        · {browserTimezone()}
                      </span>
                    )}
                  </label>
                  {filter.type === 'company' ? (
                    <RecordPicker
                      id={`filter-${filter.key}`}
                      label="Company filter"
                      kind="companies"
                      value={params.get(filter.key) || ''}
                      onChange={(value) => update(filter.key, value)}
                    />
                  ) : filter.options ? (
                    <ChoiceSelect
                      id={`filter-${filter.key}`}
                      value={params.get(filter.key) || ''}
                      onChange={(value) => update(filter.key, value)}
                      options={[
                        { value: '', label: 'All' },
                        ...filter.options.map((value) => ({ value, label: friendly(value) })),
                      ]}
                    />
                  ) : filter.type === 'datetime' ? (
                    <DateFilter
                      key={params.get(filter.key) || ''}
                      id={`filter-${filter.key}`}
                      label={filter.label}
                      value={params.get(filter.key) || ''}
                      onApply={(value) => update(filter.key, value)}
                      onError={setFilterError}
                    />
                  ) : (
                    <Input
                      id={`filter-${filter.key}`}
                      value={params.get(filter.key) || ''}
                      onChange={(event) => update(filter.key, event.target.value)}
                    />
                  )}
                </div>
              ))}
              {extraFilters}
            </div>
            {filterError && (
              <p role="alert" className="mt-2 text-destructive">
                {filterError}
              </p>
            )}
            <Button
              className="mt-4"
              variant="ghost"
              onClick={() => {
                setParams({})
                setFilterError('')
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
        {records.isPending ? (
          <Loading />
        ) : records.isError ? (
          <ErrorState error={records.error} retry={() => void records.refetch()} />
        ) : (
          <>
            {records.data.data.length ? (
              <RecordTable
                config={config}
                rows={records.data.data}
                onSort={(key) =>
                  setParams(
                    (current) => {
                      const next = new URLSearchParams(current)
                      next.set('sortBy', key)
                      next.set('order', sortBy === key && order === 'asc' ? 'desc' : 'asc')
                      next.delete('page')
                      return next
                    },
                    { replace: true },
                  )
                }
              />
            ) : (
              <EmptyState
                title={
                  filtered ? 'No matching records' : `Your ${config.title.toLowerCase()} start here`
                }
                description={
                  filtered
                    ? 'Try another search or adjust your filters.'
                    : `Add your first ${config.singular} to start bringing your workspace together.`
                }
                action={
                  filtered ? (
                    <Button variant="outline" onClick={() => setParams({})}>
                      Clear filters
                    </Button>
                  ) : (
                    <Button asChild>
                      <Link to={`/${config.kind}/new`}>Add {config.singular}</Link>
                    </Button>
                  )
                }
              />
            )}
            <Pagination
              meta={records.data.meta}
              busy={records.isFetching}
              onPage={(value) => update('page', String(value))}
            />
          </>
        )}
      </section>
      <p className="mt-4 text-xs text-muted-foreground">
        Your records are private to your account.
      </p>
    </>
  )
}
