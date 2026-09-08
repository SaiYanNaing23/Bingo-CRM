import { useEffect, useState } from 'react'
export function useDebounced<T>(value: T, delay = 300) {
  const [current, setCurrent] = useState(value)
  useEffect(() => {
    const timeout = setTimeout(() => setCurrent(value), delay)
    return () => clearTimeout(timeout)
  }, [value, delay])
  return current
}
