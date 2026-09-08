export const appearanceStorageKey = 'devtrack.appearance'
export const colorSchemeQuery = '(prefers-color-scheme: dark)'

// Swatches mirror each preset's primary token in styles/*.css.
export const themePresets = [
  {
    id: 'amber',
    name: 'Amber Stone',
    description: 'Warm and familiar',
    swatch: 'oklch(0.555 0.163 48.998)',
  },
  {
    id: 'slate',
    name: 'Slate',
    description: 'Quiet and classic',
    swatch: 'oklch(0.379 0.046 257.287)',
  },
  {
    id: 'blue',
    name: 'Blue',
    description: 'Clear and focused',
    swatch: 'oklch(0.488 0.243 264.376)',
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Calm and grounded',
    swatch: 'oklch(0.508 0.118 165.612)',
  },
  {
    id: 'violet',
    name: 'Violet',
    description: 'A little character',
    swatch: 'oklch(0.491 0.27 292.581)',
  },
  {
    id: 'rose',
    name: 'Rose',
    description: 'Soft and expressive',
    swatch: 'oklch(0.514 0.222 16.935)',
  },
] as const
export type ThemePreset = (typeof themePresets)[number]['id']
export type ThemeMode = 'light' | 'dark' | 'system'
export type Appearance = { preset: ThemePreset; mode: ThemeMode }
export const defaultAppearance: Appearance = { preset: 'amber', mode: 'light' }

export function parseAppearance(raw: string | null): Appearance {
  try {
    const value: unknown = JSON.parse(raw || 'null')
    if (!value || typeof value !== 'object') return { ...defaultAppearance }
    const { preset, mode } = value as Record<string, unknown>
    return {
      preset: themePresets.find((item) => item.id === preset)?.id ?? defaultAppearance.preset,
      mode:
        mode === 'light' || mode === 'dark' || mode === 'system' ? mode : defaultAppearance.mode,
    }
  } catch {
    return { ...defaultAppearance }
  }
}

export function readAppearance() {
  try {
    return { preferences: parseAppearance(localStorage.getItem(appearanceStorageKey)), saved: true }
  } catch {
    return { preferences: { ...defaultAppearance }, saved: false }
  }
}

export function saveAppearance(preferences: Appearance) {
  try {
    localStorage.setItem(appearanceStorageKey, JSON.stringify(preferences))
    return true
  } catch {
    // Storage may be disabled; the current tab can still change its appearance.
    return false
  }
}

export function shufflePreset(current: ThemePreset): ThemePreset {
  const choices = themePresets.filter((preset) => preset.id !== current)
  return choices[Math.floor(Math.random() * choices.length)].id
}

export function applyAppearance(preferences: Appearance, systemDark: boolean) {
  const mode = preferences.mode === 'system' ? (systemDark ? 'dark' : 'light') : preferences.mode
  const root = document.documentElement
  root.classList.toggle('dark', mode === 'dark')
  root.dataset.theme = preferences.preset
  root.style.colorScheme = mode
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', getComputedStyle(root).getPropertyValue('--background').trim())
}
