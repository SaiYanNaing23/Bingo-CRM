import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { ChoiceSelect } from '@/components/shared/choice-select'
import { EditorField } from '@/components/shared/editor-frame'
import { FormError, Pending } from '@/components/shared/states'
import { useWrite } from '@/lib/resources'
import { request } from '@/lib/api-client'
import type { Success } from '@/lib/api-types'
import { friendly } from '@/lib/fields'
import { projectStatuses, type Project, type ProjectStatus } from './types'
import { validProjectState, stateHint } from './forms'

export function ProgressAction({ project }: { project: Project }) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<ProjectStatus>(project.status)
  const [progress, setProgress] = useState(String(project.progress))
  const [content, setContent] = useState('')
  const [error, setError] = useState<unknown>(null)
  const writer = useWrite((body: Record<string, unknown>) =>
    request<Success<Project>>(`/projects/${project.id}/progress`, { method: 'PATCH', body }),
  )
  return (
    <>
      <Button
        onClick={() => {
          setStatus(project.status)
          setProgress(String(project.progress))
          setContent('')
          setError(null)
          setOpen(true)
        }}
      >
        Update progress
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!writer.isPending) setOpen(next)
        }}
      >
        <DialogContent>
          <DialogTitle>Update project progress</DialogTitle>
          <DialogDescription>
            Choose the status and percentage together. Each change appears in activity history.
          </DialogDescription>
          <form
            className="space-y-4"
            noValidate
            onSubmit={async (event) => {
              event.preventDefault()
              if (writer.isPending) return
              setError(null)
              if (!progress.trim() || !validProjectState(status, Number(progress))) {
                setError(stateHint)
                return
              }
              if (content.trim().length > 5000) {
                setError('Use no more than 5,000 characters for the message.')
                return
              }
              if (status === project.status && Number(progress) === project.progress) {
                setError(
                  'Status and progress are unchanged. To add a message, use Add comment below the history.',
                )
                return
              }
              try {
                await writer.mutateAsync({
                  status,
                  progress: Number(progress),
                  ...(content.trim() ? { content: content.trim() } : {}),
                })
                toast.success('Project progress saved')
                setOpen(false)
              } catch (e) {
                setError(e)
              }
            }}
          >
            <fieldset className="space-y-4" disabled={writer.isPending}>
              <EditorField id="project-status" label="Status">
                <ChoiceSelect
                  id="project-status"
                  value={status}
                  onChange={(value) => setStatus(value as ProjectStatus)}
                  disabled={writer.isPending}
                  options={projectStatuses.map((value) => ({ value, label: friendly(value) }))}
                />
              </EditorField>
              <EditorField id="project-progress" label="Progress (%)" hint={stateHint}>
                <Input
                  id="project-progress"
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={progress}
                  onChange={(event) => setProgress(event.target.value)}
                  aria-describedby="project-progress-description"
                />
              </EditorField>
              <EditorField id="progress-message" label="Message (optional)">
                <Textarea
                  id="progress-message"
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  rows={3}
                />
              </EditorField>
            </fieldset>
            <FormError error={error} />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={writer.isPending}
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={writer.isPending}>
                {writer.isPending ? <Pending>Saving…</Pending> : 'Save progress'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
