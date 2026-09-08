import { formatInTimeZone, fromZonedTime } from 'date-fns-tz'
export const browserTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
export const isTimezone = (zone: string) => {
  try {
    if (!zone || /^[+-]/.test(zone)) return false
    new Intl.DateTimeFormat('en', { timeZone: zone })
    return true
  } catch {
    return false
  }
}
export const localInput = (iso: string | null | undefined, zone: string) => {
  if (!iso) return ''
  try {
    return formatInTimeZone(iso, zone, "yyyy-MM-dd'T'HH:mm:ss")
  } catch {
    return ''
  }
}
export function toTimestamp(value: string, zone: string): string {
  if (!isTimezone(zone)) throw new Error('Choose a valid named timezone.')
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(value))
    throw new Error('Enter a complete date and time.')
  const normalized = value.length === 16 ? `${value}:00` : value
  const date = fromZonedTime(normalized, zone)
  if (Number.isNaN(date.getTime()) || localInput(date.toISOString(), zone) !== normalized)
    throw new Error('This local time does not exist. Choose another time (check daylight saving).')
  return date.toISOString()
}
export function displayDate(value: unknown, zone = browserTimezone()) {
  if (typeof value !== 'string' || !value) return 'Not scheduled'
  try {
    return formatInTimeZone(value, isTimezone(zone) ? zone : 'UTC', 'MMM d, yyyy · HH:mm')
  } catch {
    return 'Date unavailable'
  }
}
