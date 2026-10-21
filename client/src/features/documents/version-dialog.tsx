import { useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, CloudUpload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { EditorField } from '@/components/shared/editor-frame'
import { FormError, Pending } from '@/components/shared/states'
import { UploadDropzone } from '@/lib/uploadthing'
import { useAddDocumentVersion } from './api'
import { formatBytes } from './config'
import type { CreateDocumentVersionInput } from './types'

export function VersionDialog({
  documentId,
  open,
  onOpenChange,
}: {
  documentId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [fileName, setFileName] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [fileSize, setFileSize] = useState<number>(0)
  const [mimeType, setMimeType] = useState('application/pdf')
  const [changelog, setChangelog] = useState('')

  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const addVersion = useAddDocumentVersion(documentId)

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

  const handleSubmit = async () => {
    setFormError(null)
    setFieldErrors({})

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

    const payload: CreateDocumentVersionInput = {
      fileName: fileName.trim(),
      fileSize,
      mimeType: mimeType.trim() || 'application/pdf',
      fileUrl: fileUrl.trim(),
      changelog: changelog.trim() || undefined,
    }

    try {
      await addVersion.mutateAsync(payload)
      toast.success('New version added successfully')
      onOpenChange(false)
      setFileName('')
      setFileUrl('')
      setFileSize(0)
      setChangelog('')
    } catch (err: unknown) {
      const errorObj = err as { message?: string; details?: { fieldErrors?: Record<string, string> } }
      setFormError(errorObj.message || 'Failed to add document version')
      if (errorObj.details?.fieldErrors) {
        setFieldErrors(errorObj.details.fieldErrors)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Version</DialogTitle>
          <DialogDescription>
            Upload or register a newer revision for this document. The version number will automatically increment.
          </DialogDescription>
        </DialogHeader>

        <FormError error={formError} />

        <div className="space-y-4 py-2">
          {/* Cloud Storage Direct Uploader */}
          <div className="rounded-lg border border-border/80 bg-muted/20 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CloudUpload className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">Upload to Cloud Storage</span>
              </div>
              {fileUrl && (
                <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Uploaded ({formatBytes(fileSize)})
                </span>
              )}
            </div>

            <UploadDropzone
              endpoint="documentUploader"
              appearance={{
                container: 'border-2 border-dashed border-border rounded-lg p-5 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/40 transition-colors bg-card/40',
                button: 'bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer',
                label: 'text-foreground font-medium text-xs hover:text-primary transition-colors cursor-pointer',
                allowedContent: 'text-[11px] text-muted-foreground mt-1',
              }}
              onClientUploadComplete={(res) => {
                const uploaded = res?.[0] as any
                if (uploaded) {
                  const uploadedUrl = uploaded.ufsUrl || uploaded.url || ''
                  setFileName(uploaded.name)
                  setFileSize(uploaded.size)
                  setFileUrl(uploadedUrl)
                  setMimeType(uploaded.type || 'application/pdf')
                  toast.success(`Uploaded "${uploaded.name}" revision!`)
                }
              }}
              onUploadError={(error: any) => {
                const message = error?.message || 'Upload failed'
                toast.error(`Upload error: ${message}`)
                setFormError(`Upload error: ${message}`)
              }}
            />
          </div>

          <EditorField id="v-name" label="File Name" error={fieldErrors.fileName}>
            <Input
              id="v-name"
              value={fileName}
              placeholder="e.g. resume-v2.pdf"
              onChange={(e) => handleFileNameChange(e.target.value)}
              disabled={addVersion.isPending}
            />
          </EditorField>

          <div className="grid grid-cols-2 gap-3">
            <EditorField id="v-size" label="Size (Bytes)" error={fieldErrors.fileSize}>
              <Input
                id="v-size"
                type="number"
                min="1"
                value={fileSize || ''}
                placeholder="e.g. 1048576"
                onChange={(e) => setFileSize(Number(e.target.value) || 0)}
                disabled={addVersion.isPending}
              />
            </EditorField>

            <EditorField id="v-mime" label="MIME Type" error={fieldErrors.mimeType}>
              <Input
                id="v-mime"
                value={mimeType}
                placeholder="application/pdf"
                onChange={(e) => setMimeType(e.target.value)}
                disabled={addVersion.isPending}
              />
            </EditorField>
          </div>

          <EditorField id="v-url" label="File URL / Storage Location" error={fieldErrors.fileUrl}>
            <Input
              id="v-url"
              value={fileUrl}
              placeholder="https://..."
              onChange={(e) => setFileUrl(e.target.value)}
              disabled={addVersion.isPending}
            />
          </EditorField>

          <EditorField id="v-log" label="Changelog / Revision Notes" hint="What changed in this revision?">
            <Input
              id="v-log"
              value={changelog}
              placeholder="e.g. Updated skills and added recent projects"
              onChange={(e) => setChangelog(e.target.value)}
              disabled={addVersion.isPending}
            />
          </EditorField>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={addVersion.isPending}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={addVersion.isPending}>
            {addVersion.isPending ? <Pending>Saving version…</Pending> : 'Save Version'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
