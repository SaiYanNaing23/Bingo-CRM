import { useState } from 'react'
import { ArrowUpRight, FileText, Pencil, Plus, Trash2 } from 'lucide-react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ResourceList } from '@/components/shared/resource-list'
import { RecordActions } from '@/components/shared/record-actions'
import { PageHeader, Loading, ErrorState, EmptyState } from '@/components/shared/states'
import { useRecord, titleOf } from '@/lib/resources'
import { safeReturnPath } from '@/lib/api-client'
import { displayDate } from '@/lib/dates'
import { friendly } from '@/lib/fields'
import { EntityPicker } from '@/features/notes/entity-picker'
import { documentsConfig as config, formatBytes } from './config'
import { DocumentForm } from './document-form'
import { VersionDialog } from './version-dialog'
import { useDocumentVersions, useDeleteDocumentVersion } from './api'
import {
  documentTypeLabels,
  entityKinds,
  type DocumentEntity,
  type DocumentItem,
  type DocumentVersionItem,
} from './types'

function LinkedEntityInfo({ entity, available }: { entity: DocumentEntity; available: boolean | null }) {
  const kind = entityKinds[entity.type]
  const result = useRecord(kind, entity.id)

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {friendly(entity.type)}:
      </span>
      {result.data && available ? (
        <Link className="text-sm font-medium text-link hover:underline" to={`/${kind}/${entity.id}`}>
          {titleOf(result.data.data)}
        </Link>
      ) : result.isPending ? (
        <span className="text-sm text-muted-foreground">Loading record…</span>
      ) : (
        <span className="text-sm text-muted-foreground">Unavailable record</span>
      )}
    </div>
  )
}

function List() {
  const [params, setParams] = useSearchParams()
  const entityType = params.get('entityType') ?? ''
  const entityId = params.get('entityId') ?? ''
  const hasEntity = Boolean(entityType && entityId)
  const incomplete = (params.has('entityType') || params.has('entityId')) && !hasEntity

  return (
    <ResourceList
      config={config}
      additionalParams={hasEntity ? { entityType, entityId } : {}}
      extraFilters={
        <>
          <EntityPicker
            filter
            type={entityType}
            id={entityId}
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
              Select both a record type and specific record to filter by entity.
            </p>
          )}
        </>
      }
      filterNotice={
        incomplete
          ? 'Entity filter needs both record type and target record. Open filters to complete it.'
          : undefined
      }
    />
  )
}

