import type { Params } from './api-types'
import { session } from './session'

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public details?: { fieldErrors?: Record<string, string[]> },
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
export const apiBase = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1'
).replace(/\/$/, '')
export async function request<T>(
  path: string,
  options: {
    method?: string
    body?: unknown
    params?: Params
    signal?: AbortSignal
    anonymous?: boolean
  } = {},
): Promise<T> {
  const token = options.anonymous ? null : session.token()
  const search = new URLSearchParams()
  Object.entries(options.params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value))
  })
  let response: Response
  try {
    response = await fetch(`${apiBase}${path}${search.size ? `?${search}` : ''}`, {
      method: options.method ?? 'GET',
      signal: options.signal,
      headers: {
        Accept: 'application/json',
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error
    throw new ApiError(
      'Unable to reach the server. Check your connection and try again.',
      0,
      'NETWORK_ERROR',
    )
  }
  if (response.status === 401 && token) session.expire(token)
  const body = await response.json().catch(() => null)
  if (!response.ok || body?.success !== true) {
    throw new ApiError(
      body?.error ||
        (response.status === 429
          ? 'Too many requests. Please wait a moment before trying again.'
          : 'The server could not complete this request. Please try again.'),
      response.status,
      body?.code || 'REQUEST_FAILED',
      body?.details,
    )
  }
  return body as T
}
export function safeReturnPath(value: unknown, fallback = '/companies') {
  return typeof value === 'string' &&
    /^\/(companies|contacts|applications|tasks|settings)(\/|\?|$)/.test(value) &&
    !value.includes('\\')
    ? value
    : fallback
}
