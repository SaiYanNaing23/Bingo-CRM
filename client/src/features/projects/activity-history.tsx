import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Clock3, MessageSquare } from 'lucide-react'
import { useAuth } from '@/features/auth/auth-context'
import { useWrite } from '@/lib/resources'
import { request } from '@/lib/api-client'
import type { Page, Success } from '@/lib/api-types'
import { displayDate, browserTimezone } from '@/lib/dates'
import { friendly } from '@/lib/fields'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Pagination } from '@/components/shared/record-table'
import { ErrorState, Loading, EmptyState, FormError, Pending } from '@/components/shared/states'
import type { ProjectActivity } from './types'

export function ActivityHistory({ id }: { id: string }) {
  const { user } = useAuth()
  const [page, setPage] = useState(1),
    [content, setContent] = useState(''),
    [error, setError] = useState<unknown>(null)
  const history = useQuery({
    queryKey: ['crm', user?.id, 'projects', id, 'activities', page],
    queryFn: ({ signal }) =>
      request<Page<ProjectActivity>>(`/projects/${id}/activities`, {
        params: { page, limit: 10 },
        signal,
      }),
    enabled: !!user,
  })
  const writer = useWrite((body: { content: string }) =>
    request<Success<ProjectActivity>>(`/projects/${id}/activities`, { method: 'POST', body }),
  )
  return (
    <section className="panel mt-6 overflow-hidden" aria-label="Project activity">
      <div className="flex flex-wrap items-center gap-2 border-b px-6 py-4">
        <Clock3 className="size-4 text-muted-foreground" />
        <h2 className="font-semibold">Activity history</h2>
        <span className="ml-auto text-xs text-muted-foreground">
          Oldest first · {browserTimezone()}
        </span>
      </div>
      {history.isPending ? (
        <Loading />
      ) : history.isError ? (
        <ErrorState error={history.error} retry={() => void history.refetch()} />
      ) : (
        <>
          {!history.data.data.length ? (
            <EmptyState
              title="No activity yet"
              description="Progress changes and comments will appear here."
            />
          ) : (
            <ol className="divide-y px-6">
              {history.data.data.map((item) => (
                <li key={item.id} className="space-y-2 py-5">
                  <div className="flex flex-wrap justify-between gap-2">
                    <span className="font-medium">
                      {item.type === 'CREATED'
                        ? 'Project created'
                        : item.type === 'COMMENT'
                          ? 'Comment'
                          : 'Progress updated'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {displayDate(item.createdAt)}
                    </span>
                  </div>
                  {item.toStatus && (
                    <p className="text-sm text-muted-foreground">
                      {item.fromStatus && `${friendly(item.fromStatus)} · ${item.fromProgress}% → `}
                      {friendly(item.toStatus)} · {item.toProgress}%
                    </p>
                  )}
                  {item.content && (
                    <p className="whitespace-pre-wrap break-words leading-relaxed">
                      {item.content}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          )}
          <Pagination meta={history.data.meta} onPage={setPage} busy={history.isFetching} />
        </>
      )}
      <form
        className="space-y-3 border-t p-6"
        noValidate
        onSubmit={async (event) => {
          event.preventDefault()
          if (writer.isPending) return
          setError(null)
          if (!content.trim() || content.trim().length > 5000) {
            setError('Write a comment of 1–5,000 characters.')
            return
          }
          try {
            await writer.mutateAsync({ content: content.trim() })
            setContent('')
            toast.success('Comment added')
            const refreshed = await history.refetch()
            if (refreshed.data) setPage(Math.max(1, refreshed.data.meta.totalPages))
          } catch (e) {
            setError(e)
          }
        }}
      >
        <Label htmlFor="project-comment">Add a comment</Label>
        <Textarea
          id="project-comment"
          value={content}
          disabled={writer.isPending}
          onChange={(event) => setContent(event.target.value)}
          placeholder="A decision, a small win, or what to try next…"
          rows={3}
        />
        <FormError error={error} />
        <Button type="submit" disabled={writer.isPending}>
          {writer.isPending ? (
            <Pending>Adding…</Pending>
          ) : (
            <>
              <MessageSquare className="size-4" />
              Add comment
            </>
          )}
        </Button>
      </form>
    </section>
  )
}
