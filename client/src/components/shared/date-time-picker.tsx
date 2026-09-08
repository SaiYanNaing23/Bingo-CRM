import { useState, type ComponentProps, type ChangeEvent } from 'react'
import { format, isValid, parse } from 'date-fns'
import { CalendarIcon, X } from 'lucide-react'
import type { DropdownProps } from 'react-day-picker'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ChoiceSelect } from './choice-select'

type Props = Omit<ComponentProps<typeof Input>, 'type' | 'value' | 'onChange'> & {
  value: string
  onChange: (value: string) => void
  label: string
}

function calendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
  const date = parse(value, 'yyyy-MM-dd', new Date())
  return isValid(date) && format(date, 'yyyy-MM-dd') === value ? date : undefined
}

// DayPicker supplies select-shaped change handlers; render its captions with shadcn Select.
function CalendarDropdown({
  options,
  value,
  onChange,
  'aria-label': label,
  disabled,
}: DropdownProps) {
  return (
    <ChoiceSelect
      aria-label={label}
      value={String(value)}
      disabled={disabled}
      className="h-8 w-auto border-none px-2 shadow-none"
      options={(options ?? []).map((option) => ({
        value: String(option.value),
        label: option.label,
        disabled: option.disabled,
      }))}
      onChange={(next) => onChange?.({ target: { value: next } } as ChangeEvent<HTMLSelectElement>)}
    />
  )
}

export function DateTimePicker({ value, onChange, label, id, disabled, onBlur, ...props }: Props) {
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState<Date>()
  // Keep wall-clock strings in the selected form timezone. Never convert the calendar
  // Date to UTC here: the existing payload mapper owns timezone/DST validation.
  const [dateText = '', timeText = ''] = value.split('T')
  const selected = calendarDate(dateText)
  const setDate = (date: string) =>
    onChange(date ? `${date}T${timeText || '09:00:00'}` : timeText ? `T${timeText}` : '')
  return (
    <div className="space-y-2" data-slot="date-time-picker">
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[150px] flex-1">
          <Input
            {...props}
            id={id}
            type="text"
            inputMode="numeric"
            placeholder="YYYY-MM-DD"
            autoComplete="off"
            aria-label={label}
            value={dateText}
            disabled={disabled}
            onBlur={onBlur}
            onChange={(event) => setDate(event.target.value)}
            className="pr-10"
          />
          <Popover
            open={open && !disabled}
            onOpenChange={(next) => {
              setOpen(next)
              if (next) setMonth(selected || new Date())
            }}
          >
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 size-9"
                aria-label={`Open calendar for ${label.toLowerCase()}`}
                disabled={disabled}
              >
                <CalendarIcon className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0" aria-label={`${label} calendar`}>
              <Calendar
                mode="single"
                selected={selected}
                month={month}
                onMonthChange={setMonth}
                captionLayout="dropdown"
                startMonth={new Date(Math.min(1900, selected?.getFullYear() ?? 1900), 0)}
                endMonth={new Date(Math.max(2100, selected?.getFullYear() ?? 2100), 11)}
                components={{ Dropdown: CalendarDropdown }}
                onSelect={(date) => {
                  if (date) setDate(format(date, 'yyyy-MM-dd'))
                  setOpen(false)
                }}
                autoFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Input
            type="time"
            step="1"
            aria-label={`${label} time`}
            aria-required={props['aria-required']}
            aria-invalid={props['aria-invalid']}
            aria-describedby={props['aria-describedby']}
            value={timeText}
            disabled={disabled}
            onBlur={onBlur}
            onChange={(event) =>
              onChange(dateText || event.target.value ? `${dateText}T${event.target.value}` : '')
            }
            className="w-[138px] shrink-0 appearance-none [&::-webkit-calendar-picker-indicator]:hidden"
          />
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 shrink-0"
              disabled={disabled}
              aria-label={`Clear ${label.toLowerCase()}`}
              onClick={() => onChange('')}
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
