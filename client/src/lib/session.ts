const key = 'devtrack.session'
const read = () => {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}
let token: string | null = read()
const listeners = new Set<() => void>()
export const session = {
  token: () => token,
  set(value: string | null) {
    token = value
    try {
      if (value) sessionStorage.setItem(key, value)
      else sessionStorage.removeItem(key)
    } catch {
      /* Memory session remains usable when storage is unavailable. */
    }
  },
  expire(requestToken: string) {
    if (token !== requestToken) return
    session.set(null)
    listeners.forEach((listener) => listener())
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}
