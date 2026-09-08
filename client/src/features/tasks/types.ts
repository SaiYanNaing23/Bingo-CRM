import type { PageMeta, RecordBase } from '@/lib/api-types'
export const taskTypes = [
  'JOB_APPLICATION',
  'FOLLOW_UP',
  'INTERVIEW',
  'LEARNING',
  'PROJECT',
  'OTHER',
] as const
export const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const
export const statuses = ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const
export const repeats = ['NONE', 'DAILY', 'WEEKLY', 'MONTHLY'] as const
export interface Task extends RecordBase {
  title: string
  type: (typeof taskTypes)[number]
  priority: (typeof priorities)[number]
  dueDate: string | null
  timezone: string
  status: (typeof statuses)[number]
  repeatPattern: (typeof repeats)[number]
  completedAt: string | null
  recurrenceSourceId: string | null
}
export interface Completion {
  task: Task
  nextTask: Task | null
}
export interface Today {
  date: string
  timezone: string
  range: { from: string; to: string }
  tasks: Task[]
  meta: PageMeta
  summary: {
    dueToday: number
    pendingToday: number
    inProgressToday: number
    completedToday: number
    cancelledToday: number
    overdue: number
    unscheduled: number
  }
}
