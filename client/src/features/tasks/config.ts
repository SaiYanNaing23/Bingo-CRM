import type { ResourceConfig } from '@/lib/fields'
import { priorities, repeats, statuses, taskTypes } from './types'
export const tasksConfig: ResourceConfig = {
  kind: 'tasks',
  singular: 'task',
  title: 'Tasks',
  nameKey: 'title',
  description: 'Small steps that keep your search moving.',
  defaultSort: 'dueDate',
  sorts: ['dueDate', 'priority', 'title', 'createdAt', 'updatedAt'],
  columns: [
    { key: 'title', label: 'Task' },
    { key: 'type', label: 'Type' },
    { key: 'priority', label: 'Priority' },
    { key: 'dueDate', label: 'Due date' },
    { key: 'status', label: 'Status' },
  ],
  filters: [
    { key: 'status', label: 'Status', options: statuses },
    { key: 'priority', label: 'Priority', options: priorities },
    { key: 'type', label: 'Type', options: taskTypes },
    { key: 'repeatPattern', label: 'Repeat', options: repeats },
    { key: 'dueDateFrom', label: 'Due from', type: 'datetime' },
    { key: 'dueDateTo', label: 'Due to', type: 'datetime' },
  ],
  fields: [
    { key: 'title', label: 'Task title', required: true, min: 2, max: 200 },
    { key: 'type', label: 'Type', type: 'select', options: taskTypes, default: 'OTHER' },
    { key: 'priority', label: 'Priority', type: 'select', options: priorities, default: 'MEDIUM' },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: ['TODO', 'IN_PROGRESS', 'CANCELLED'],
      default: 'TODO',
    },
    { key: 'timezone', label: 'Timezone', type: 'timezone', required: true },
    { key: 'dueDate', label: 'Due date', type: 'datetime' },
    {
      key: 'repeatPattern',
      label: 'Repeat',
      type: 'select',
      options: repeats,
      default: 'NONE',
      hint: 'Completing a repeating task creates its next occurrence from the previous due date.',
    },
  ],
}
