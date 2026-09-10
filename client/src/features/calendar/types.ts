import type { PageMeta, RecordBase } from '@/lib/api-types'

export const calendarTypes = ['INTERVIEW', 'FOLLOW_UP', 'DEADLINE', 'OTHER'] as const
export const calendarSourceTypes = ['COMPANY', 'CONTACT', 'APPLICATION', 'TASK', 'PROJECT'] as const
export const calendarRangeViews = ['day', 'week', 'month'] as const

export type CalendarEventType = (typeof calendarTypes)[number]
export type CalendarSourceType = (typeof calendarSourceTypes)[number]
export type CalendarRangeView = (typeof calendarRangeViews)[number]

export interface CalendarEvent extends RecordBase {
  title: string
  type: CalendarEventType
  startAt: string
  endAt: string | null
  timezone: string
  reminders: number[]
  sourceEntityType: CalendarSourceType | null
  sourceEntityId: string | null
  sourceAvailable: boolean | null
}

export interface CalendarRange {
  view: CalendarRangeView | 'custom'
  timezone: string
  range: {
    from: string
    to: string
  }
  events: CalendarEvent[]
  meta: PageMeta
}

export interface CalendarReminder {
  id: string
  eventId: string
  title: string
  type: CalendarEventType
  startAt: string
  timezone: string
  minutesBefore: number
  remindAt: string
}

export interface CalendarPayload {
  title: string
  type: CalendarEventType
  startAt: string
  endAt: string | null
  timezone: string
  reminders: number[]
  sourceEntityType: CalendarSourceType | null
  sourceEntityId: string | null
}
