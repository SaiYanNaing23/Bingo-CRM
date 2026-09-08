import type { ReactNode } from 'react'
import { AlertCircle, ArrowLeft, FolderOpen, Loader2 } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ApiError } from '@/lib/api-client'
export function PageHeader({
  title,
  description,
  action,
  back,
}: {
  title: string
  description?: string
  action?: ReactNode
  back?: string
}) {
  return (
    <header className="mb-7">
      <div className="mb-3 text-xs font-medium uppercase tracking-[.14em] text-muted-foreground">
        Your workspace
        {back && (
          <span className="normal-case tracking-normal">
            {' '}
            /{' '}
            <Link className="hover:underline" to={back}>
              Back to list
            </Link>
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="mt-2 max-w-2xl leading-relaxed text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </div>
    </header>
  )
}
export function Loading() {
  return (
    <div role="status" aria-label="Loading" className="panel space-y-5 p-8">
      <Skeleton className="h-7 w-48" />
      {[1, 2, 3].map((n) => (
        <Skeleton key={n} className="h-12 w-full" />
      ))}
      <span className="sr-only">Loading your workspace…</span>
    </div>
  )
}
export function ErrorState({ error, retry }: { error: unknown; retry?: () => void }) {
  const missing = error instanceof ApiError && error.status === 404
  return (
    <div role="alert" className="panel flex flex-col items-center gap-4 px-6 py-14 text-center">
      <AlertCircle className="size-8 text-muted-foreground" />
      <h2 className="text-lg font-semibold">
        {missing ? 'This record is unavailable' : 'We couldn’t load this page'}
      </h2>
      <p className="max-w-md text-muted-foreground">
        {missing
          ? 'It may have been deleted, or it may belong to another workspace.'
          : error instanceof Error
            ? error.message
            : 'Please try again.'}
      </p>
      {retry && !missing && (
        <Button variant="outline" onClick={retry}>
          Try again
        </Button>
      )}
      <Button variant="ghost" asChild>
        <Link to="/companies">
          <ArrowLeft /> Go to companies
        </Link>
      </Button>
    </div>
  )
}
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <div className="mb-5 rounded-xl border bg-muted/60 p-4">
        <FolderOpen className="size-7 text-link" />
      </div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mb-5 mt-2 max-w-sm leading-relaxed text-muted-foreground">{description}</p>
      {action}
    </div>
  )
}
export function FormError({ error }: { error?: unknown }) {
  return error ? (
    <p
      role="alert"
      className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
    >
      {error instanceof Error ? error.message : String(error)}
    </p>
  ) : null
}
export function Pending({ children }: { children: ReactNode }) {
  return (
    <>
      <Loader2 className="size-4 animate-spin" />
      {children}
    </>
  )
}
