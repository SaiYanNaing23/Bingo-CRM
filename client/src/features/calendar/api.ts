import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/auth-context'
import { request } from '@/lib/api-client'
import type { Page, Params, Success } from '@/lib/api-types'
import {
  type CalendarEvent,
  type CalendarPayload,
  type CalendarRange,
  type CalendarReminder,
} from './types'

export const listCalendarEvents = (params: Params, signal?: AbortSignal) =>
  request<Page<CalendarEvent>>('/calendar/events', { params, signal })

export const getCalendarEvent = (id: string, signal?: AbortSignal) =>
  request<Success<CalendarEvent>>(`/calendar/events/${encodeURIComponent(id)}`, { signal })

export const getCalendarRange = (params: Params, signal?: AbortSignal) =>
  request<Success<CalendarRange>>('/calendar/range', { params, signal })

export const getCalendarReminders = (params: Params, signal?: AbortSignal) =>
  request<Page<CalendarReminder>>('/calendar/reminders', { params, signal })

export function useCalendarEvents(params: Params, enabled = true) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['crm', user?.id, 'calendar', 'events', params],
    queryFn: ({ signal }) => listCalendarEvents(params, signal),
    enabled: !!user && enabled,
  })
}

export function useCalendarEvent(id: string | undefined, enabled = true) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['crm', user?.id, 'calendar', 'event', id],
    queryFn: ({ signal }) => getCalendarEvent(id!, signal),
    enabled: !!user && !!id && enabled,
  })
}

export function useCalendarRange(params: Params, enabled = true) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['crm', user?.id, 'calendar', 'range', params],
    queryFn: ({ signal }) => getCalendarRange(params, signal),
    enabled: !!user && enabled,
  })
}

export function useCalendarReminders(params: Params, enabled = true) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['crm', user?.id, 'calendar', 'reminders', params],
    queryFn: ({ signal }) => getCalendarReminders(params, signal),
    enabled: !!user && enabled,
  })
}

export function useCalendarReminderCount() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['crm', user?.id, 'calendar', 'reminder-count', 'next-24-hours'],
    queryFn: ({ signal }) => {
      const from = new Date()
      const to = new Date(from.getTime() + 24 * 60 * 60 * 1000)
      return getCalendarReminders(
        {
          from: from.toISOString(),
          to: to.toISOString(),
          page: 1,
          limit: 1,
        },
        signal,
      )
    },
    enabled: !!user,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  })
}

export function useRescheduleCalendarEvent() {
  const { user } = useAuth()
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: Pick<CalendarPayload, 'startAt' | 'endAt' | 'timezone'>
    }) =>
      request<Success<CalendarEvent>>('/calendar/events/' + encodeURIComponent(id), {
        method: 'PUT',
        body: payload,
      }),
    onSuccess: async () => {
      if (!user?.id) return
      await client.invalidateQueries({ queryKey: ['crm', user.id, 'calendar'] })
    },
  })
}

export function useSaveCalendarEvent(id?: string) {
  const { user } = useAuth()
  const client = useQueryClient()
  return useMutation({
    mutationFn: (body: CalendarPayload) =>
      id
        ? request<Success<CalendarEvent>>(`/calendar/events/${encodeURIComponent(id)}`, {
            method: 'PUT',
            body,
          })
        : request<Success<CalendarEvent>>('/calendar/events', { method: 'POST', body }),
    onSuccess: async () => {
      if (!user?.id) return
      await client.invalidateQueries({ queryKey: ['crm', user.id, 'calendar'] })
    },
  })
}

export function useDeleteCalendarEvent() {
  const { user } = useAuth()
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      request<Success<{ id: string; deleted: true }>>(`/calendar/events/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),
    onSuccess: async () => {
      if (!user?.id) return
      await client.invalidateQueries({ queryKey: ['crm', user.id, 'calendar'] })
    },
  })
}
