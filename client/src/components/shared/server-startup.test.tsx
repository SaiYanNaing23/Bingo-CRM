import { StrictMode } from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ServerStartup } from './server-startup'
import { AuthProvider, useAuth } from '@/features/auth/auth-context'
import { apiBase } from '@/lib/api-client'
import { queryClient } from '@/lib/query-client'
import { session } from '@/lib/session'

const healthy = () => new Response(JSON.stringify({ success: true, data: { status: 'ok' } }))

function AccountAction() {
  const auth = useAuth()
  return <button>{auth.user ? auth.user.email : 'Sign in'}</button>
}

function mount() {
  return render(
    <ServerStartup>
      <AuthProvider>
        <AccountAction />
      </AuthProvider>
    </ServerStartup>,
  )
}

beforeEach(() => {
  vi.useFakeTimers()
  session.set(null)
})

afterEach(() => {
  cleanup()
  queryClient.clear()
  session.set(null)
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('server startup', () => {
  it('blocks actions and saved-session verification until a fresh anonymous probe succeeds', async () => {
    session.set('saved-session')
    let finish!: (response: Response) => void
    const fetcher = vi.fn((url: string) => {
      if (url.endsWith('/health/ready'))
        return new Promise<Response>((resolve) => {
          finish = resolve
        })
      return Promise.resolve(
        new Response(
          JSON.stringify({ success: true, data: { user: { email: 'user@example.com' } } }),
        ),
      )
    })
    vi.stubGlobal('fetch', fetcher)
    mount()

    expect(screen.getByRole('dialog', { name: 'Waking up the server' })).toBeVisible()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(fetcher).toHaveBeenCalledOnce()
    expect(fetcher.mock.calls[0][0]).toBe(`${apiBase}/health/ready`)
    const options = vi.mocked(fetch).mock.calls[0][1]!
    expect(options.cache).toBe('no-store')
    expect(options.headers).not.toHaveProperty('Authorization')

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(screen.getByRole('dialog')).toBeVisible()
    await act(async () => finish(healthy()))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'user@example.com' })).toBeEnabled()
    expect(fetcher.mock.calls[1][0]).toBe(`${apiBase}/auth/me`)
    await act(async () => vi.advanceTimersByTimeAsync(180_000))
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('retries gateway errors, malformed responses, and database startup failures before unlocking', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response('<html>Starting</html>', { status: 502 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: false }), { status: 503 }))
      .mockResolvedValueOnce(healthy())
    vi.stubGlobal('fetch', fetcher)
    mount()

    await act(async () => vi.advanceTimersByTimeAsync(14_999))
    expect(screen.getByRole('dialog')).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Sign in' })).not.toBeInTheDocument()
    await act(async () => vi.advanceTimersByTimeAsync(1))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled()
    expect(fetcher).toHaveBeenCalledTimes(4)
  })

  it('offers a working retry after an offline connection exceeds the startup deadline', async () => {
    const fetcher = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    vi.stubGlobal('fetch', fetcher)
    mount()
    await act(async () => vi.advanceTimersByTimeAsync(120_000))

    expect(screen.getByRole('dialog', { name: 'Unable to connect right now' })).toBeVisible()
    const count = fetcher.mock.calls.length
    await act(async () => vi.advanceTimersByTimeAsync(30_000))
    expect(fetcher).toHaveBeenCalledTimes(count)
    fetcher.mockResolvedValue(healthy())
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Try again' })))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled()
  })

  it('aborts hung requests and recovers on the next probe', async () => {
    let signal!: AbortSignal
    const fetcher = vi
      .fn()
      .mockImplementationOnce(
        (_url, options) =>
          new Promise((_resolve, reject) => {
            signal = options.signal
            signal.addEventListener('abort', () =>
              reject(new DOMException('Aborted', 'AbortError')),
            )
          }),
      )
      .mockResolvedValueOnce(healthy())
    vi.stubGlobal('fetch', fetcher)
    mount()
    await act(async () => vi.advanceTimersByTimeAsync(15_000))
    expect(signal.aborted).toBe(true)
    expect(screen.getByRole('dialog')).toBeVisible()
    await act(async () => vi.advanceTimersByTimeAsync(5_000))
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled()
  })

  it('cancels pending work on unmount and ignores a late successful response', async () => {
    let finish!: (response: Response) => void
    const fetcher = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve
        }),
    )
    vi.stubGlobal('fetch', fetcher)
    const view = mount()
    const signal = vi.mocked(fetch).mock.calls[0][1]!.signal!
    view.unmount()
    expect(signal.aborted).toBe(true)
    await act(async () => {
      finish(healthy())
      await vi.advanceTimersByTimeAsync(180_000)
    })
    expect(fetcher).toHaveBeenCalledOnce()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('cleans up the extra development StrictMode check without creating a retry loop', async () => {
    const signals: AbortSignal[] = []
    const fetcher = vi.fn((_url, options) => {
      signals.push(options.signal)
      return Promise.resolve(healthy())
    })
    vi.stubGlobal('fetch', fetcher)
    await act(async () => {
      render(
        <StrictMode>
          <ServerStartup>
            <button>Continue</button>
          </ServerStartup>
        </StrictMode>,
      )
    })
    expect(signals[0].aborted).toBe(true)
    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled()
    await act(async () => vi.advanceTimersByTimeAsync(180_000))
    expect(fetcher).toHaveBeenCalledTimes(2)
  })
})
