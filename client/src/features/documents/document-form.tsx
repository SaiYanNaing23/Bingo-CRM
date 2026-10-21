import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { CheckCircle2, CloudUpload } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ChoiceSelect } from '@/components/shared/choice-select'
import { EditorField, EditorFrame } from '@/components/shared/editor-frame'
import { FormError } from '@/components/shared/states'
import { useWrite, resourceApi } from '@/lib/resources'
import { safeReturnPath } from '@/lib/api-client'
import { UploadDropzone } from '@/lib/uploadthing'
import { EntityPicker } from '@/features/notes/entity-picker'
import { formatBytes } from './config'
import {
  documentTypes,
  documentTypeLabels,
  type CreateDocumentInput,
  type DocumentEntityType,
  type DocumentItem,
  type DocumentType,
  type UpdateDocumentInput,
} from './types'

export function DocumentForm({
  initial,
  cancelTo,
}: {
  initial?: DocumentItem
  cancelTo: string
}) {
  const navigate = useNavigate()
  const isNew = !initial

  const [title, setTitle] = useState(initial?.title ?? '')
  const [type, setType] = useState<DocumentType>(initial?.type ?? 'RESUME')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [tags, setTags] = useState(initial?.tags?.join(', ') ?? '')
  const [entityType, setEntityType] = useState(initial?.entity?.type ?? '')
  const [entityId, setEntityId] = useState(initial?.entity?.id ?? '')

  // Initial version fields (only for creation)
  const [fileName, setFileName] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [fileSize, setFileSize] = useState<number>(0)
  const [mimeType, setMimeType] = useState('application/pdf')
  const [changelog, setChangelog] = useState('Initial version')

  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const isDirty = isNew
    ? Boolean(title || description || tags || fileName || fileUrl)
    : title !== initial.title ||
      type !== initial.type ||
      description !== (initial.description ?? '') ||
      tags !== (initial.tags?.join(', ') ?? '') ||
      entityType !== (initial.entity?.type ?? '') ||
      entityId !== (initial.entity?.id ?? '')

  const write = useWrite(
    (payload: Record<string, unknown>) =>
      isNew
        ? resourceApi('documents').create(payload)
        : resourceApi('documents').update(initial.id, payload),
  )

  const handleFileNameChange = (name: string) => {
    setFileName(name)
    if (!fileUrl) {
      setFileUrl(`https://storage.example.com/docs/${encodeURIComponent(name || 'document.pdf')}`)
    }
    const ext = name.split('.').pop()?.toLowerCase()
    if (ext === 'pdf') setMimeType('application/pdf')
    else if (ext === 'docx') setMimeType('application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    else if (ext === 'png') setMimeType('image/png')
    else if (ext === 'jpg' || ext === 'jpeg') setMimeType('image/jpeg')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    setFieldErrors({})

    const trimmedTitle = title.trim()
    if (trimmedTitle.length < 2) {
      setFieldErrors((prev) => ({ ...prev, title: 'Title must be at least 2 characters' }))
      return
    }

    const parsedTags = tags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)

    const entityPayload = entityType && entityId ? { type: entityType as DocumentEntityType, id: entityId } : null

    try {
      if (isNew) {
        if (!fileName.trim()) {
          setFieldErrors((prev) => ({ ...prev, fileName: 'File name is required' }))
          return
        }
        if (!fileUrl.trim()) {
          setFieldErrors((prev) => ({ ...prev, fileUrl: 'File URL is required (upload or enter link)' }))
          return
        }
        if (!fileSize || fileSize <= 0) {
          setFieldErrors((prev) => ({ ...prev, fileSize: 'File size must be greater than 0' }))
          return
        }

        const createPayload: CreateDocumentInput = {
          title: trimmedTitle,
          type,
          description: description.trim() || null,
          tags: parsedTags,
          entity: entityPayload,
          fileName: fileName.trim(),
          fileSize,
          mimeType: mimeType.trim() || 'application/pdf',
          fileUrl: fileUrl.trim(),
          changelog: changelog.trim() || undefined,
        }

        const result = await write.mutateAsync(createPayload as unknown as Record<string, unknown>)
        toast.success('Document created successfully')
        navigate(`/documents/${result.data.id}`)
      } else {
        const updatePayload: UpdateDocumentInput = {
          title: trimmedTitle,
          type,
          description: description.trim() || null,
          tags: parsedTags,
          entity: entityPayload,
        }

        await write.mutateAsync(updatePayload as unknown as Record<string, unknown>)
        toast.success('Document updated successfully')
        navigate(safeReturnPath(cancelTo, `/documents/${initial.id}`))
      }
    } catch (err: unknown) {
      const errorObj = err as { message?: string; details?: { fieldErrors?: Record<string, string> } }
      setFormError(errorObj.message || 'Failed to save document')
      if (errorObj.details?.fieldErrors) {
        setFieldErrors(errorObj.details.fieldErrors)
      }
    }
  }

  return (
    <EditorFrame
      dirty={isDirty}
      busy={write.isPending}
      cancelTo={cancelTo}
      label={isNew ? 'Create Document' : 'Save Changes'}
      onSubmit={handleSubmit}
    >
      <FormError error={formError} />

      <div className="space-y-4">
        <h3 className="text-sm font-semibold tracking-wide text-foreground">Document Details</h3>

        <EditorField id="doc-title" label="Document Title" error={fieldErrors.title}>
          <Input
            id="doc-title"
            value={title}
            placeholder="e.g. Senior Backend Resume - 2026"
            onChange={(e) => setTitle(e.target.value)}
            disabled={write.isPending}
          />
        </EditorField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <EditorField id="doc-type" label="Category">
            <ChoiceSelect
              id="doc-type"
              value={type}
              options={documentTypes.map((t) => ({ value: t, label: documentTypeLabels[t] }))}
              onChange={(val) => setType(val as DocumentType)}
              disabled={write.isPending}
            />
          </EditorField>

          <EditorField id="doc-tags" label="Tags" hint="Comma-separated (e.g. resume, backend, lead)">
            <Input
              id="doc-tags"
              value={tags}
              placeholder="resume, cloud, 2026"
              onChange={(e) => setTags(e.target.value)}
              disabled={write.isPending}
            />
          </EditorField>
        </div>

        <EditorField id="doc-desc" label="Description" hint="Optional summary or notes about this document">
          <Textarea
            id="doc-desc"
            rows={3}
            value={description}
            placeholder="Brief overview or customized purpose for this document..."
            onChange={(e) => setDescription(e.target.value)}
            disabled={write.isPending}
          />
        </EditorField>

        <div className="border-t pt-4">
          <h4 className="mb-2 text-sm font-medium text-foreground">Associated CRM Record (Optional)</h4>
          <EntityPicker
            type={entityType}
            id={entityId}
            disabled={write.isPending}
            error={fieldErrors.entityId}
            onChange={(t, i) => {
              setEntityType(t)
              setEntityId(i)
            }}
          />
        </div>

        {isNew && (
          <div className="border-t pt-4 space-y-4">
            <h3 className="text-sm font-semibold tracking-wide text-foreground">Initial File Information</h3>

            {/* Cloud Storage Direct Uploader */}
            <div className="rounded-lg border border-border/80 bg-muted/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CloudUpload className="h-5 w-5 text-primary" />
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Upload to Cloud Storage (UploadThing)</h4>
                    <p className="text-xs text-muted-foreground">
                      Upload PDF, DOCX, images, or text documents directly to cloud storage (up to 32MB)
                    </p>
                  </div>
                </div>
                {fileUrl && (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    Binary uploaded ({formatBytes(fileSize)})
                  </span>
                )}
              </div>

              <UploadDropzone
                endpoint="documentUploader"
                appearance={{
                  container: 'border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/40 transition-colors bg-card/40',
                  button: 'bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer',
                  label: 'text-foreground font-medium text-sm hover:text-primary transition-colors cursor-pointer',
                  allowedContent: 'text-xs text-muted-foreground mt-1',
                }}
                onClientUploadComplete={(res) => {
                  const uploaded = res?.[0] as any
                  if (uploaded) {
                    const uploadedUrl = uploaded.ufsUrl || uploaded.url || ''
                    setFileName(uploaded.name)
                    setFileSize(uploaded.size)
                    setFileUrl(uploadedUrl)
                    setMimeType(uploaded.type || 'application/pdf')
                    if (!title.trim()) {
                      const derived = String(uploaded.name).replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
                      setTitle(derived.charAt(0).toUpperCase() + derived.slice(1))
                    }
                    toast.success(`Uploaded "${uploaded.name}" to cloud storage!`)
                  }
                }}
                onUploadError={(error: any) => {
                  const message = error?.message || 'Upload failed'
                  toast.error(`Upload error: ${message}`)
                  setFormError(`Upload error: ${message}`)
                }}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <EditorField id="file-name" label="File Name" error={fieldErrors.fileName}>
                <Input
                  id="file-name"
                  value={fileName}
                  placeholder="e.g. resume-2026.pdf"
                  onChange={(e) => handleFileNameChange(e.target.value)}
                  disabled={write.isPending}
                />
              </EditorField>

              <EditorField id="file-size" label="File Size (Bytes)" error={fieldErrors.fileSize}>
                <Input
                  id="file-size"
                  type="number"
                  min="1"
                  value={fileSize || ''}
                  placeholder="e.g. 1048576"
                  onChange={(e) => setFileSize(Number(e.target.value) || 0)}
                  disabled={write.isPending}
                />
              </EditorField>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <EditorField id="file-mime" label="MIME Type" error={fieldErrors.mimeType}>
                <Input
                  id="file-mime"
                  value={mimeType}
                  placeholder="application/pdf"
                  onChange={(e) => setMimeType(e.target.value)}
                  disabled={write.isPending}
                />
              </EditorField>

              <EditorField id="file-url" label="File URL / Storage Location" error={fieldErrors.fileUrl}>
                <Input
                  id="file-url"
                  value={fileUrl}
                  placeholder="https://..."
                  onChange={(e) => setFileUrl(e.target.value)}
                  disabled={write.isPending}
                />
              </EditorField>
            </div>

            <EditorField id="file-changelog" label="Version Notes" hint="Optional change log for this initial version">
              <Input
                id="file-changelog"
                value={changelog}
                placeholder="Initial master upload"
                onChange={(e) => setChangelog(e.target.value)}
                disabled={write.isPending}
              />
            </EditorField>
          </div>
        )}
      </div>
    </EditorFrame>
  )
}
