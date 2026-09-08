import { useState, type ComponentProps } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'
import { browserTimezone, isTimezone } from '@/lib/dates'
import { cn } from '@/lib/utils'

const zones = [
  ...new Set(['UTC', 'Asia/Yangon', browserTimezone(), ...Intl.supportedValuesOf('timeZone')]),
].sort()
type Props = Omit<ComponentProps<typeof Button>, 'value' | 'onChange'> & {
  value: string
  onChange: (value: string) => void
  label: string
}
export function TimezoneField({ value, onChange, label, disabled, className, ...props }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const available = [
    ...new Set([
      ...zones,
      ...(isTimezone(value) ? [value] : []),
      ...(isTimezone(search.trim()) ? [search.trim()] : []),
    ]),
  ]
  return (
    <Popover
      open={open && !disabled}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) setSearch('')
      }}
    >
      <PopoverTrigger asChild>
        <Button
          {...props}
          type="button"
          variant="outline"
          role="combobox"
          aria-label={label}
          aria-expanded={open}
          disabled={disabled}
          className={cn('w-full justify-between font-normal', className)}
        >
          <span className="truncate">{value || 'Choose timezone'}</span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] min-w-[250px] max-w-[calc(100vw-2rem)] p-0"
      >
        <Command>
          <CommandInput
            placeholder="Search timezones…"
            aria-label="Search timezones"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList aria-label="Timezones">
            <CommandEmpty>No matching timezone.</CommandEmpty>
            <CommandGroup>
              {available.map((zone) => (
                <CommandItem
                  key={zone}
                  value={zone}
                  onSelect={() => {
                    onChange(zone)
                    setOpen(false)
                  }}
                >
                  <span>{zone}</span>
                  <Check
                    className={cn('ml-auto size-4', value !== zone && 'invisible')}
                    aria-hidden="true"
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
