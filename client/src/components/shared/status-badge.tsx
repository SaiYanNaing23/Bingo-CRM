import { Badge } from '@/components/ui/badge'
import { friendly } from '@/lib/fields'
import { cn } from '@/lib/utils'
export function StatusBadge({ value }: { value: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'whitespace-nowrap px-2 py-0.5 font-medium',
        ['ACTIVE', 'COMPLETED', 'OFFER'].includes(value)
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200'
          : ['HIGH', 'URGENT', 'REJECTED'].includes(value)
            ? 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-200'
            : ['IN_PROGRESS', 'HR', 'TECHNICAL', 'APPLIED'].includes(value)
              ? 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-200'
              : 'border-border bg-muted text-muted-foreground',
      )}
    >
      {friendly(value)}
    </Badge>
  )
}
