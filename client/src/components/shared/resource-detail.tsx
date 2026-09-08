import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { titleOf, useRecord, useRecords, valueOf, type Kind } from '@/lib/resources'
import type { ResourceConfig } from '@/lib/fields'
import { friendly } from '@/lib/fields'
import { safeReturnPath } from '@/lib/api-client'
import { displayDate, browserTimezone } from '@/lib/dates'
import { PageHeader, Loading, ErrorState, EmptyState } from './states'
import { StatusBadge } from './status-badge'
import { RecordActions } from './record-actions'
import { StageHistory } from '@/features/applications/stage-history'
import { RecordTable, Pagination } from './record-table'
import { contactsConfig } from '@/features/contacts/config'
import { applicationsConfig } from '@/features/applications/config'
export function RelatedName({ kind, id }: { kind: Kind; id: string }) {
  const record = useRecord(kind, id)
  return record.data ? (
    <Link className="text-link underline underline-offset-4" to={`/${kind}/${id}`}>
      {titleOf(record.data.data)}
    </Link>
  ) : (
    <span className="text-muted-foreground">
      {record.isPending ? 'Loading…' : 'Linked record unavailable'}
    </span>
  )
}
function RelatedRecords({ config, companyId }: { config: ResourceConfig; companyId: string }) {
  const [page, setPage] = useState(1)
  const records = useRecords(config.kind, { companyId, page, limit: 10 })
  return (
    <section className="panel mt-6 overflow-hidden">
      <div className="flex justify-between border-b px-6 py-4">
        <h2 className="font-semibold">{config.title}</h2>
        <Link
          className="text-xs text-link hover:underline"
          to={`/${config.kind}?companyId=${companyId}`}
        >
          View all
        </Link>
      </div>
      {records.isPending ? (
        <Loading />
      ) : records.isError ? (
        <ErrorState error={records.error} retry={() => void records.refetch()} />
      ) : records.data.data.length ? (
        <>
          <RecordTable config={config} rows={records.data.data} />
          <Pagination meta={records.data.meta} onPage={setPage} />
        </>
      ) : (
        <EmptyState
          title={`No ${config.title.toLowerCase()} yet`}
          description={`Add ${config.title.toLowerCase()} and choose this company to see them here.`}
        />
      )}
    </section>
  )
}
export function ResourceDetail({ config }: { config: ResourceConfig }) {
  const { id } = useParams()
  const location = useLocation()
  const result = useRecord(config.kind, id)
  if (result.isPending) return <Loading />
  if (result.isError) return <ErrorState error={result.error} retry={() => void result.refetch()} />
  const record = result.data.data
  const zone = String(valueOf(record, 'timezone') || browserTimezone())
  const from = safeReturnPath(location.state?.from, `/${config.kind}`)
  const status = valueOf(record, 'stage') || valueOf(record, 'status')
  return (
    <>
      <PageHeader
        title={titleOf(record)}
        description={`${config.singular[0].toUpperCase()}${config.singular.slice(1)} details · Updated ${displayDate(record.updatedAt, zone)}`}
        back={from}
      />
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        {status ? (
          <StatusBadge value={String(status)} />
        ) : (
          <span className="text-sm text-muted-foreground">Contact information</span>
        )}
        <RecordActions key={record.id} config={config} record={record} from={from} />
      </div>
      {config.kind === 'tasks' && valueOf(record, 'status') === 'COMPLETED' && (
        <div className="success-notice mb-5 rounded-lg border p-4">
          Completed {displayDate(valueOf(record, 'completedAt'), zone)}. This task is now read-only.
        </div>
      )}
      <section className="panel">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">Details</h2>
        </div>
        <dl className="grid gap-x-10 gap-y-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
          {config.fields
            .filter((field) => !field.key.startsWith('_') && field.key !== config.nameKey)
            .map((field) => {
              const value = valueOf(record, field.key)
              return (
                <div
                  key={field.key}
                  className={field.type === 'textarea' ? 'sm:col-span-2 lg:col-span-3' : ''}
                >
                  <dt className="mb-2 text-xs font-medium text-muted-foreground">
                    {field.createOnly ? 'Stage' : field.label}
                  </dt>
                  <dd className="break-words leading-relaxed">
                    {value === null || value === undefined || value === '' ? (
                      <span className="text-muted-foreground">Not added</span>
                    ) : field.type === 'company' || field.type === 'recruiter' ? (
                      <RelatedName
                        kind={field.type === 'company' ? 'companies' : 'contacts'}
                        id={String(value)}
                      />
                    ) : field.type === 'datetime' ? (
                      <>
                        {displayDate(value, zone)}
                        <span className="ml-2 text-xs text-muted-foreground">{zone}</span>
                      </>
                    ) : field.type === 'checkbox' ? (
                      value ? (
                        'Yes'
                      ) : (
                        'No'
                      )
                    ) : field.array ? (
                      <div className="flex flex-wrap gap-1">
                        {(value as string[]).map((item, index) => (
                          <Badge variant="outline" key={`${item}-${index}`}>
                            {item}
                          </Badge>
                        ))}
                      </div>
                    ) : field.type === 'url' && /^https?:\/\//i.test(String(value)) ? (
                      <a
                        className="inline-flex max-w-full items-center gap-2 text-link hover:underline"
                        href={String(value)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span className="truncate">{String(value)}</span>
                        <ExternalLink className="size-3 shrink-0" />
                      </a>
                    ) : field.type === 'select' ? (
                      <StatusBadge value={String(value)} />
                    ) : (
                      <span className="whitespace-pre-wrap">{String(value)}</span>
                    )}
                  </dd>
                </div>
              )
            })}
        </dl>
      </section>
      {config.kind === 'tasks' && valueOf(record, 'repeatPattern') !== 'NONE' && (
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Repeats {friendly(String(valueOf(record, 'repeatPattern'))).toLowerCase()} from the
          previous due date when completed. Month-end dates are adjusted to a valid date. The next
          occurrence of an overdue task can still be overdue.
        </p>
      )}
      {config.kind === 'tasks' && !!valueOf(record, 'recurrenceSourceId') && (
        <p className="mt-3 text-sm">
          Previous occurrence:{' '}
          <RelatedName kind="tasks" id={String(valueOf(record, 'recurrenceSourceId'))} />
        </p>
      )}
      {config.kind === 'applications' && <StageHistory id={record.id} timezone={zone} />}
      {config.kind === 'companies' && (
        <>
          <RelatedRecords config={contactsConfig} companyId={record.id} />
          <RelatedRecords config={applicationsConfig} companyId={record.id} />
        </>
      )}
      <div className="mt-6">
        <Button variant="ghost" asChild>
          <Link to={from}>Back to {config.title.toLowerCase()}</Link>
        </Button>
      </div>
    </>
  )
}
