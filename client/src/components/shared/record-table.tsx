import { useMemo, useState } from 'react'
import { useQueries } from '@tanstack/react-query'
import { Link, useLocation } from 'react-router'
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table'
import {
  ArrowDownUp,
  ArrowUpRight,
  Building2,
  UserRound,
  BriefcaseBusiness,
  CheckSquare2,
} from 'lucide-react'
import { useAuth } from '@/features/auth/auth-context'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { StatusBadge } from './status-badge'
import { resourceApi, titleOf, valueOf, type Entity } from '@/lib/resources'
import { displayDate } from '@/lib/dates'
import { friendly, type ResourceConfig } from '@/lib/fields'
import type { PageMeta } from '@/lib/api-types'
const icons = {
  companies: Building2,
  contacts: UserRound,
  applications: BriefcaseBusiness,
  tasks: CheckSquare2,
}

function RecordAvatar({ record, kind }: { record: Entity; kind: ResourceConfig['kind'] }) {
  const [failedSource, setFailedSource] = useState('')
  const source = String(valueOf(record, kind === 'companies' ? 'logo' : 'photo') || '')
  const Icon = icons[kind]
  return (
    <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/60 text-link">
      {/^https?:\/\//i.test(source) && failedSource !== source ? (
        <img
          src={source}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          className="size-full object-cover"
          onError={() => setFailedSource(source)}
        />
      ) : (
        <Icon className="size-4" />
      )}
    </span>
  )
}

function useRelationshipNames(rows: Entity[]) {
  const { user } = useAuth()
  const relationships = [
    ...new Set(
      rows
        .flatMap((row) => [
          valueOf(row, 'companyId') ? `companies:${valueOf(row, 'companyId')}` : '',
          valueOf(row, 'recruiter') ? `contacts:${valueOf(row, 'recruiter')}` : '',
        ])
        .filter(Boolean),
    ),
  ]
  const queries = useQueries({
    queries: relationships.map((reference) => {
      const [kind, id] = reference.split(':') as ['companies' | 'contacts', string]
      return {
        queryKey: ['crm', user?.id, kind, 'detail', id],
        queryFn: ({ signal }: { signal: AbortSignal }) => resourceApi(kind).get(id, signal),
        staleTime: 60_000,
      }
    }),
  })
  return Object.fromEntries(
    relationships.map((ref, index) => [
      ref.split(':')[1],
      queries[index].data
        ? titleOf(queries[index].data.data)
        : queries[index].isError
          ? 'Unavailable record'
          : 'Loading…',
    ]),
  )
}
export function RecordTable({
  config,
  rows,
  onSort,
}: {
  config: ResourceConfig
  rows: Entity[]
  onSort?: (key: string) => void
}) {
  const location = useLocation()
  const names = useRelationshipNames(rows)
  const columns: ColumnDef<Entity>[] = useMemo(
    () => [
      ...config.columns.map(({ key, label }) => ({
        id: key,
        header: () =>
          onSort && config.sorts.includes(key) ? (
            <button
              className="inline-flex items-center gap-2 hover:text-foreground"
              onClick={() => onSort(key)}
            >
              {label}
              <ArrowDownUp className="size-3" />
            </button>
          ) : (
            label
          ),
        cell: ({ row }: { row: { original: Entity } }) => {
          const record = row.original
          const value = valueOf(record, key)
          if (key === config.nameKey)
            return (
              <Link
                to={`/${config.kind}/${record.id}`}
                state={{ from: location.pathname + location.search }}
                className="group flex min-w-48 items-center gap-3 font-medium"
              >
                <RecordAvatar record={record} kind={config.kind} />
                <span className="max-w-72 truncate group-hover:text-link group-hover:underline">
                  {String(value)}
                </span>
              </Link>
            )
          if (value === null || value === undefined || value === '')
            return <span className="text-muted-foreground">—</span>
          if (['companyId', 'recruiter'].includes(key))
            return <span className="block max-w-44 truncate">{names[String(value)]}</span>
          if (['status', 'stage', 'priority'].includes(key))
            return <StatusBadge value={String(value)} />
          if (['dueDate', 'dateApplied', 'nextFollowUpAt'].includes(key))
            return (
              <span className="whitespace-nowrap text-muted-foreground">
                {displayDate(value, valueOf(record, 'timezone') as string | undefined)}
              </span>
            )
          if (key === 'remote') return value ? 'Remote' : 'Not remote'
          return (
            <span className="block max-w-52 truncate text-muted-foreground">
              {key === 'type' ? friendly(String(value)) : String(value)}
            </span>
          )
        },
      })),
      {
        id: 'open',
        header: () => <span className="sr-only">Open record</span>,
        cell: ({ row }) => (
          <Button variant="ghost" size="icon" asChild>
            <Link
              aria-label={`Open ${titleOf(row.original)}`}
              to={`/${config.kind}/${row.original.id}`}
              state={{ from: location.pathname + location.search }}
            >
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        ),
      },
    ],
    [config, location.pathname, location.search, names, onSort],
  )
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  })
  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((group) => (
          <TableRow key={group.id} className="bg-muted/50 hover:bg-muted/50">
            {group.headers.map((header) => (
              <TableHead key={header.id} className="h-11 px-5 text-xs">
                {flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.original.id} className="hover:bg-muted/35">
            {row.getVisibleCells().map((cell) => (
              <TableCell className="px-5 py-4" key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
export function Pagination({
  meta,
  onPage,
  busy,
}: {
  meta: PageMeta
  onPage: (page: number) => void
  busy?: boolean
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4 text-xs text-muted-foreground">
      <span>
        {meta.total === 0
          ? '0 records'
          : `${(meta.page - 1) * meta.limit + 1}–${Math.min(meta.page * meta.limit, meta.total)} of ${meta.total} records`}
      </span>
      <div className="flex items-center gap-3">
        <span>
          Page {meta.page} of {Math.max(meta.totalPages, 1)}
        </span>
        <Button
          size="sm"
          variant="outline"
          disabled={!meta.hasPreviousPage || busy}
          onClick={() => onPage(meta.page - 1)}
        >
          Previous
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={!meta.hasNextPage || busy}
          onClick={() => onPage(meta.page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
