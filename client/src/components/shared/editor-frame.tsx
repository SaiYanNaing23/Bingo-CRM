import { useRef, type ReactNode, type FormEvent } from 'react'
import { Link, useBeforeUnload, useBlocker, useLocation } from 'react-router'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Pending } from './states'

export function EditorFrame({
  children,
  dirty,
  busy,
  cancelTo,
  label,
  onSubmit,
}: {
  children: ReactNode
  dirty: boolean
  busy: boolean
  cancelTo: string
  label: string
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>
}) {
  const submitting = useRef(false)
  const location = useLocation()
  const blocker = useBlocker(() => dirty && !submitting.current)
  useBeforeUnload((event) => {
    if (dirty) {
      event.preventDefault()
      event.returnValue = ''
    }
  })
  return (
    <>
      <form
        className="max-w-4xl space-y-5"
        noValidate
        onSubmit={async (event) => {
          submitting.current = true
          try {
            await onSubmit(event)
          } finally {
            submitting.current = false
          }
        }}
      >
        <fieldset disabled={busy} className="space-y-5">
          {children}
        </fieldset>
        <div className="flex justify-end gap-3 border-t pt-5">
          <Button type="button" variant="outline" disabled={busy} asChild={!busy}>
            {busy ? (
              'Cancel'
            ) : (
              <Link to={cancelTo} state={location.state}>
                Cancel
              </Link>
            )}
          </Button>
          <Button disabled={busy} type="submit">
            {busy ? <Pending>Saving…</Pending> : label}
          </Button>
        </div>
      </form>
      <Dialog
        open={blocker.state === 'blocked'}
        onOpenChange={(open) => {
          if (!open && blocker.state === 'blocked') blocker.reset()
        }}
      >
        <DialogContent>
          <DialogTitle>Leave without saving?</DialogTitle>
          <DialogDescription>Your changes haven’t been saved yet.</DialogDescription>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => blocker.state === 'blocked' && blocker.reset()}
            >
              Keep editing
            </Button>
            <Button
              variant="destructive"
              onClick={() => blocker.state === 'blocked' && blocker.proceed()}
            >
              Discard changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
export function EditorField({
  id,
  label,
  error,
  hint,
  children,
  wide,
}: {
  id: string
  label: string
  error?: string
  hint?: string
  children: ReactNode
  wide?: boolean
}) {
  return (
    <div className={wide ? 'sm:col-span-2 min-w-0' : 'min-w-0'}>
      <Label htmlFor={id} className="mb-2 block">
        {label}
      </Label>
      {children}
      <div id={`${id}-description`} className="mt-1.5 text-xs leading-relaxed">
        {error ? (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        ) : hint ? (
          <p className="text-muted-foreground">{hint}</p>
        ) : null}
      </div>
    </div>
  )
}
