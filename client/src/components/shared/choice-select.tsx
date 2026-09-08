import type { ComponentProps } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

type Props = Omit<ComponentProps<typeof SelectTrigger>, 'value' | 'onChange'> & {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string; disabled?: boolean }[]
  placeholder?: string
}
const emptyValue = '__empty__'

export function ChoiceSelect({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  disabled,
  className,
  ...props
}: Props) {
  return (
    <Select
      value={value || emptyValue}
      onValueChange={(next) => onChange(next === emptyValue ? '' : next)}
      disabled={disabled}
    >
      <SelectTrigger className={cn('w-full', className)} {...props}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent position="popper" align="start">
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value || emptyValue}
            disabled={option.disabled}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
