import { useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { useRecord, useRecords, titleOf } from '@/lib/resources'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'
import { useDebounced } from '@/lib/use-debounced'
import { cn } from '@/lib/utils'

export function RecordPicker({
  kind,
  id,
  label,
  value,
  onChange,
  companyId,
  disabled,
  invalid,
  describedBy,
  required,
  onBlur,
  ref,
}: {
  kind: 'companies' | 'contacts'
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  companyId?: string
  disabled?: boolean
  invalid?: boolean
  describedBy?: string
  required?: boolean
  onBlur?: () => void
  ref?: React.Ref<HTMLButtonElement>
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debounced = useDebounced(search)
  const records = useRecords(
    kind,
    { search: debounced, page, limit: 20, companyId },
    !disabled && open,
  )
  const selected = useRecord(kind, value || undefined)
  const rows = records.data?.data ?? []
  const pinned =
    selected.data?.data && !rows.some((row) => row.id === value) ? selected.data.data : null
  const selectedTitle = rows.find((row) => row.id === value) || selected.data?.data
  const choose = (next: string) => {
    onChange(next)
    setOpen(false)
    onBlur?.()
  }
  return (
    <Popover open={open && !disabled} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          ref={ref}
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={label}
          aria-required={required}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          onBlur={onBlur}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className={cn('truncate', !value && 'text-muted-foreground')}>
            {disabled
              ? 'Choose a company first'
              : selectedTitle
                ? titleOf(selectedTitle)
                : value
                  ? selected.isPending
                    ? 'Loading selected record…'
                    : 'Selected record unavailable'
                  : `Select ${label.toLowerCase()}`}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] min-w-[250px] max-w-[calc(100vw-2rem)] p-0"
      >
        <Command shouldFilter={false}>
          <CommandInput
            aria-label={`Search ${label.toLowerCase()}`}
            placeholder={`Search ${kind}…`}
            value={search}
            onValueChange={(next) => {
              setSearch(next)
              setPage(1)
            }}
          />
          <CommandList aria-label={`${label} options`}>
            <CommandGroup>
              <CommandItem value="clear" onSelect={() => choose('')}>
                Clear selection
              </CommandItem>
              {pinned && (
                <CommandItem value={pinned.id} onSelect={() => choose(pinned.id)}>
                  <span className="truncate">{titleOf(pinned)}</span>
                  <Check className="ml-auto size-4 shrink-0" aria-hidden="true" />
                </CommandItem>
              )}
              {rows.map((row) => (
                <CommandItem key={row.id} value={row.id} onSelect={() => choose(row.id)}>
                  <span className="truncate">{titleOf(row)}</span>
                  <Check
                    className={cn('ml-auto size-4 shrink-0', value !== row.id && 'invisible')}
                    aria-hidden="true"
                  />
                </CommandItem>
              ))}
            </CommandGroup>
            {!records.isFetching && !records.isError && !rows.length && (
              <p className="px-3 py-5 text-center text-sm text-muted-foreground">
                No matching records.
              </p>
            )}
          </CommandList>
        </Command>
        {records.isError ? (
          <div
            role="alert"
            className="flex items-center justify-between border-t p-3 text-xs text-destructive"
          >
            Couldn’t load options.
            <Button type="button" size="sm" variant="ghost" onClick={() => void records.refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <div className="space-y-2 border-t p-2">
            <p role="status" className="px-1 text-xs text-muted-foreground">
              {records.isFetching
                ? 'Loading options…'
                : `${records.data?.meta.total ?? 0} available · page ${page}`}
            </p>
            <div className="flex justify-between gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={page <= 1 || records.isFetching}
                onClick={() => setPage(page - 1)}
              >
                Previous options
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={!records.data?.meta.hasNextPage || records.isFetching}
                onClick={() => setPage(page + 1)}
              >
                Next options
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
