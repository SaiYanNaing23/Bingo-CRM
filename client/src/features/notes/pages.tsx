import { useState } from 'react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router'
import { useEditorNavigation } from '@/lib/use-editor-navigation'
import { toast } from 'sonner'
import { ResourceList } from '@/components/shared/resource-list'
import { RecordActions } from '@/components/shared/record-actions'
import { PageHeader, Loading, ErrorState } from '@/components/shared/states'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useRecord, useWrite, resourceApi, titleOf } from '@/lib/resources'
import { safeReturnPath } from '@/lib/api-client'
import { displayDate } from '@/lib/dates'
import { friendly } from '@/lib/fields'
import { notesConfig as config } from './config'
import { NoteForm } from './note-form'
import { MarkdownPreview } from './markdown-preview'
import { EntityPicker } from './entity-picker'
import { entityFromParams } from './forms'
import { entityKinds, type NoteEntity } from './types'

function LinkedName({ entity }: { entity: NoteEntity }) {
  const kind = entityKinds[entity.type],
    result = useRecord(kind, entity.id)
  return result.data ? (
    <Link className="text-link underline underline-offset-4" to={`/${kind}/${entity.id}`}>
      {titleOf(result.data.data)}
    </Link>
  ) : result.isPending ? (
    <span>Loading linked record…</span>
  ) : result.isError ? (
    <span className="text-muted-foreground">Linked record unavailable</span>
  ) : null
}
function List() {
  const [params, setParams] = useSearchParams()
  const entity = entityFromParams(params)
  const incomplete = (params.has('entityType') || params.has('entityId')) && !entity
  return (
    <ResourceList
      config={config}
      additionalParams={entity ? { entityType: entity.type, entityId: entity.id } : {}}
      extraFilters={
        <>
          <EntityPicker
            filter
            type={params.get('entityType') ?? ''}
            id={params.get('entityId') ?? ''}
            onChange={(type, id) =>
              setParams(
                (current) => {
                  const next = new URLSearchParams(current)
                  next.delete('page')
                  next.delete('entityType')
                  next.delete('entityId')
                  if (type) next.set('entityType', type)
                  if (id) next.set('entityId', id)
                  return next
                },
                { replace: true },
              )
            }
          />
          {incomplete && (
            <p role="status" className="text-sm text-muted-foreground">
              Choose a record to apply the entity filter, or select All records to clear it. The
              list currently uses your other filters.
            </p>
          )}
        </>
      }
      filterNotice={
        incomplete
          ? 'The entity filter needs a valid record type and record. Open Filters to complete or clear it.'
          : undefined
      }
    />
  )
}
function Detail() {
  const { id } = useParams(),
    location = useLocation()
  const [source, setSource] = useState(false)
  const result = useRecord('notes', id)
  const from = safeReturnPath(location.state?.from, '/notes')
  if (result.isPending) return <Loading />
  if (result.isError) return <ErrorState error={result.error} retry={() => void result.refetch()} />
  const note = result.data.data
  return (
    <>
      <PageHeader
        title={note.title}
        description={`Note · Updated ${displayDate(note.updatedAt)}`}
        back={from}
      />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {note.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
        <RecordActions config={config} record={note} from={from} />
      </div>
      <section className="panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4">
          <h2 className="font-semibold">Note content</h2>
          <div className="flex gap-2" role="group" aria-label="Note view">
            <Button
              size="sm"
              variant={source ? 'ghost' : 'secondary'}
              aria-pressed={!source}
              onClick={() => setSource(false)}
            >
              Preview
            </Button>
            <Button
              size="sm"
              variant={source ? 'secondary' : 'ghost'}
              aria-pressed={source}
              onClick={() => setSource(true)}
            >
              Source
            </Button>
          </div>
        </div>
        <div className="p-6">
          {source ? (
            <pre
              aria-label="Markdown source"
              className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-sm leading-7"
            >
              {note.content}
            </pre>
          ) : (
            <MarkdownPreview content={note.content} />
          )}
        </div>
      </section>
      <section className="panel mt-6 p-6">
        <h2 className="mb-3 font-semibold">Linked record</h2>
        {note.entity ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{friendly(note.entity.type)}</p>
            {note.entityAvailable ? (
              <LinkedName entity={note.entity} />
            ) : (
              <p className="text-muted-foreground">
                Linked record unavailable. This note is still saved; edit it to change or remove the
                link.
              </p>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground">Standalone note</p>
        )}
        <p className="mt-5 text-xs text-muted-foreground">Created {displayDate(note.createdAt)}</p>
      </section>
      <Button asChild variant="ghost" className="mt-6">
        <Link to={from}>Back to list</Link>
      </Button>
    </>
  )
}
function Edit() {
  const { id } = useParams(),
    location = useLocation(),
    navigate = useEditorNavigation()
  const result = useRecord('notes', id)
  const writer = useWrite((body: Record<string, unknown>) =>
    id ? resourceApi('notes').update(id, body) : resourceApi('notes').create(body),
  )
  const from = safeReturnPath(location.state?.from, '/notes'),
    cancelTo = id ? `/notes/${id}` : from
  if (id && result.isPending) return <Loading />
  if (id && result.isError)
    return <ErrorState error={result.error} retry={() => void result.refetch()} />
  return (
    <>
      <PageHeader
        title={id ? 'Edit note' : 'New note'}
        description={result.data?.data.title ?? 'Capture something useful for your future self.'}
        back={cancelTo}
        backState={{ from }}
      />
      <NoteForm
        key={id ?? location.search}
        record={result.data?.data}
        entity={entityFromParams(new URLSearchParams(location.search))}
        cancelTo={cancelTo}
        onSave={async (body) => {
          const saved = await writer.mutateAsync(body)
          toast.success(id ? 'Changes saved' : 'Note created')
          navigate(`/notes/${saved.data.id}`, { replace: true, state: { from } })
        }}
      />
    </>
  )
}
export default function Pages({ view }: { view: 'list' | 'detail' | 'edit' }) {
  return view === 'list' ? <List /> : view === 'detail' ? <Detail /> : <Edit />
}
