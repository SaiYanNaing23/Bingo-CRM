import { Link, useLocation } from 'react-router'
import { useRecords } from '@/lib/resources'
import { Button } from '@/components/ui/button'
import { Loading, ErrorState, EmptyState } from '@/components/shared/states'
import { displayDate } from '@/lib/dates'
import type { NoteEntity } from './types'

export function RelatedNotes({ entity }: { entity: NoteEntity }) {
  const location = useLocation()
  const params = new URLSearchParams({ entityType: entity.type, entityId: entity.id })
  const notes = useRecords('notes', {
    entityType: entity.type,
    entityId: entity.id,
    page: 1,
    limit: 5,
  })
  const from = location.pathname + location.search
  return (
    <section className="panel mt-6 overflow-hidden" aria-label="Related notes">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4">
        <h2 className="font-semibold">Notes{notes.data ? ` (${notes.data.meta.total})` : ''}</h2>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="ghost">
            <Link to={`/notes?${params}`} state={{ from }}>
              View all notes
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to={`/notes/new?${params}`} state={{ from }}>
              New note
            </Link>
          </Button>
        </div>
      </div>
      {notes.isPending ? (
        <Loading />
      ) : notes.isError ? (
        <ErrorState error={notes.error} retry={() => void notes.refetch()} />
      ) : notes.data.data.length ? (
        <ul className="divide-y">
          {notes.data.data.map((note) => (
            <li
              key={note.id}
              className="flex flex-wrap items-center justify-between gap-2 px-6 py-4"
            >
              <Link
                className="min-w-0 break-words font-medium text-link hover:underline"
                to={`/notes/${note.id}`}
                state={{ from }}
              >
                {note.title}
              </Link>
              <span className="text-xs text-muted-foreground">{displayDate(note.updatedAt)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="No linked notes yet"
          description="Add decisions, research, or a useful reminder for this record."
        />
      )}
      {!!notes.data && notes.data.meta.total > 5 && (
        <p className="border-t px-6 py-3 text-xs text-muted-foreground">
          Showing the 5 most recently updated notes. View all notes for the full list.
        </p>
      )}
    </section>
  )
}
