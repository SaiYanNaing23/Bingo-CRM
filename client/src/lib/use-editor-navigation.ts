import { useEffect, useRef } from 'react'
import { useLocation, useNavigate, type NavigateOptions } from 'react-router'

// A completed request must not redirect someone who already left the editor.
export function useEditorNavigation() {
  const navigate = useNavigate()
  const { key } = useLocation()
  const currentKey = useRef<string | null>(key)
  useEffect(() => {
    currentKey.current = key
    return () => {
      currentKey.current = null
    }
  }, [key])
  return (to: string, options?: NavigateOptions) => {
    if (currentKey.current === key) void navigate(to, options)
  }
}
