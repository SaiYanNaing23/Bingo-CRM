import { Check, Monitor, Moon, Palette, RotateCcw, Shuffle, Sun } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/shared/states'
import { StatusBadge } from '@/components/shared/status-badge'
import { cn } from '@/lib/utils'
import { themePresets } from './appearance'
import { useTheme } from './theme-context'

const modes = [
  { id: 'light', label: 'Light', description: 'A bright workspace', icon: Sun },
  { id: 'dark', label: 'Dark', description: 'Easy on the eyes', icon: Moon },
  { id: 'system', label: 'System', description: 'Follow your device', icon: Monitor },
] as const

export default function AppearancePage() {
  const theme = useTheme()
  const active = themePresets.find((preset) => preset.id === theme.preset)!
  return (
    <>
      <PageHeader title="Settings" description="Make this workspace feel like your own." />
      <div className="mb-7 flex items-center gap-2 border-b pb-4 text-sm font-medium">
        <Palette className="size-4" aria-hidden="true" /> Appearance
      </div>
      <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <section className="panel p-5 sm:p-6" aria-labelledby="mode-title">
            <h2 id="mode-title" className="text-base font-semibold">
              Color mode
            </h2>
            <p className="mb-5 mt-1 text-sm text-muted-foreground">
              Use light, dark, or your device’s setting.
            </p>
            <fieldset className="grid gap-3 sm:grid-cols-3">
              <legend className="sr-only">Color mode</legend>
              {modes.map((mode) => (
                <label key={mode.id} className="relative cursor-pointer">
                  <input
                    type="radio"
                    name="color-mode"
                    value={mode.id}
                    checked={theme.mode === mode.id}
                    onChange={() => theme.setMode(mode.id)}
                    className="peer sr-only"
                    aria-label={mode.label}
                  />
                  <span className="flex h-full flex-col gap-3 rounded-lg border p-4 transition-colors peer-checked:border-primary peer-checked:bg-primary/5 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring hover:bg-muted/50">
                    <mode.icon className="size-5 text-muted-foreground" aria-hidden="true" />
                    <span className="font-medium">{mode.label}</span>
                    <span className="text-xs text-muted-foreground">{mode.description}</span>
                  </span>
                  {theme.mode === mode.id && (
                    <Check className="absolute right-3 top-3 size-4" aria-hidden="true" />
                  )}
                </label>
              ))}
            </fieldset>
            {theme.mode === 'system' && (
              <p className="mt-4 text-xs text-muted-foreground">
                Your device is currently using {theme.resolvedMode} mode.
              </p>
            )}
          </section>

          <section className="panel p-5 sm:p-6" aria-labelledby="palette-title">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 id="palette-title" className="text-base font-semibold">
                  Theme palette
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  A small change of color, across your whole workspace.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={theme.shuffle}>
                <Shuffle /> Shuffle theme
              </Button>
            </div>
            <fieldset className="grid gap-3 sm:grid-cols-2">
              <legend className="sr-only">Theme palette</legend>
              {themePresets.map((preset) => (
                <label key={preset.id} className="cursor-pointer">
                  <input
                    type="radio"
                    name="theme-palette"
                    value={preset.id}
                    checked={theme.preset === preset.id}
                    onChange={() => theme.setPreset(preset.id)}
                    className="peer sr-only"
                    aria-label={preset.name}
                  />
                  <span className="flex h-full items-center gap-3 rounded-lg border p-4 transition-colors peer-checked:border-primary peer-checked:bg-primary/5 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring hover:bg-muted/50">
                    <span
                      className="size-8 shrink-0 rounded-full border border-black/10"
                      style={{ backgroundColor: preset.swatch }}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">
                        {preset.name}
                        {preset.id === 'amber' && (
                          <span className="ml-2 text-[10px] font-normal uppercase tracking-wide text-muted-foreground">
                            Default
                          </span>
                        )}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {preset.description}
                      </span>
                    </span>
                    <Check
                      className={cn('size-4 shrink-0', theme.preset !== preset.id && 'invisible')}
                      aria-hidden="true"
                    />
                  </span>
                </label>
              ))}
            </fieldset>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <p
              role="status"
              aria-live="polite"
              className="text-xs leading-relaxed text-muted-foreground"
            >
              {active.name} ·{' '}
              {theme.mode === 'system'
                ? `System (${theme.resolvedMode})`
                : theme.mode === 'dark'
                  ? 'Dark'
                  : 'Light'}
              <span className="mt-1 block">
                {theme.saved
                  ? 'Applied instantly. Preferences stay in this browser.'
                  : 'Applied for now. Browser storage is unavailable, so changes won’t survive a reload.'}
              </span>
            </p>
            <Button variant="ghost" size="sm" onClick={theme.reset}>
              <RotateCcw /> Reset to default
            </Button>
          </div>
        </div>

        <aside className="panel min-w-0 overflow-hidden" aria-label="Theme preview">
          <div className="border-b bg-muted/40 px-5 py-4">
            <h2 className="text-sm font-semibold">A little preview</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {active.name} in {theme.resolvedMode} mode
            </p>
          </div>
          <div className="space-y-6 p-5">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-primary p-2 text-primary-foreground">
                <Palette className="size-4" />
              </span>
              <div>
                <p className="text-sm font-semibold">Your next step</p>
                <p className="text-xs text-muted-foreground">Sample task</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="preview-note">A quick note</Label>
              <Input id="preview-note" placeholder="Something to remember…" />
              <p className="text-xs text-muted-foreground">
                Try the controls. This preview isn’t saved.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge>Follow-up</Badge>
              <Badge variant="secondary">This week</Badge>
              <StatusBadge value="COMPLETED" />
            </div>
            <div className="flex items-center justify-between rounded-md border bg-muted/30 p-3 text-xs">
              <span>Follow up with Sarah</span>
              <StatusBadge value="IN_PROGRESS" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link to="/tasks">View tasks</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/companies">Companies</Link>
              </Button>
            </div>
          </div>
          <p className="border-t bg-muted/20 px-5 py-4 text-xs leading-relaxed text-muted-foreground">
            Familiar controls, clear tables, and a little room to breathe.
          </p>
        </aside>
      </div>
    </>
  )
}