function Detail() {
  const { id } = useParams()
  const location = useLocation()
  const from = safeReturnPath(location.state?.from, '/documents')

  const result = useRecord('documents', id)
  const [versionModalOpen, setVersionModalOpen] = useState(false)
  const [deleteVersionTarget, setDeleteVersionTarget] = useState<DocumentVersionItem | null>(null)

  const versionsQuery = useDocumentVersions(id, { limit: 50, order: 'desc' })
  const deleteVersion = useDeleteDocumentVersion(id ?? '')

  if (result.isPending) return <Loading />
  if (result.isError) return <ErrorState error={result.error} retry={() => void result.refetch()} />

  const doc = result.data.data as DocumentItem
  const current = doc.currentVersion
  const versions = versionsQuery.data?.data ?? []

  const handleDeleteVersionConfirm = async () => {
    if (!deleteVersionTarget) return
    try {
      await deleteVersion.mutateAsync(deleteVersionTarget.id)
      toast.success(`Version ${deleteVersionTarget.version} deleted`)
      setDeleteVersionTarget(null)
      void result.refetch()
    } catch (err: unknown) {
      const errorObj = err as { message?: string }
      toast.error(errorObj.message || 'Failed to delete version')
    }
  }

  return (
    <>
      <PageHeader
        title={doc.title}
        description={`${documentTypeLabels[doc.type] ?? doc.type} · Updated ${displayDate(doc.updatedAt)}`}
        back={from}
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="font-medium">
            {documentTypeLabels[doc.type] ?? doc.type}
          </Badge>
          {doc.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setVersionModalOpen(true)}>
            <Plus className="mr-1.5 size-4" />
            New Version
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/documents/${doc.id}/edit`} state={{ from }}>
              <Pencil className="mr-1.5 size-4" />
              Edit
            </Link>
          </Button>
          <RecordActions
            config={config}
            record={doc}
            from={from}
          />
        </div>
      </div>

      <div className="space-y-6">
        {doc.description && (
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Description
            </h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{doc.description}</p>
          </div>
        )}

        {doc.entity && (
          <div className="rounded-lg border bg-card p-4">
            <LinkedEntityInfo entity={doc.entity} available={doc.entityAvailable} />
          </div>
        )}

        {current ? (
          <div className="rounded-lg border bg-muted/30 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FileText className="size-5 text-primary" />
                  <h3 className="font-semibold text-foreground">{current.fileName}</h3>
                  <Badge variant="outline" className="text-xs">
                    v{current.version} (Latest)
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(current.fileSize)} · {current.mimeType} · Uploaded {displayDate(current.createdAt)}
                </p>
                {current.changelog && (
                  <p className="pt-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Notes:</span> {current.changelog}
                  </p>
                )}
              </div>

              {current.fileUrl && (
                <Button size="sm" asChild>
                  <a href={current.fileUrl} target="_blank" rel="noopener noreferrer">
                    Open File
                    <ArrowUpRight className="ml-1.5 size-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        ) : (
          <EmptyState title="No active version" description="Upload a revision to view file details." />
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold tracking-tight text-foreground">
              Version History ({doc.versionCount})
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setVersionModalOpen(true)}>
              <Plus className="mr-1 size-3.5" />
              Upload Revision
            </Button>
          </div>

          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Version</TableHead>
                  <TableHead>File Name</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Changelog</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {versions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No versions recorded.
                    </TableCell>
                  </TableRow>
                ) : (
                  versions.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-semibold">v{v.version}</TableCell>
                      <TableCell className="font-medium">
                        <a
                          href={v.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-link hover:underline"
                        >
                          {v.fileName}
                          <ArrowUpRight className="size-3" />
                        </a>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatBytes(v.fileSize)}</TableCell>
                      <TableCell className="max-w-48 truncate text-muted-foreground">
                        {v.changelog || '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{displayDate(v.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        {versions.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteVersionTarget(v)}
                          >
                            <Trash2 className="size-3.5" />
                            <span className="sr-only">Delete version {v.version}</span>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <VersionDialog
        documentId={doc.id}
        open={versionModalOpen}
        onOpenChange={setVersionModalOpen}
      />

      <Dialog open={!!deleteVersionTarget} onOpenChange={(open) => !open && setDeleteVersionTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Version {deleteVersionTarget?.version}?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete version {deleteVersionTarget?.version} ({deleteVersionTarget?.fileName})?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteVersionTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteVersionConfirm}
              disabled={deleteVersion.isPending}
            >
              Delete Version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function Edit() {
  const { id } = useParams()
  const location = useLocation()
  const isNew = !id
  const from = safeReturnPath(location.state?.from, '/documents')

  const result = useRecord('documents', id)

  if (!isNew && result.isPending) return <Loading />
  if (!isNew && result.isError) return <ErrorState error={result.error} retry={() => void result.refetch()} />

  const doc = result.data?.data as DocumentItem | undefined

  return (
    <>
      <PageHeader
        title={isNew ? 'New Document' : `Edit ${doc?.title}`}
        description={isNew ? 'Register and upload a new career document or resume' : 'Update document metadata'}
        back={isNew ? from : `/documents/${id}`}
      />
      <DocumentForm initial={doc} cancelTo={isNew ? from : `/documents/${id}`} />
    </>
  )
}

export default function DocumentPages({ view }: { view: 'list' | 'detail' | 'edit' }) {
  if (view === 'list') return <List />
  if (view === 'detail') return <Detail />
  return <Edit />
}
