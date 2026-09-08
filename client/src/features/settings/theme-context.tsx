import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import {
  type Appearance,
  type ThemeMode,
  type ThemePreset,
  appearanceStorageKey,
  colorSchemeQuery,
  defaultAppearance,
  applyAppearance,
  parseAppearance,
  readAppearance,
  saveAppearance,
  shufflePreset,
} from './appearance'

function subscribeSystemTheme(callback: () => void) {
  const media = window.matchMedia(colorSchemeQuery)
  media.addEventListener('change', callback)
  return () => media.removeEventListener('change', callback)
}
const getSystemDark = () => window.matchMedia(colorSchemeQuery).matches

type ThemeContextValue = Appearance & {
  resolvedMode: 'light' | 'dark'
  saved: boolean
  setMode: (mode: ThemeMode) => void
  setPreset: (preset: ThemePreset) => void
  shuffle: () => void
  reset: () => void
}
const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [{ preferences, saved }, setState] = useState(readAppearance)
  const systemDark = useSyncExternalStore(subscribeSystemTheme, getSystemDark)
  const resolvedMode =
    preferences.mode === 'system' ? (systemDark ? 'dark' : 'light') : preferences.mode

  useLayoutEffect(() => {
    applyAppearance(preferences, systemDark)
  }, [preferences, systemDark])

  useEffect(() => {
    function sync(event: StorageEvent) {
      if (event.key !== appearanceStorageKey && event.key !== null) return
      try {
        if (event.storageArea !== localStorage) return
      } catch {
        return
      }
      setState({ preferences: parseAppearance(event.newValue), saved: true })
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  function update(next: Appearance) {
    setState({ preferences: next, saved: saveAppearance(next) })
  }
  return (
    <ThemeContext.Provider
      value={{
        ...preferences,
        saved,
        resolvedMode,
        setMode: (mode) => update({ ...preferences, mode }),
        setPreset: (preset) => update({ ...preferences, preset }),
        shuffle: () => update({ ...preferences, preset: shufflePreset(preferences.preset) }),
        reset: () => update({ ...defaultAppearance }),
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used inside ThemeProvider')
  return context
}
