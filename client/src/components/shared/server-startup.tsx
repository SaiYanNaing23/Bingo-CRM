import { useEffect, useState, type ReactNode } from 'react'
import { LoaderCircle, RefreshCw, ServerOff } from 'lucide-react'
import { request } from '@/lib/api-client'
import type { Success } from '@/lib/api-types'
import { BrandLogo } from '@/components/shared/brand-logo'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function ServerStartup({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<'connecting' | 'ready' | 'unavailable'>('connecting')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let stopped = false
    let controller: AbortController | undefined
    let retryTimer: ReturnType<typeof setTimeout> | undefined
    let requestTimer: ReturnType<typeof setTimeout> | undefined
    const deadline = setTimeout(() => {
      stopped = true
      controller?.abort()
      clearTimeout(retryTimer)
      clearTimeout(requestTimer)
      setStatus('unavailable')
    }, 120_000)

    async function check() {
      controller = new AbortController()
      requestTimer = setTimeout(() => controller?.abort(), 15_000)
      try {
        const result = await request<Success<{ status: string }>>('/health/ready', {
          anonymous: true,
          cache: 'no-store',
          signal: controller.signal,
        })
        if (!stopped && result.data?.status === 'ok') {
          stopped = true
          clearTimeout(deadline)
          setStatus('ready')
        }
      } catch {
        // A sleeping server, an offline connection, or a failed probe can recover on retry.
      } finally {
        clearTimeout(requestTimer)
      }
      if (!stopped) retryTimer = setTimeout(() => void check(), 5_000)
    }

    void check()
    return () => {
      stopped = true
      controller?.abort()
      clearTimeout(deadline)
      clearTimeout(requestTimer)
      clearTimeout(retryTimer)
    }
  }, [attempt])

  if (status === 'ready') return children

  const unavailable = status === 'unavailable'
  return (
    <>
      <main className="flex min-h-dvh items-start justify-center bg-muted/30 px-6 py-12">
        <div className="flex items-center gap-3 text-lg font-semibold">
          <BrandLogo className="size-12 rounded-lg" />
          BINGO CRM
        </div>
      </main>
      <Dialog open>
        <DialogContent
          showCloseButton={false}
          className="max-w-[calc(100vw_-_2rem)] sm:max-w-md"
          onEscapeKeyDown={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            {unavailable ? (
              <ServerOff className="size-6" aria-hidden="true" />
            ) : (
              <LoaderCircle
                className="size-6 animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
            )}
          </div>
          <DialogHeader>
            <DialogTitle>
              {unavailable ? 'Unable to connect right now' : 'Waking up the server'}
            </DialogTitle>
            <DialogDescription className="leading-relaxed">
              {unavailable
                ? 'The server is taking longer than expected. Check your internet connection and try again.'
                : 'We are getting your workspace ready. After a period of inactivity, this can take a minute. You can continue as soon as it is ready.'}
            </DialogDescription>
          </DialogHeader>
          {unavailable ? (
            <Button
              onClick={() => {
                setStatus('connecting')
                setAttempt((value) => value + 1)
              }}
            >
              <RefreshCw aria-hidden="true" />
              Try again
            </Button>
          ) : (
            <p role="status" className="text-sm text-muted-foreground">
              Connecting automatically. Please keep this page open.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
