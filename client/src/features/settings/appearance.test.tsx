import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  appearanceStorageKey,
  defaultAppearance,
  parseAppearance,
  shufflePreset,
  themePresets,
} from './appearance'
import { ThemeProvider, useTheme } from './theme-context'

let systemDark = false
let media: EventTarget
beforeEach(() => {
  localStorage.clear()
  systemDark = false
  media = new EventTarget()
  vi.stubGlobal('matchMedia', () => ({
    get matches() {
      return systemDark
    },
    addEventListener: media.addEventListener.bind(media),
    removeEventListener: media.removeEventListener.bind(media),
  }))
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.documentElement.classList.remove('dark')
  delete document.documentElement.dataset.theme
  document.documentElement.style.removeProperty('color-scheme')
})
function Controls() {
  const theme = useTheme()
  return (
    <>
      <output>
        {theme.preset}/{theme.mode}/{theme.resolvedMode}/{String(theme.saved)}
      </output>
      <button onClick={() => theme.setMode('dark')}>Dark</button>
      <button onClick={() => theme.setMode('system')}>System</button>
      <button onClick={() => theme.setPreset('forest')}>Forest</button>
      <button onClick={theme.shuffle}>Shuffle</button>
      <button onClick={theme.reset}>Reset</button>
    </>
  )
}
const mount = () =>
  render(
    <ThemeProvider>
      <Controls />
    </ThemeProvider>,
  )

describe('browser appearance preferences', () => {
  it('recovers from corrupt or obsolete preferences and retains valid individual choices', () => {
    for (const raw of [
      null,
      '',
      '{bad json',
      'null',
      '42',
      '[]',
      '{"preset":"old","mode":"unknown"}',
    ]) {
      expect(parseAppearance(raw)).toEqual(defaultAppearance)
    }
    expect(parseAppearance('{"preset":"old","mode":"dark"}')).toEqual({
      preset: 'amber',
      mode: 'dark',
    })
  })
  it('persists palette and mode, restores them on mount, and resets both to the supplied default', () => {
    const view = mount()
    expect(screen.getByRole('status')).toHaveTextContent('amber/light/light/true')
    fireEvent.click(screen.getByText('Dark'))
    fireEvent.click(screen.getByText('Forest'))
    expect(document.documentElement).toHaveClass('dark')
    expect(document.documentElement.dataset.theme).toBe('forest')
    expect(JSON.parse(localStorage.getItem(appearanceStorageKey)!)).toEqual({
      preset: 'forest',
      mode: 'dark',
    })
    view.unmount()
    mount()
    expect(screen.getByRole('status')).toHaveTextContent('forest/dark/dark/true')
    fireEvent.click(screen.getByText('Shuffle'))
    expect(document.documentElement.dataset.theme).not.toBe('forest')
    expect(document.documentElement).toHaveClass('dark')
    fireEvent.click(screen.getByText('Reset'))
    expect(screen.getByRole('status')).toHaveTextContent('amber/light/light/true')
    expect(document.documentElement).not.toHaveClass('dark')
    expect(JSON.parse(localStorage.getItem(appearanceStorageKey)!)).toEqual(defaultAppearance)
  })
  it('follows live device changes only in system mode without storing the resolved mode', () => {
    mount()
    const changeSystem = (dark: boolean) =>
      act(() => {
        systemDark = dark
        media.dispatchEvent(new Event('change'))
      })
    changeSystem(true)
    expect(document.documentElement).not.toHaveClass('dark')
    fireEvent.click(screen.getByText('System'))
    expect(document.documentElement).toHaveClass('dark')
    changeSystem(false)
    expect(document.documentElement).not.toHaveClass('dark')
    expect(JSON.parse(localStorage.getItem(appearanceStorageKey)!).mode).toBe('system')
    fireEvent.click(screen.getByText('Dark'))
    changeSystem(true)
    changeSystem(false)
    expect(document.documentElement).toHaveClass('dark')
  })
  it('synchronizes other tabs and restores defaults when preferences are cleared', () => {
    mount()
    const sync = (key: string | null, newValue: string | null, storageArea = localStorage) =>
      act(() => window.dispatchEvent(new StorageEvent('storage', { key, newValue, storageArea })))
    const next = JSON.stringify({ preset: 'violet', mode: 'dark' })
    sync('unrelated', next)
    sync(appearanceStorageKey, next, sessionStorage)
    expect(document.documentElement).not.toHaveClass('dark')
    sync(appearanceStorageKey, next)
    expect(screen.getByRole('status')).toHaveTextContent('violet/dark/dark/true')
    sync(null, null)
    expect(screen.getByRole('status')).toHaveTextContent('amber/light/light/true')
  })
  it('allows changes when browser storage is blocked and reports that they are not saved', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Blocked')
    })
    mount()
    expect(screen.getByRole('status')).toHaveTextContent('amber/light/light/false')
    fireEvent.click(screen.getByText('Dark'))
    fireEvent.click(screen.getByText('Forest'))
    expect(screen.getByRole('status')).toHaveTextContent('forest/dark/dark/false')
    expect(document.documentElement).toHaveClass('dark')
  })
  it('always shuffles to a supported, different palette', () => {
    const random = vi.spyOn(Math, 'random')
    for (const current of themePresets) {
      for (const value of [0, 0.2, 0.4, 0.6, 0.8, 0.999999]) {
        random.mockReturnValue(value)
        const next = shufflePreset(current.id)
        expect(next).not.toBe(current.id)
        expect(themePresets.some((preset) => preset.id === next)).toBe(true)
      }
    }
  })
})
