import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Clock3 } from 'lucide-react'
import { useAuth } from '@/features/auth/auth-context'
import { request } from '@/lib/api-client'
import type { Page } from '@/lib/api-types'
import type { StageHistory as History } from './types'
import { StatusBadge } from '@/components/shared/status-badge'
import { Pagination } from '@/components/shared/record-table'
import { ErrorState, Loading } from '@/components/shared/states'
import { displayDate } from '@/lib/dates'
export function StageHistory({ id, timezone }: { id: string; timezone: string }) {
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const history = useQuery({
    queryKey: ['crm', user?.id, 'applications', id, 'history', page],
    queryFn: ({ signal }) =>
      request<Page<History>>(`/applications/${id}/stage-history`, {
        params: { page, limit: 10 },
        signal,
      }),
  })
  return (
    <section className="panel mt-6">
      <div className="flex items-center gap-2 border-b px-6 py-4">
        <Clock3 className="size-4 text-muted-foreground" />
        <h2 className="font-semibold">Stage history</h2>
        <span className="ml-auto text-xs text-muted-foreground">Oldest first</span>
      </div>
      {history.isPending ? (
        <Loading />
      ) : history.isError ? (
        <ErrorState error={history.error} retry={() => void history.refetch()} />
      ) : (
        <>
          <ol className="divide-y px-6">
            {history.data.data.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-5">
                <div className="flex flex-wrap items-center gap-3">
                  {item.fromStage ? (
                    <StatusBadge value={item.fromStage} />
                  ) : (
                    <span className="text-muted-foreground">Created</span>
                  )}
                  <ArrowRight className="size-4 text-muted-foreground" />
                  <StatusBadge value={item.toStage} />
                </div>
                <span className="text-xs text-muted-foreground">
                  {displayDate(item.createdAt, timezone)} · {timezone}
                </span>
              </li>
            ))}
          </ol>
          <Pagination meta={history.data.meta} onPage={setPage} busy={history.isFetching} />
        </>
      )}
    </section>
  )
}
