import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { request, ApiError } from '@/lib/api-client'
import type { Success } from '@/lib/api-types'
import { queryClient } from '@/lib/query-client'
import { session } from '@/lib/session'

interface User {
  id: string
  email: string
  role: 'ADMIN' | 'USER'
  fullName?: string
}
interface Auth {
  user: User | null
  status: 'loading' | 'ready' | 'error'
  message: string
  verify: () => void
  login: (
    values: { email: string; password: string; fullName?: string },
    register?: boolean,
  ) => Promise<void>
  logout: () => void
}
const Context = createContext<Auth | null>(null)
export const useAuth = () => {
  const auth = useContext(Context)
  if (!auth) throw new Error('AuthProvider is required')
  return auth
}
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<Auth['status']>('loading')
  const [message, setMessage] = useState('')
  const clear = useCallback((reason = '') => {
    session.set(null)
    void queryClient.cancelQueries()
    queryClient.clear()
    setUser(null)
    setStatus('ready')
    setMessage(reason)
  }, [])
  const verify = useCallback(async () => {
    const token = session.token()
    if (!token) {
      setStatus('ready')
      return
    }
    setStatus('loading')
    try {
      const result = await request<Success<{ user: User }>>('/auth/me')
      if (session.token() === token) {
        setUser(result.data.user)
        setStatus('ready')
        setMessage('')
      }
    } catch (error) {
      if (session.token() !== token) return
      if (error instanceof ApiError && error.status === 401)
        clear('Your session expired. Please sign in again.')
      else {
        setStatus('error')
        setMessage(error instanceof Error ? error.message : 'Unable to verify your session.')
      }
    }
  }, [clear])
  useEffect(() => {
    const unsubscribe = session.subscribe(() =>
      clear('Your session expired. Please sign in again.'),
    )
    void verify()
    return unsubscribe
  }, [clear, verify])
  const login: Auth['login'] = async (values, register = false) => {
    const result = await request<Success<{ user: User; token: string }>>(
      `/auth/${register ? 'register' : 'login'}`,
      { method: 'POST', body: values, anonymous: true },
    )
    await queryClient.cancelQueries()
    queryClient.clear()
    session.set(result.data.token)
    setUser(result.data.user)
    setStatus('ready')
    setMessage('')
  }
  return (
    <Context.Provider
      value={{ user, status, message, verify: () => void verify(), login, logout: () => clear() }}
    >
      {children}
    </Context.Provider>
  )
}
