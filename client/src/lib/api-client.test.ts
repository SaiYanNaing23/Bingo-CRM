import { afterEach, describe, expect, it, vi } from 'vitest'
import { request, safeReturnPath } from './api-client'
import { session } from './session'
afterEach(() => {
  vi.unstubAllGlobals()
  session.set(null)
})
describe('HTTP and session boundary', () => {
  it('attaches a bearer token and keeps encoded search parameters out of JSON bodies', async () => {
    session.set('test-token')
    const fetcher = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ success: true, data: [] })))
    vi.stubGlobal('fetch', fetcher)
    await request('/contacts', { params: { search: 'Sarah & Co', page: 2 } })
    expect(fetcher.mock.calls[0][0]).toContain('search=Sarah+%26+Co&page=2')
    expect(fetcher.mock.calls[0][1].headers.Authorization).toBe('Bearer test-token')
    expect(fetcher.mock.calls[0][1].body).toBeUndefined()
  })
  it('does not expire a newly signed-in session when an old request returns 401', async () => {
    session.set('old-session')
    let finish!: (response: Response) => void
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            finish = resolve
          }),
      ),
    )
    const pending = request('/companies')
    session.set('new-session')
    finish(new Response(JSON.stringify({ success: false, error: 'Expired' }), { status: 401 }))
    await expect(pending).rejects.toThrow('Expired')
    expect(session.token()).toBe('new-session')
  })
  it('expires the matching session and reports non-JSON failures', async () => {
    session.set('expired-session')
    const expired = vi.fn()
    const unsubscribe = session.subscribe(expired)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('Unauthorized', { status: 401 })))
    await expect(request('/tasks')).rejects.toMatchObject({ status: 401 })
    expect(expired).toHaveBeenCalledOnce()
    expect(session.token()).toBeNull()
    unsubscribe()
  })
  it('keeps invalid login errors local and rejects unsafe return destinations', async () => {
    session.set('existing-session')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: false, error: 'Invalid email or password' }), {
          status: 401,
        }),
      ),
    )
    await expect(request('/auth/login', { anonymous: true })).rejects.toThrow(
      'Invalid email or password',
    )
    expect(session.token()).toBe('existing-session')
    expect(safeReturnPath('//example.com')).toBe('/companies')
    expect(safeReturnPath('/\\example.com')).toBe('/companies')
    expect(safeReturnPath('/tasks/today?timezone=UTC')).toBe('/tasks/today?timezone=UTC')
    expect(safeReturnPath('/settings/appearance')).toBe('/settings/appearance')
    expect(safeReturnPath('/settings-external')).toBe('/companies')
  })
})
