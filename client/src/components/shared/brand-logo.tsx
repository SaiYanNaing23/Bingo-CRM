import { cn } from '@/lib/utils'

// The accompanying brand name or link label supplies the accessible name.
export function BrandLogo({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative block size-8 shrink-0 overflow-hidden rounded-md bg-white',
        className,
      )}
    >
      <img
        src="/branding/bingo-crm-logo.png"
        alt=""
        width={800}
        height={800}
        // Reduce the original white margins while keeping the complete artwork visible.
        className="absolute inset-0 size-full scale-[1.4] object-contain"
      />
    </span>
  )
}
